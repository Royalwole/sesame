import {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

// Create context
const AuthContext = createContext();

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;
const USER_CACHE_KEY = "td_user_cache";
const USER_CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Auth provider component
export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [dbUser, setDbUser] = useState(null);
  const [isDBLoading, setIsDBLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [syncCount, setSyncCount] = useState(0);

  // Add a ref to track component mounted state
  const isMounted = useRef(true);

  // Track pending request and timeout
  const pendingRequest = useRef(null);

  // Track if initial load is complete
  const initialLoadComplete = useRef(false);

  // Roles and permissions
  const isAuth = isLoaded && isSignedIn;
  const isAgent = dbUser?.role === "agent" || dbUser?.role === "agent_pending";
  const isApprovedAgent = dbUser?.role === "agent" && dbUser?.approved;
  const isAdmin = dbUser?.role === "admin";

  // Debug logging
  useEffect(() => {
    console.log("AuthContext state:", {
      isLoaded,
      isSignedIn,
      hasUser: !!user,
      hasDbUser: !!dbUser,
      isDBLoading,
      syncError,
      syncCount,
    });
  }, [isLoaded, isSignedIn, user, dbUser, isDBLoading, syncError, syncCount]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;

      // Abort any pending request when unmounting
      if (
        pendingRequest.current &&
        typeof pendingRequest.current.abort === "function"
      ) {
        pendingRequest.current.abort();
      }
    };
  }, []);

  // Function to check if cached user data is valid
  const isValidCache = useCallback((cachedData) => {
    if (!cachedData) return false;

    try {
      const { updatedAt } = cachedData;
      if (!updatedAt) return false;

      const cacheTime = new Date(updatedAt).getTime();
      const now = new Date().getTime();

      // Cache is valid if less than 1 hour old
      return now - cacheTime < USER_CACHE_DURATION;
    } catch (e) {
      return false;
    }
  }, []);

  // Function to fetch user data with retry mechanism
  const fetchUserData = useCallback(
    async (retryCount = 0, forceRefresh = false) => {
      if (!isLoaded || (!isSignedIn && !forceRefresh) || !isMounted.current) {
        console.log(
          "Auth: Not loaded, not signed in, or unmounted - skip fetch"
        );
        setIsDBLoading(false);
        return;
      }

      // Increment sync count for debugging
      setSyncCount((prev) => prev + 1);

      // Create a controller that we'll keep a reference to
      const controller = new AbortController();
      pendingRequest.current = controller;

      let timeoutId = null;

      try {
        console.log(
          `Auth: Fetching user data, attempt: ${retryCount + 1}${forceRefresh ? " (forced)" : ""}`
        );

        // Set up a timeout with a ref to clear it
        timeoutId = setTimeout(() => {
          console.log("Auth: User data fetch timed out");
          controller.abort(new Error("Fetch timeout"));
        }, 8000); // 8s timeout for faster feedback

        // Add cache busting for forced refresh
        const cacheBuster = `?_t=${Date.now()}`;
        const response = await fetch(
          `/api/users/me${forceRefresh ? cacheBuster : ""}`,
          {
            credentials: "include",
            headers: {
              "Cache-Control": forceRefresh ? "no-cache, no-store" : "default",
              Pragma: forceRefresh ? "no-cache" : "default",
              "X-Sync-Count": syncCount.toString(),
              "X-Force-Refresh": forceRefresh ? "1" : "0",
            },
            signal: controller.signal,
          }
        );

        // Clear the timeout now that we have a response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Check if component is still mounted
        if (!isMounted.current) return;

        // Handle non-successful responses
        if (!response.ok) {
          console.error(`Auth: API error ${response.status}`);

          // If the API returns an error but we're still logged in to Clerk
          // create a fallback user with basic properties
          if (isSignedIn && user) {
            console.log(
              "Auth: API error but user is signed in - using fallback"
            );
            const fallbackUser = createFallbackUser(user);

            setDbUser(fallbackUser);
            setIsDBLoading(false);

            // Cache the fallback user
            cacheUserData(fallbackUser);

            return;
          }

          throw new Error(`Server error: ${response.status}`);
        }

        // Parse the response
        const data = await response.json();
        console.log(`Auth: Received data:`, {
          success: data.success,
          hasUser: !!data.user,
          isFallback: data.user?.isFallback,
          message: data.message || "No message",
        });

        if (data?.user) {
          console.log(
            "Auth: User data fetched successfully:",
            data.user.role || "no role"
          );

          setDbUser(data.user);
          setSyncError(null);
          setIsDBLoading(false);

          // Cache the user data
          cacheUserData(data.user);

          // Mark initial load as complete
          initialLoadComplete.current = true;
        } else {
          throw new Error("Invalid user data response");
        }
      } catch (error) {
        // Clear the timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Only process errors if the component is still mounted
        if (!isMounted.current) return;

        console.error("Error fetching user data:", error.message);

        // Create a more user-friendly error message based on the error
        let userErrorMessage = "Error syncing your account";

        if (error.name === "AbortError") {
          userErrorMessage = "Request timed out. Server may be busy.";
        } else if (error.message.includes("500")) {
          userErrorMessage = "Server error. We're working on it.";
        } else if (error.message.includes("Failed to fetch")) {
          userErrorMessage = "Network connection issue. Check your internet.";
        }

        setSyncError(userErrorMessage);

        // Implement retry with exponential backoff
        if (retryCount < MAX_RETRIES && isMounted.current) {
          console.log(
            `Retrying user data fetch (${retryCount + 1}/${MAX_RETRIES})...`
          );

          // Only show toast on first retry to avoid spamming
          if (retryCount === 0 && isMounted.current) {
            toast.error("Error syncing user data. Retrying...");
          }

          // Set a timeout for retry with increasing delay
          const delay = RETRY_DELAY * Math.pow(1.5, retryCount);
          const retryTimeoutId = setTimeout(() => {
            if (isMounted.current) {
              fetchUserData(retryCount + 1);
            }
          }, delay);

          // Store the timeout ID in a way that can be cleaned up
          pendingRequest.current = {
            abort: () => clearTimeout(retryTimeoutId),
          };
        } else if (isMounted.current) {
          // Create a minimal fallback user after max retries
          if (!dbUser && isSignedIn && user) {
            console.log("Setting fallback user data after failed fetches");
            const fallbackUser = createFallbackUser(user);
            setDbUser(fallbackUser);

            // Cache the fallback user
            cacheUserData(fallbackUser);

            toast(
              "Using limited account data. Some features may be unavailable.",
              { icon: "⚠️" }
            );
          }

          // Finally set loading to false
          setIsDBLoading(false);
          initialLoadComplete.current = true;
        }
      } finally {
        // Ensure we exit loading state even if network is down
        if (retryCount >= MAX_RETRIES && isMounted.current) {
          console.log("Auth: Max retries reached, forcing loading state off");
          setIsDBLoading(false);
          initialLoadComplete.current = true;
        }

        // Clear timeout and pending request
        if (timeoutId) clearTimeout(timeoutId);
        pendingRequest.current = null;
      }
    },
    [isLoaded, isSignedIn, user, syncCount]
  );

  // Helper to create a fallback user
  const createFallbackUser = useCallback((user) => {
    if (!user) return null;

    return {
      clerkId: user.id,
      firstName: user.firstName || "User",
      lastName: user.lastName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      role: user.publicMetadata?.role || "user",
      _id: `temp-${user.id.substring(0, 8)}`,
      isFallback: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  // Helper to cache user data
  const cacheUserData = useCallback((userData) => {
    if (!userData || typeof window === "undefined") return;

    try {
      // Store minimal user data to reduce storage size
      const minimalUserData = {
        _id: userData._id,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(minimalUserData));
    } catch (e) {
      console.error("Failed to cache user data", e);
    }
  }, []);

  // Function to forcefully refresh user data
  const refreshUserData = useCallback(() => {
    console.log("Auth: Manually refreshing user data");
    setIsDBLoading(true);
    fetchUserData(0, true); // Force refresh
  }, [fetchUserData]);

  // Restore cached data on initial load
  useEffect(() => {
    if (!initialLoadComplete.current && typeof window !== "undefined") {
      try {
        const cachedData = localStorage.getItem(USER_CACHE_KEY);
        if (cachedData) {
          const userData = JSON.parse(cachedData);

          // Only use cache if it's valid
          if (isValidCache(userData)) {
            console.log("Auth: Using cached user data");
            setDbUser(userData);
          } else {
            console.log("Auth: Cached data expired or invalid");
            localStorage.removeItem(USER_CACHE_KEY);
          }
        }
      } catch (e) {
        console.error("Failed to restore cached user data", e);
      }
    }
  }, [isValidCache]);

  // Clear cache on sign out
  const handleSignOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_CACHE_KEY);
    }
    await signOut();
  }, [signOut]);

  // Fetch user data when auth state changes
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user) {
        // Only fetch if we don't have user data or have fallback data
        if (!dbUser || dbUser.isFallback) {
          setIsDBLoading(true);
          fetchUserData();
        }
      } else {
        // Clear user data when signed out
        setDbUser(null);
        setIsDBLoading(false);
      }
    }
  }, [isLoaded, isSignedIn, user?.id, dbUser, fetchUserData]);

  // Provide context value
  const value = {
    isAuthenticated: isAuth,
    user: user,
    dbUser,
    isAdmin,
    isAgent,
    isApprovedAgent,
    isLoading: !isLoaded || isDBLoading,
    hasError: !!syncError,
    error: syncError,
    syncUserData: refreshUserData,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
