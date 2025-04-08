import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Loader from "../../components/utils/Loader";

export default function DashboardPage() {
  const router = useRouter();
  const { dbUser, isLoading, isAuthenticated, isAgent, isAdmin } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const hasRedirected = useRef(false);
  const timeoutRef = useRef(null);

  // Add a debugging indicator for the loading state
  console.log("Dashboard state:", {
    isLoading,
    isAuthenticated,
    redirecting,
    dbUser,
  });

  useEffect(() => {
    // Clean up any timeouts when component unmounts
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // Only proceed if authentication state is resolved
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to sign-in
        console.log("User not authenticated, redirecting to sign-in");
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          router.push(
            `/auth/sign-in?redirect_url=${encodeURIComponent("/dashboard")}`
          );
        }
        return;
      }

      // Prevent redirect loop
      if (redirecting || hasRedirected.current) return;

      // Determine which dashboard to show based on user role
      setRedirecting(true);
      console.log("Routing to appropriate dashboard:", {
        isAdmin,
        isAgent,
        dbUser,
      });

      // Create a stable role check to avoid routing issues
      const userRole = dbUser?.role || "user";
      let targetPath;

      if (userRole === "admin") {
        targetPath = "/dashboard/admin";
      } else if (["agent", "agent_pending"].includes(userRole)) {
        targetPath = "/dashboard/agent";
      } else {
        targetPath = "/dashboard/user";
      }

      // Set a short timeout to prevent excessive redirects
      timeoutRef.current = setTimeout(() => {
        hasRedirected.current = true;
        console.log(`Redirecting to ${targetPath}`);
        router.replace(targetPath);
      }, 100);
    }
  }, [
    isLoading,
    isAuthenticated,
    isAgent,
    isAdmin,
    router,
    redirecting,
    dbUser,
  ]);

  return (
    <>
      <Head>
        <title>Dashboard | TopDial</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 text-center">
          {isLoading
            ? "Loading authentication..."
            : redirecting
            ? "Redirecting to your dashboard..."
            : "Preparing your dashboard..."}
        </p>

        {/* Add debug info in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-700 max-w-md">
            <p>Auth loading: {isLoading ? "Yes" : "No"}</p>
            <p>Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
            <p>Redirecting: {redirecting ? "Yes" : "No"}</p>
            <p>User role: {dbUser?.role || "None"}</p>
            <p>Path: {router.pathname}</p>
            <button
              onClick={() => router.reload()}
              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded"
            >
              Reload page
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Set custom layout to avoid showing header/footer until we know which dashboard to show
DashboardPage.getLayout = (page) => page;
