import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Loader from "../../components/utils/LoadingSpinner";
import { getDashboardByRole } from "../../lib/role-management";

export default function DashboardPage() {
  const router = useRouter();
  const { dbUser, user, isLoading, isAuthenticated, syncUserData, clearUserCache } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loopDetected, setLoopDetected] = useState(false);
  
  // Check for circuit breaker parameters
  const hasBreakLoop = router.query.breakLoop === "true";
  const hasCacheCleared = router.query.cacheCleared === "true";
  const hasNoRedirect = router.query.noRedirect === "true";
  
  // Count redirects using URL parameter to detect loops
  const redirectCount = parseInt(router.query.rc || "0");
  
  // Force a fresh data sync when landing on the dashboard to get correct role
  useEffect(() => {
    // Skip if circuit breaker is active
    if (hasBreakLoop || hasCacheCleared || hasNoRedirect) {
      console.log("Dashboard: Circuit breaker active, skipping user data sync");
      return;
    }
    
    if (isAuthenticated && !isLoading) {
      console.log("Dashboard: Ensuring user data is fresh, forcing sync");
      // Clear cache and force a fresh sync to get the latest role data
      clearUserCache();
      syncUserData(true);
    }
  }, [isAuthenticated, isLoading, syncUserData, clearUserCache, hasBreakLoop, hasCacheCleared, hasNoRedirect]);
  // Handle routing based on user role
  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading) {
      console.log("Dashboard: Auth loading, waiting...");
      return;
    }
    
    // More comprehensive auth check - similar to withAuth.js
    const isUserAuthenticated = isAuthenticated && !!user;
    
    // If not authenticated, redirect to sign-in
    if (!isUserAuthenticated) {
      console.log("Dashboard: Not authenticated, redirecting to sign-in page", { isAuthenticated, hasUser: !!user });
      
      // Skip redirect if circuit breaker is active
      if (hasBreakLoop || hasNoRedirect) {
        console.log("Dashboard: Circuit breaker active, skipping redirect to sign-in");
        return;
      }
      
      const returnUrl = encodeURIComponent("/dashboard");
      router.replace(`/auth/sign-in?redirect_url=${returnUrl}&t=${Date.now()}`);
      return;
    }

    // Prevent multiple redirects
    if (isRedirecting) return;
    
    // Check for potential redirect loops
    if (redirectCount > 2 || (router.asPath.match(/t=/g) || []).length > 1) {
      console.warn("Dashboard: Potential redirect loop detected!");
      setLoopDetected(true);
      
      // Redirect to the fix-permission-cache page to resolve the issue
      if (!router.asPath.includes("/fix-permission-cache")) {
        router.replace("/fix-permission-cache?fromLoop=true");
      }
      return;
    }

    // Skip role-based redirects if circuit breaker is active
    if (hasBreakLoop || hasCacheCleared || hasNoRedirect) {
      console.log("Dashboard: Circuit breaker active, skipping role-based redirect");
      return;
    }

    // EMERGENCY FIX: If user has no metadata, redirect to fix their permissions
    if (user && (!user.publicMetadata || !user.publicMetadata.role)) {
      console.error("Dashboard: User has no role metadata! Redirecting to fix permissions page");
      router.replace("/fix-permission-cache?fromAuthError=true");
      return;
    }

    // Get the appropriate dashboard URL directly from the metadata (not dbUser)
    // This ensures consistent routing across the application that matches withAuth
    const targetDashboard = getDashboardByRole(user);
    
    console.log(`Dashboard: User role: ${user?.publicMetadata?.role}, target dashboard: ${targetDashboard}`);
    
    // Only redirect if we're not already on the target page
    if (router.pathname !== targetDashboard) {
      setIsRedirecting(true);
      console.log(`Dashboard: Redirecting to ${targetDashboard}`);
      
      // Add circuit breaker parameter to prevent potential loops
      const urlWithBreaker = `${targetDashboard}${targetDashboard.includes('?') ? '&' : '?'}t=${Date.now()}&rc=${redirectCount + 1}`;
      router.replace(urlWithBreaker);
    }
  }, [isLoading, isAuthenticated, user, dbUser, router, isRedirecting, redirectCount, hasBreakLoop, hasCacheCleared, hasNoRedirect]);

  return (
    <>
      <Head>
        <title>Dashboard | TopDial</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading
              ? "Loading your account..."
              : "Redirecting to your dashboard..."}
          </p>
        </div>

        {/* Debug info during development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-white shadow rounded max-w-md w-full text-sm">
            <h3 className="font-bold text-gray-700 mb-2">Debug Information</h3>
            <div className="space-y-1 text-gray-600">
              <p>Auth state: {isLoading ? "Loading" : isAuthenticated ? "Authenticated" : "Not authenticated"}</p>
              <p>User role: {dbUser?.role || "None"}</p>
              <p>Clerk metadata role: {user?.publicMetadata?.role || "None"}</p>
              <p>Current path: {router.pathname}</p>
              <p>Target dashboard: {!isLoading && user ? getDashboardByRole(user) : "Unknown"}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={() => router.reload()}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
              >
                Reload page
              </button>
              <button
                onClick={() => {
                  clearUserCache();
                  syncUserData(true);
                }}
                className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
              >
                Force Sync
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Use a minimal layout without header/footer
DashboardPage.getLayout = (page) => page;
