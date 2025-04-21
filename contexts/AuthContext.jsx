import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useDatabaseConnection } from "./DatabaseContext";
import { useRouter } from "next/router";

// Create context
const AuthContext = createContext();

// Cache configuration with improved TTL
const USER_CACHE_CONFIG = {
  storageKey: "td_user_cache",
  ttl: 300000, // 5 minutes (increased from 1 minute)
};

// Auth provider component
export function AuthProvider({ children }) {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
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
      if (cached && 
          cached.updatedAt && 
          cached.clerkId === user?.id &&
          (Date.now() - new Date(cached.updatedAt).getTime()) < USER_CACHE_CONFIG.ttl) {
        console.log("Using valid cached user data");
        return cached;
      }
    } catch (e) {
      console.error("Error parsing cached user data:", e);
    }
    
    return null;
  }, [user?.id]);
  
  // Save user data to cache
  const updateCachedUser = useCallback((userData) => {
    if (typeof window === "undefined" || !userData) return;
    
    try {
      const cacheData = {
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(USER_CACHE_CONFIG.storageKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error("Error caching user data:", e);
    }
  }, []);

  // Create fallback user from Clerk data
  const createFallbackUser = useCallback(() => {
    if (!user) return null;
    
    return {
      clerkId: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      role: "user", // Default role
      isFallback: true // Flag to indicate this isn't from DB
    };
  }, [user]);

  // Handle sign out with cleanup
  const handleSignOut = useCallback(async (redirectToSignIn = true) => {
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
        const currentPath = router.asPath;
        router.push(`/auth/sign-in?redirect_url=${encodeURIComponent(currentPath)}`);
      }
    } catch (e) {
      console.error("Error during sign out:", e);
    }
  }, [signOut, router]);

  // Sync Clerk user with database user
  const syncUserData = useCallback(async (force = false) => {
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
      console.log("Fetching user data from server...");
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const response = await fetch(`/api/users/me?cb=${cacheBuster}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": `req_${Date.now().toString(36)}`
        },
        credentials: "include",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data?.success || !data?.user) {
        throw new Error(data?.error || "Invalid response format");
      }
      
      // Success - update user data and cache
      console.log("User data loaded successfully:", data.user.role);
      setDbUser(data.user);
      setLastSynced(new Date());
      updateCachedUser(data.user);
      setSyncAttempts(0);
      
    } catch (err) {
      console.error("Error syncing user data:", err);
      
      // Improved error categorization
      if (err.name === 'AbortError') {
        console.error("Request timed out");
        setError("Connection timed out. Please try again.");
      } else if (err.message.includes('401')) {
        // Authentication issue
        console.error("Authentication error:", err);
        setError("Authentication error. Please sign in again.");
        
        // Consider clearing session on auth errors if recurring
        if (syncAttempts >= 2) {
          console.warn("Multiple auth failures detected, signing out");
          setTimeout(() => handleSignOut(true), 500);
          return;
        }
      } else if (err.message.includes('404')) {
        // User not found in database
        console.error("User not found in database:", err);
        setError("Your account needs to be set up in our system. Please contact support.");
      } else if (err.message.includes('Network')) {
        // Network connectivity issues
        console.error("Network error:", err);
        setError("Network connection issue. Please check your internet connection.");
      } else {
        // Generic error
        console.error("Unknown error syncing user data:", err);
        setError(err.message || "Unknown error occurred");
      }
      
      // Create fallback user from Clerk data if possible
      if (user) {
        const fallbackUser = createFallbackUser();
        setDbUser(fallbackUser);
        updateCachedUser(fallbackUser);
      }
      
      // Increment sync attempts
      setSyncAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
      setLastSynced(new Date());
    }
  }, [isSignedIn, isLoaded, user, checkCachedUser, updateCachedUser, handleSignOut, syncAttempts, createFallbackUser]);
  
  // Initial data sync when auth state changes
  useEffect(() => {
    // Only sync when Clerk is loaded and we know about DB connection
    if (isLoaded && isConnected !== undefined) {
      syncUserData();
    }
  }, [isSignedIn, isLoaded, isConnected, syncUserData]);

  // Derived auth state
  const isAuthenticated = !!isSignedIn;
  const isAdmin = dbUser?.role === "admin";
  const isAgent = ["agent", "agent_pending"].includes(dbUser?.role);
  const isApprovedAgent = dbUser?.role === "agent" && dbUser?.approved === true;
  const isPendingAgent = dbUser?.role === "agent_pending";
  const hasError = !!error;

  // Provide all auth values
  const authContextValue = {
    // User state
    user,               // Raw clerk user
    dbUser,             // Database user
    isAuthenticated,    // Is signed in
    
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
    signOut: handleSignOut
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
