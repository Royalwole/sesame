import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Loader from "../../components/utils/Loader";

export default function DashboardPage() {
  const router = useRouter();
  const { dbUser, isLoading, isAuthenticated, isAdmin, isAgent } = useAuth();

  // Handle routing based on user role
  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading) return;
    
    // If not authenticated, redirect to sign-in
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to sign-in page");
      const returnUrl = encodeURIComponent("/dashboard");
      router.replace(`/auth/sign-in?redirect_url=${returnUrl}`);
      return;
    }

    // Get user role and determine appropriate dashboard
    console.log("Determining appropriate dashboard for user");
    const targetDashboard = getDashboardForUser(dbUser);
    
    // Only redirect if we're not already on the target page
    if (router.pathname !== targetDashboard) {
      console.log(`Redirecting to ${targetDashboard}`);
      router.replace(targetDashboard);
    }
  }, [isLoading, isAuthenticated, dbUser, router]);

  // Helper function to determine which dashboard to show based on user role
  function getDashboardForUser(user) {
    // Default dashboard for regular users
    let dashboardPath = "/dashboard/user";
    
    if (!user) {
      return dashboardPath;
    }
    
    // Override based on role
    if (user.role === "admin") {
      dashboardPath = "/dashboard/admin";
    } else if (user.role === "agent" || user.role === "agent_pending") {
      dashboardPath = "/dashboard/agent";
    }
    
    return dashboardPath;
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
              <p>Current path: {router.pathname}</p>
              <p>Target dashboard: {!isLoading && dbUser ? getDashboardForUser(dbUser) : "Unknown"}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={() => router.reload()}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
              >
                Reload page
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
