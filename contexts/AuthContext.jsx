import { createContext, useState, useEffect, useContext } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [dbUser, setDbUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  // Sync user on sign-in or user changes
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      syncUserWithDatabase(user);
    } else if (isLoaded && !isSignedIn) {
      setDbUser(null);
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);
  // Sync user with database
  const syncUserWithDatabase = async (clerkUser) => {
    try {
      setIsLoading(true);
      console.log("[Auth] Syncing user with database...");      // Make sure we have a valid Clerk user ID
      if (!clerkUser || !clerkUser.id) {
        console.error("[Auth] Invalid Clerk user object");
        toast.error("Authentication error: User profile not found");
        setIsLoading(false);
        return;
      }

      // Generate a unique sync ID for tracking this operation
      const syncId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Add timeout to the fetch request with proper AbortController handling
      const { fetchWithTimeout, withFetchTimeout } = await import('../lib/fetch-with-timeout');
      
      try {
        console.log(`[Auth] Requesting sync for user: ${clerkUser.id}, syncId: ${syncId}`);
          // Use the enhanced withFetchTimeout with retry capability
        const response = await withFetchTimeout(
          async ({ signal }) => {
            return await fetch(
              `/api/users/sync?clerkId=${clerkUser.id}&syncId=${syncId}`,
              {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'X-Request-Source': 'auth-context',
                  'X-Sync-ID': syncId
                },
                signal
              }
            );
          },
          {
            timeoutMs: 30000, // 30 seconds timeout
            retries: 1,       // One retry attempt
            retryDelayMs: 1000, // 1 second between retries
            onTimeout: (error) => {
              console.warn(`[Auth] Sync request timed out, retrying... (${syncId})`);
            },
            onRetry: (error, attempt) => {
              console.log(`[Auth] Retrying sync request, attempt ${attempt + 1} (${syncId})`);
            }
          }
        );

        // Parse the response JSON whether it's an error or success
        const data = await response.json().catch(e => {
          console.error(`[Auth] Failed to parse response for syncId ${syncId}:`, e);
          return { success: false, message: "Invalid server response" };
        });
          if (!response.ok) {
          console.error(`[Auth] Sync failed with status: ${response.status}, syncId: ${syncId}`, data);
          
          // Display a more user-friendly error message
          const errorMessage = data.message || 'Unknown error';
          
          // Handle different status codes with more specific messages
          if (response.status === 503 || response.status === 504) {
            toast.error('Profile sync temporarily unavailable. We are working on it.');
          } else if (response.status === 429) {
            toast.error('Too many sync requests. Please try again in a few minutes.');
          } else {
            toast.error(`Profile sync issue: ${errorMessage}. Please try again later.`, {
              duration: 5000,
              onClick: () => refreshUserProfile() // Allow user to retry by clicking toast
            });
          }
          
          setIsLoading(false);
          return;
        }

        if (data.success && data.user) {
          console.log(`[Auth] User synced successfully: ${data.user._id}, syncId: ${syncId}`);
          setDbUser(data.user);
          setLastSyncTime(new Date());
          
          // If we have information about updated listings, log it
          if (data.listingsUpdated !== undefined) {
            console.log(`[Auth] Updated ${data.listingsUpdated} listing(s) with current user info, syncId: ${syncId}`);
            
            // Show success message only if listings were updated
            if (data.listingsUpdated > 0) {
              toast.success(`Your profile was synced with ${data.listingsUpdated} listing(s)`);
            }
          }
        } else {
          console.error(`[Auth] User sync failed: ${data.error || "Unknown error"}, syncId: ${syncId}`);
          toast.error(`User profile sync error: ${data.error || "Unknown error"}`);
        }      } catch (fetchError) {
        const { isAbortError, isTimeoutError } = await import('../lib/fetch-with-timeout');
        
        if (isAbortError(fetchError) || isTimeoutError(fetchError)) {
          console.error(`[Auth] User sync timed out, syncId: ${syncId}`);
          toast.error("Profile sync timed out. Please try again later.", {
            duration: 5000,
            onClick: () => refreshUserProfile() // Allow user to retry by clicking toast
          });
        } else if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
          console.error(`[Auth] Network error for syncId ${syncId}:`, fetchError);
          toast.error("Network issue detected. Check your connection and try again.", {
            duration: 5000,
            onClick: () => refreshUserProfile()
          });
        } else {
          console.error(`[Auth] Fetch error for syncId ${syncId}:`, fetchError);
          toast.error(`Connection error: ${fetchError.message}`, {
            duration: 5000,
            onClick: () => refreshUserProfile()
          });
        }
      }
    } catch (error) {
      console.error("[Auth] Error syncing user:", error);
      toast.error("Failed to sync user profile. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  // Force a profile refresh
  const refreshUserProfile = async () => {
    if (user) {
      return syncUserWithDatabase(user);
    }
    return null;
  };

  // Sign out from both Clerk and our system
  const handleSignOut = async () => {
    try {
      await signOut();
      setDbUser(null);
      router.push("/");
    } catch (error) {
      console.error("[Auth] Sign out error:", error);
    }
  };

  const value = {
    user: dbUser, // Use our database user
    clerkUser: user, // Original Clerk user
    isLoading,
    isSignedIn,
    signOut: handleSignOut,
    refreshUserProfile,
    lastSyncTime,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}