import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useDatabaseConnection } from "./DatabaseContext";
import { fetchJSON } from "../lib/fetchUtils";

// Create context
const AuthContext = createContext();

// In-memory cache to store user data briefly
const userDataCache = {
  data: null,
  timestamp: null,
  ttl: 30000, // 30 seconds
};

// Auth provider component
export function AuthProvider({ children }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const { isConnected } = useDatabaseConnection();
  const [retryCount, setRetryCount] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const MAX_RETRIES = 3;

  // Helper to determine if cache is valid
  const isValidCache = () => {
    return userDataCache.data && 
           userDataCache.timestamp &&
           Date.now() - userDataCache.timestamp < userDataCache.ttl &&
           userDataCache.data.clerkId === user?.id;
  };

  // Sync Clerk user with database user with improved error handling
  const syncUserData = useCallback(async (force = false) => {
    if (!isSignedIn || !isLoaded) {
      setDbUser(null);
      setIsLoading(false);
      return;
    }

    // Check cache first unless forced
    if (!force && isValidCache()) {
      console.log("Using cached user data");
      setDbUser(userDataCache.data);
      setLastSynced(new Date(userDataCache.timestamp));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Add timestamp and random string to prevent caching issues
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`Fetching user data (attempt ${retryCount + 1})...`);
      
      // Use the improved fetch utility with timeout and retries
      const data = await fetchJSON(`/api/users/me?t=${cacheBuster}`, {
        timeout: 10000, // 10 second timeout
        retries: 1,      // 1 retry attempt
        headers: {
          'X-Request-ID': `req_${Date.now().toString(36)}`
        }
      });
      
      if (data?.success && data?.user) {
        console.log(`User data loaded successfully with role: ${data.user.role}`);
        
        // Update cache
        userDataCache.data = data.user;
        userDataCache.timestamp = Date.now();
        
        setDbUser(data.user);
        setLastSynced(new Date());
        
        // Reset counters on success
        setRetryCount(0);
        setFailedAttempts(0);
      } else {
        console.warn("API returned success: false or missing user data:", data?.error || "No data");
        setFailedAttempts(prev => prev + 1);
        createFallbackUser(data?.error || "User data missing");
      }
    } catch (err) {
      console.error("Error syncing user data:", err);
      setError(err.message);
      setFailedAttempts(prev => prev + 1);
      
      // Implement retry logic for network errors or 5xx responses
      if (retryCount < MAX_RETRIES && 
         (err.message.includes("Failed to fetch") || err.message.includes("Server responded with 5") || err.message.includes("timed out"))) {
        console.log(`Retry attempt ${retryCount + 1} of ${MAX_RETRIES} in 2 seconds...`);
        setRetryCount(count => count + 1);
        
        // Retry after a delay with exponential backoff
        setTimeout(() => {
          syncUserData(true); // Force refresh on retry
        }, 2000 * Math.pow(2, retryCount));
        
        return; // Don't set loading to false yet
      }
      
      createFallbackUser(err.message);
    } finally {
      if (retryCount >= MAX_RETRIES) {
        console.error("Max retry attempts reached. Using fallback user data.");
        setRetryCount(0); // Reset for next time
      }
      setIsLoading(false);
      setLastSynced(new Date());
    }
  }, [isSignedIn, isLoaded, retryCount, user?.id]);
  
  // Helper to create fallback user from Clerk data
  const createFallbackUser = (errorMessage) => {
    console.warn("Using fallback user data from Clerk:", errorMessage);
    
    if (user) {
      // Create fallback user from Clerk data
      const fallbackUser = {
        clerkId: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        role: "user", // Default role
        isFallback: true, // Flag to indicate this is not from DB
      };
      
      setDbUser(fallbackUser);
      
      // Even fallback data gets cached, but with shorter TTL
      userDataCache.data = fallbackUser;
      userDataCache.timestamp = Date.now();
      userDataCache.ttl = 10000; // 10 seconds for fallback data
    }
    
    // Set error message
    setError(errorMessage);
  };

  // Initial sync when auth state changes
  useEffect(() => {
    if (isLoaded && isConnected !== undefined) {
      syncUserData();
    }
  }, [isSignedIn, isLoaded, isConnected, syncUserData]);

  // Reset retry count when auth state changes
  useEffect(() => {
    setRetryCount(0);
  }, [isSignedIn, isLoaded]);

  // Derived auth state
  const isAuthenticated = !!isSignedIn;
  
  // Role helpers
  const isAdmin = dbUser?.role === "admin";
  const isAgent = dbUser?.role === "agent";
  const isPendingAgent = dbUser?.role === "agent_pending";
  const hasError = !!error;

  // Auth context value
  const authContextValue = {
    isAuthenticated,
    isAdmin,
    isAgent,
    isPendingAgent,
    dbUser,
    isLoading,
    error,
    hasError,
    lastSynced,
    syncUserData,
    failedAttempts,
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
