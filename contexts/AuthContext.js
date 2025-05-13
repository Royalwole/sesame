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

import {
  getUserRole,
  getApprovalStatus,
  refreshUserSession,
} from "../lib/clerk-client"; // Changed from clerk-role-management to client-safe version

// Import the API resilience utilities
import { fetchUserProfile, makeResilient } from "../lib/api-resilience";

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
  const clerk = useClerk();
  const { isConnected } = useDatabaseConnection();

  // State for storing the MongoDB user document
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useCache, setUseCache] = useState(false);
  const [loopDetected, setLoopDetected] = useState(false);

  // Derived state (calculated from Clerk directly)
  const [role, setRole] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  // Role-specific state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isPendingAgent, setIsPendingAgent] = useState(false);

  // Track fetch attempts for better error messaging
  const fetchAttempts = useRef(0);
  const lastFetchTime = useRef(null);

  // Circuit breaker pattern - detect potential loops
  useEffect(() => {
    // Check URL for signs of redirect loops
    const hasNoRedirect = router.query.noRedirect === "true";
    const hasBreakLoop = router.query.breakLoop === "true";
    const hasRedirectCounter = router.query.rc && parseInt(router.query.rc) > 0;
    const hasTooManyTimestamps = (router.asPath.match(/t=/g) || []).length > 1;

    // If we detect potential loops, set the loop detection state
    if (
      hasNoRedirect ||
      hasBreakLoop ||
      hasRedirectCounter ||
      hasTooManyTimestamps
    ) {
      console.warn(
        "[AuthContext] Potential redirect loop detected, activating circuit breaker"
      );
      setLoopDetected(true);
    } else {
      setLoopDetected(false);
    }

    // Also check localStorage for a loop counter
    try {
      const loopCount = localStorage.getItem("td_redirect_loop_count");
      if (loopCount && parseInt(loopCount) > 3) {
        console.warn(
          "[AuthContext] Excessive redirects detected via localStorage"
        );
        setLoopDetected(true);
        // Reset after a while to allow the system to recover
        setTimeout(() => {
          localStorage.setItem("td_redirect_loop_count", "0");
        }, 60000); // 1 minute timeout
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [router.query, router.asPath]);

  // Track redirects to detect loops
  useEffect(() => {
    if (!loopDetected && router.asPath.includes("redirect")) {
      try {
        // Increment redirect counter in localStorage
        const currentCount = parseInt(
          localStorage.getItem("td_redirect_loop_count") || "0"
        );
        localStorage.setItem(
          "td_redirect_loop_count",
          String(currentCount + 1)
        );

        // Auto-reset after 30 seconds of no redirects
        setTimeout(() => {
          localStorage.setItem("td_redirect_loop_count", "0");
        }, 30000);
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [router.asPath, loopDetected]);

  // Read user data from cache
  const readFromCache = useCallback(() => {
    try {
      const cachedDataStr = localStorage.getItem(USER_CACHE_CONFIG.storageKey);
      if (!cachedDataStr) return null;

      const cachedData = JSON.parse(cachedDataStr);
      const now = Date.now();

      // Check if cached data is still valid
      if (
        cachedData &&
        cachedData.expiresAt > now &&
        cachedData.userId === userId
      ) {
        return cachedData.user;
      }

      return null;
    } catch (err) {
      console.warn("Error reading from cache:", err);
      return null;
    }
  }, [userId]);

  // Save user data to cache
  const saveToCache = useCallback(
    (userData) => {
      if (!userData || !userId) return;

      try {
        const expiresAt = Date.now() + USER_CACHE_CONFIG.ttl;
        localStorage.setItem(
          USER_CACHE_CONFIG.storageKey,
          JSON.stringify({
            userId,
            user: userData,
            expiresAt,
          })
        );
      } catch (err) {
        console.warn("Error saving to cache:", err);
      }
    },
    [userId]
  );

  // Fetch the MongoDB user document with enhanced resilience
  const fetchUserData = useCallback(
    async (forceRefresh = false) => {
      // Safety check: exit early if prerequisites not met
      if (!isSignedIn || !isLoaded || !userId) {
        setIsLoading(false);
        return;
      }

      // Don't trigger multiple simultaneous fetches
      if (lastFetchTime.current && Date.now() - lastFetchTime.current < 2000) {
        console.log("Skipping duplicate fetchUserData call");
        return;
      }

      // Check if we should use cached data
      if (!forceRefresh && !isConnected) {
        const cachedUser = readFromCache();
        if (cachedUser) {
          console.log("Using cached user data (offline mode)");
          setDbUser(cachedUser);
          setUseCache(true);
          setIsLoading(false);
          return;
        }
      }

      // Create a stable mounted ref
      const isMountedRef = { current: true };
      setIsLoading(true);
      fetchAttempts.current++;
      lastFetchTime.current = Date.now();

      try {
        // Use the resilient profile fetch instead of direct API call
        // This will never throw errors and always return usable data
        const userData = await fetchUserProfile();

        if (isMountedRef.current) {
          setDbUser(userData);
          setError(null);
          saveToCache(userData); // Save to cache for offline use
          setUseCache(false);
        }
      } catch (error) {
        // This catch should rarely be triggered due to resilience layer,
        // but we keep it as a safety measure
        console.error("Error in fetchUserData:", error);

        if (isMountedRef.current) {
          setError(error.message);

          // Try to use cached data as fallback
          const cachedUser = readFromCache();
          if (cachedUser) {
            console.log("Using cached user data after fetch error");
            setDbUser(cachedUser);
            setUseCache(true);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }

      // Return cleanup function
      return () => {
        isMountedRef.current = false;
      };
    },
    [isSignedIn, isLoaded, userId, isConnected, readFromCache, saveToCache]
  );

  // Force refresh the user session to get the latest metadata
  const refreshSession = useCallback(async () => {
    if (!clerk) return;

    try {
      await refreshUserSession(clerk);
      console.log("User session refreshed successfully");
      return true;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
  }, [clerk]);

  // Function to refresh user data
  const syncUserData = useCallback(
    async (forceRefresh = false) => {
      try {
        await fetchUserData(forceRefresh);

        // Only force session refresh if explicitly requested
        if (forceRefresh) {
          try {
            // Using the improved refreshSession that handles network errors gracefully
            const refreshSuccessful = await refreshSession();
            if (!refreshSuccessful) {
              console.log(
                "Session refresh skipped due to network issues - using cached data"
              );
            }
          } catch (error) {
            // Swallow the error to prevent crashes
            console.error("Error during session refresh:", error);
          }
        }
      } catch (error) {
        console.error("Error syncing user data:", error);
        // Don't rethrow - we've already handled the error in fetchUserData
      }
    },
    [fetchUserData, refreshSession]
  );

  // Update derived role state based on Clerk user metadata (source of truth)
  useEffect(() => {
    if (!isLoaded || !user) {
      setRole(null);
      setIsApproved(false);
      setIsAdmin(false);
      setIsAgent(false);
      setIsPendingAgent(false);
      return;
    }

    // Get role and approval status directly from Clerk
    const currentRole = getUserRole(user);
    const approved = getApprovalStatus(user);

    // Update state
    setRole(currentRole);
    setIsApproved(approved);

    // Update role flags
    setIsAdmin(checkIsAdmin(user));
    setIsAgent(checkIsApprovedAgent(user));
    setIsPendingAgent(checkIsPendingAgent(user));
  }, [isLoaded, user]);

  // Fetch user data on initial load or when signed in state changes
  useEffect(() => {
    // Create a ref to track if component is mounted
    const isMounted = { current: true };

    // Call fetchUserData and capture its cleanup function
    const cleanup = fetchUserData();

    // Return cleanup function to React that combines our own cleanup with fetchUserData's cleanup
    return () => {
      isMounted.current = false;
      // Call the fetchUserData cleanup function if it exists
      if (cleanup && typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [fetchUserData]);

  // User sign-out handler with proper error handling
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // No need to navigate - Clerk will handle the redirect
    } catch (error) {
      console.error("Error signing out:", error);
      // Force a hard redirect if Clerk signOut fails
      window.location.href = "/";
    }
  }, [signOut]);

  // Context value
  const value = {
    user,
    dbUser,
    isSignedIn,
    isLoaded,
    isLoading,
    error,
    useCache,
    role,
    isAdmin,
    isAgent,
    isPendingAgent,
    isApproved,
    loopDetected, // Expose the loop detection state to consumers
    signOut: handleSignOut,
    syncUserData,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
