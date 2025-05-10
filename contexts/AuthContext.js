import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/nextjs";
import { useDatabaseConnection } from "./DatabaseContext";
import { useRouter } from "next/router";
import {
  ROLES,
  isAdmin as checkIsAdmin,
  isApprovedAgent as checkIsApprovedAgent,
  isPendingAgent as checkIsPendingAgent,
  isAnyAgent as checkIsAnyAgent,
} from "../lib/role-management";

// Create context
const AuthContext = createContext();

// Cache configuration
const USER_CACHE_CONFIG = {
  storageKey: "td_user_cache",
  ttl: 1800000, // 30 minutes (increased from 10 minutes for better offline resilience)
};

// Auth provider component
export function AuthProvider({ children }) {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { userId } = useClerkAuth();
  const { signOut } = useClerk();
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const { isConnected } = useDatabaseConnection();
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_SYNC_ATTEMPTS = 3;
  const MAX_RETRIES = 2;
  // Use a ref to track if we've already tried to sync to prevent loops
  const hasSyncedRef = useRef(false);
  // Track the user ID to detect actual changes
  const previousUserIdRef = useRef(null);

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback((retryAttempt) => {
    // Base delay of 1 second with exponential backoff capped at 10 seconds
    const delay = Math.min(Math.pow(2, retryAttempt) * 1000, 10000);
    // Add some randomness to prevent all clients retrying at the same time
    return delay + Math.random() * 1000;
  }, []);

  // Check if we should use cached user data
  const checkCachedUser = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      const cachedData = localStorage.getItem(USER_CACHE_CONFIG.storageKey);
      if (!cachedData) return null;

      const cached = JSON.parse(cachedData);

      // Validate cache freshness and user match
      if (
        cached &&
        cached.updatedAt &&
        cached.clerkId === user?.id &&
        Date.now() - new Date(cached.updatedAt).getTime() <
          USER_CACHE_CONFIG.ttl
      ) {
        console.log("Using valid cached user data");
        return cached;
      }
    } catch (e) {
      console.error("Error parsing cached user data:", e);
      // If there's an error with the cache, clear it
      localStorage.removeItem(USER_CACHE_CONFIG.storageKey);
    }

    return null;
  }, [user?.id]);

  // Save user data to cache
  const updateCachedUser = useCallback((userData) => {
    if (typeof window === "undefined" || !userData) return;

    try {
      const cacheData = {
        ...userData,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        USER_CACHE_CONFIG.storageKey,
        JSON.stringify(cacheData)
      );
    } catch (e) {
      console.error("Error caching user data:", e);
    }
  }, []);

  // Create fallback user from Clerk data
  const createFallbackUser = useCallback(() => {
    if (!user) return null;

    // Always ensure we have a role
    const role = user.publicMetadata?.role || ROLES.USER;
    const approved = user.publicMetadata?.approved || true;

    console.log("Creating fallback user with role:", role);

    return {
      clerkId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      profileImage: user.imageUrl || "",
      role: role,
      approved: approved,
      isFallback: true, // Flag to indicate this isn't from DB
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [user]);

  // Handle sign out with cleanup
  const handleSignOut = useCallback(
    async (redirectToSignIn = true) => {
      try {
        // Clear local user data
        if (typeof window !== "undefined") {
          localStorage.removeItem(USER_CACHE_CONFIG.storageKey);
        }

        setDbUser(null);
        setError(null);
        setRetryCount(0); // Reset retry count on sign out
        hasSyncedRef.current = false; // Reset sync flag

        // Sign out via Clerk
        await signOut();

        // Redirect to home page instead of sign-in page
        router.push("/");
      } catch (e) {
        console.error("Error during sign out:", e);
      }
    },
    [signOut, router]
  );

  // Sync Clerk user with database user
  const syncUserData = useCallback(
    async (force = false) => {
      // Don't sync if not signed in or Clerk hasn't loaded
      if (!isSignedIn || !isLoaded) {
        setDbUser(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      // Check cache first unless forced refresh
      if (!force) {
        const cachedUser = checkCachedUser();
        if (cachedUser) {
          setDbUser(cachedUser);
          setLastSynced(new Date(cachedUser.updatedAt));
          setIsLoading(false);
          return;
        }
      }

      // Start loading state
      setIsLoading(true);
      setError(null);

      try {
        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 8000);

        const response = await fetch("/api/users/sync", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: abortController.signal,
        });

        // Clear the timeout since request completed
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data?.success || !data?.user) {
          throw new Error(data?.error || "Invalid response");
        }

        // Success path - update user data and cache it
        const userData = data.user;
        setDbUser(userData);
        setLastSynced(new Date());
        updateCachedUser(userData);
        setSyncAttempts(0);
        setRetryCount(0); // Reset retry count on success
        setError(null);
      } catch (err) {
        console.error(`User sync failed:`, err.message);

        // Create a fallback user to ensure dashboard access
        const fallbackUser = createFallbackUser();

        // Handle specific error types
        if (err.name === "AbortError") {
          console.warn("Sync timeout - using fallback user data");
          setError({
            type: "timeout",
            message: "Connection timed out. Using local data.",
            blocking: false,
          });

          // Retry with exponential backoff if we haven't hit max retries
          if (retryCount < MAX_RETRIES && !force) {
            const delay = getRetryDelay(retryCount);
            console.log(
              `Will retry sync in ${delay}ms (attempt ${retryCount + 1})`
            );

            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              syncUserData(true);
            }, delay);
          }
        } else if (err.message.includes("401")) {
          setError({
            type: "auth",
            message: "Authentication issue detected.",
            blocking: false,
          });

          // Only sign out after multiple auth failures and if not using fallback
          if (syncAttempts >= MAX_SYNC_ATTEMPTS && !dbUser?.isFallback) {
            console.warn("Multiple auth failures detected");
            // But don't immediately redirect - let user continue using dashboard
          }
        } else {
          // Generic error that doesn't block UI
          setError({
            type: "sync",
            message: "Background sync failed. Using available data.",
            blocking: false,
          });

          // Retry for network/server errors with exponential backoff
          if (retryCount < MAX_RETRIES && !force) {
            const delay = getRetryDelay(retryCount);
            console.log(
              `Will retry sync in ${delay}ms (attempt ${retryCount + 1})`
            );

            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              syncUserData(true);
            }, delay);
          }
        }

        // Always use fallback data to ensure UI access
        if (fallbackUser) {
          // Only set fallback user if we don't have a user already
          if (!dbUser) {
            setDbUser(fallbackUser);
            updateCachedUser(fallbackUser);
            console.log(
              "Using fallback user data to maintain dashboard access"
            );
          }
        }

        setSyncAttempts((prev) => prev + 1);
      } finally {
        setIsLoading(false);
        setLastSynced(new Date());
      }
    },
    [
      isSignedIn,
      isLoaded,
      checkCachedUser,
      updateCachedUser,
      createFallbackUser,
      getRetryDelay,
      retryCount,
      dbUser,
    ]
  );

  // Initial data sync when auth state changes
  useEffect(() => {
    // Skip if already synced for this user
    if (user?.id === previousUserIdRef.current && hasSyncedRef.current) {
      return;
    }

    // Only sync when Clerk is loaded and we know about DB connection
    if (isLoaded && isConnected !== undefined) {
      // Update tracking refs
      previousUserIdRef.current = user?.id;
      hasSyncedRef.current = true;

      // Execute the sync
      syncUserData();
    }
  }, [isSignedIn, isLoaded, isConnected, user?.id]);

  // Derived auth state using the role management utility functions
  const isAuthenticated = !!isSignedIn;
  const isAdmin = checkIsAdmin(dbUser);
  const isAgent = checkIsAnyAgent(dbUser);
  const isApprovedAgent = checkIsApprovedAgent(dbUser);
  const isPendingAgent = checkIsPendingAgent(dbUser);
  const hasError = !!error;

  // Provide all auth values
  const authContextValue = {
    // User state
    user, // Raw clerk user
    dbUser, // Database user
    isAuthenticated, // Is signed in

    // Role helpers
    isAdmin,
    isAgent,
    isApprovedAgent,
    isPendingAgent,

    // Status information
    isLoading,
    hasError,
    error,
    lastSynced,
    syncAttempts,

    // Actions
    syncUserData,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
