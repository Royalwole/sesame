import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Loader from "../../components/utils/Loader";
import { getDashboardByRole } from "../../lib/role-management";

export default function DashboardPage() {
  const router = useRouter();
  const { dbUser, isLoading, isAuthenticated, syncUserData, clearUserCache } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Force a fresh data sync when landing on the dashboard to get correct role
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("Dashboard: Ensuring user data is fresh, forcing sync");
      // Clear cache and force a fresh sync to get the latest role data
      clearUserCache();
      syncUserData(true);
    }
  }, [isAuthenticated, isLoading, syncUserData, clearUserCache]);

  // Handle routing based on user role
  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading) {
      console.log("Dashboard: Auth loading, waiting...");
      return;
    }
    
    // If not authenticated, redirect to sign-in
    if (!isAuthenticated) {
      console.log("Dashboard: Not authenticated, redirecting to sign-in page");
      
      // Check for potential loop before redirecting
      const hasBreakLoop = new URLSearchParams(window.location.search).has('breakLoop');
      const hasNoRedirect = new URLSearchParams(window.location.search).has('noRedirect');
      
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

    // Get the appropriate dashboard URL directly from the role-management utility
    // This ensures consistent routing across the application
    const targetDashboard = getDashboardUrl(dbUser);
    
    console.log(`Dashboard: User role: ${dbUser?.role}, target dashboard: ${targetDashboard}`);
    
    // Only redirect if we're not already on the target page
    if (router.pathname !== targetDashboard) {
      setIsRedirecting(true);
      console.log(`Dashboard: Redirecting to ${targetDashboard}`);
      
      // Add circuit breaker parameter to prevent potential loops
      const urlWithBreaker = `${targetDashboard}${targetDashboard.includes('?') ? '&' : '?'}t=${Date.now()}`;
      router.replace(urlWithBreaker);
    }
  }, [isLoading, isAuthenticated, dbUser, router, isRedirecting]);

  // Helper function that uses the central role-management utilities
  function getDashboardUrl(user) {
    if (!user) return "/dashboard/user";
    
    // Use direct role checking for maximum reliability
    const role = user.role;
    const approved = !!user.approved;
    
    // Return the appropriate dashboard URL based on role and approval status
    if ((role === "admin" || role === "super_admin") && approved) {
      return "/dashboard/admin";
    } else if (role === "agent" && approved) {
      return "/dashboard/agent";
    } else if (role === "agent_pending") {
      return "/dashboard/pending";
    }
    
    // Default to user dashboard for all other cases
    return "/dashboard/user";
  }

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
              <p>Clerk metadata role: {dbUser?.user?.publicMetadata?.role || "None"}</p>
              <p>Current path: {router.pathname}</p>
              <p>Target dashboard: {!isLoading && dbUser ? getDashboardUrl(dbUser) : "Unknown"}</p>
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
