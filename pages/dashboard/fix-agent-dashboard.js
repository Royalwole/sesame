import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function FixAgentDashboard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Preparing to fix agent dashboard...");
  const router = useRouter();

  // Effect to handle the fixing process
  useEffect(() => {
    const fixDashboard = async () => {
      try {
        setLoading(true);
        setMessage("Clearing caches and preparing fix...");

        // Clear all auth-related localStorage items
        if (typeof window !== "undefined") {
          localStorage.removeItem("td_user_cache");
          localStorage.removeItem("td_permissions");
          localStorage.removeItem("td_role_cache");
          localStorage.removeItem("clerk-db-user");

          // Clear cookies that might be causing issues
          document.cookie = "td_redirect_count=0; path=/; max-age=3600";

          // Wait a bit to ensure changes take effect
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setMessage(
            "Redirecting you to the agent dashboard with special parameters..."
          );

          // Redirect to agent dashboard with special parameters to force rendering
          setTimeout(() => {
            window.location.href =
              "/dashboard/agent?breakLoop=true&bypassLoad=true&cacheCleared=true&t=" +
              Date.now();
          }, 1500);
        }
      } catch (error) {
        console.error("Error fixing dashboard:", error);
        setMessage(
          `Error occurred: ${error.message}. Please try refreshing the page.`
        );
        setLoading(false);
      }
    };

    fixDashboard();
  }, [router]);

  return (
    <>
      <Head>
        <title>Fix Agent Dashboard | TopDial</title>
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Agent Dashboard Fix
          </h1>

          <p className="text-gray-600 mb-6">{message}</p>

          {loading && (
            <div className="flex justify-center my-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          <div className="text-sm text-gray-500 mt-8">
            If you continue to experience issues, please contact support or try
            using the{" "}
            <a href="/fix-permission-cache" className="text-blue-500 underline">
              permission cache fix tool
            </a>
            .
          </div>
        </div>
      </div>
    </>
  );
}
