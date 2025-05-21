import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function FixAgentDashboard() {
  const [status, setStatus] = useState("Initializing fix...");
  const router = useRouter();

  useEffect(() => {
    async function applyFix() {
      try {
        setStatus("Clearing auth caches...");

        // Clear all caches that could be causing issues
        if (typeof window !== "undefined") {
          // Clear localStorage items
          const cacheKeys = [
            "td_user_cache",
            "td_permissions",
            "td_role_cache",
            "clerk-db-user",
          ];

          cacheKeys.forEach((key) => {
            try {
              localStorage.removeItem(key);
              console.log(`Cleared cache: ${key}`);
            } catch (e) {
              console.error(`Error clearing ${key}:`, e);
            }
          });

          // Reset redirect tracking cookies
          document.cookie = "td_redirect_count=0; path=/; max-age=3600";

          // Wait a moment for caches to clear
          await new Promise((resolve) => setTimeout(resolve, 500));

          setStatus("Testing auth endpoint...");

          try {
            // Make a quick test request to auth API to refresh session
            const res = await fetch("/api/auth/status", {
              method: "GET",
              headers: { "Cache-Control": "no-cache" },
            });
            console.log("Auth status response:", await res.json());
          } catch (error) {
            console.log("Auth status check error (non-critical):", error);
          }

          setStatus("Fix complete! Redirecting to agent dashboard...");

          // Redirect with special parameters to force dashboard to render
          setTimeout(() => {
            window.location.href =
              "/dashboard/agent?breakLoop=true&bypassLoad=true&cacheCleared=true&t=" +
              Date.now();
          }, 1000);
        }
      } catch (error) {
        console.error("Error during fix:", error);
        setStatus(`Error: ${error.message}. Please try refreshing the page.`);
      }
    }

    applyFix();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Head>
        <title>Fix Agent Dashboard | TopDial</title>
      </Head>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-blue-500 text-4xl mb-6">🔧</div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Agent Dashboard Fix
        </h1>

        <p className="text-gray-600 mb-8">{status}</p>

        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <div className="text-sm text-gray-500">
          This tool fixes common issues with the agent dashboard loading state.
          If you continue to experience problems, please contact support.
        </div>
      </div>
    </div>
  );
}
