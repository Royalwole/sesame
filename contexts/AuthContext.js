import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  ttl: 600000, // 10 minutes (increased from 5 minutes for better UX)
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
  const MAX_SYNC_ATTEMPTS = 3;

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

    // Check for role in Clerk metadata first
    const role = user.publicMetadata?.role || ROLES.USER;

    return {
      clerkId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      role: role,
      isFallback: true, // Flag to indicate this isn't from DB
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

        // Sign out via Clerk
        await signOut();

        // Redirect if needed
        if (redirectToSignIn) {
          router.push(`/auth/sign-in`);
        }
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
        const response = await fetch("/api/users/sync", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: AbortSignal.timeout(8000), // Modern timeout approach
        });

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
        setError(null);
      } catch (err) {
        console.error(`User sync failed:`, err.message);

        // Handle common error cases
        if (err.name === "TimeoutError" || err.name === "AbortError") {
          setError("Connection timed out. Please try again.");
        } else if (err.message.includes("401")) {
          setError("Authentication error. Please sign in again.");
          if (syncAttempts >= 2) {
            console.warn("Multiple auth failures, signing out");
            setTimeout(() => handleSignOut(true), 500);
            return;
          }
        } else {
          setError("Could not sync user data. Please try again later.");
        }

        // Use fallback user data from Clerk if possible
        if (user) {
          const fallbackUser = createFallbackUser();
          setDbUser(fallbackUser);
          updateCachedUser(fallbackUser);
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
      user,
      checkCachedUser,
      updateCachedUser,
      handleSignOut,
      syncAttempts,
      createFallbackUser,
    ]
  );

  // Initial data sync when auth state changes
  useEffect(() => {
    // Only sync when Clerk is loaded and we know about DB connection
    if (isLoaded && isConnected !== undefined) {
      syncUserData();
    }
  }, [isSignedIn, isLoaded, isConnected, syncUserData]);

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
