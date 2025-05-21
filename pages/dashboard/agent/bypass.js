// Direct bypass for the agent dashboard when loading is stuck
// This page acts as a circuit breaker to help users when the dashboard is stuck in a loading state

import { useEffect } from "react";
import Head from "next/head";

export default function BypassAgentDashboard() {
  useEffect(() => {
    // Clear any caches that might be causing issues
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("td_user_cache");
        localStorage.removeItem("td_permissions");
        localStorage.removeItem("td_role_cache");

        // Set a flag to skip loading state
        sessionStorage.setItem("bypass_agent_loading", "true");

        // After a short delay, redirect to the dashboard with special parameters
        setTimeout(() => {
          window.location.href =
            "/dashboard/agent?breakLoop=true&bypassLoad=true&cacheCleared=true&t=" +
            Date.now();
        }, 1500);
      } catch (error) {
        console.error("Error during bypass:", error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Head>
        <title>Bypassing Agent Dashboard Loading | TopDial</title>
      </Head>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Bypassing Loading Issues
        </h1>

        <div className="animate-pulse mb-6">
          <div className="h-4 bg-blue-100 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-blue-100 rounded w-full mb-4"></div>
          <div className="h-4 bg-blue-100 rounded w-5/6"></div>
        </div>

        <p className="text-gray-600 mb-4">
          We're bypassing the normal loading process to get you to the agent
          dashboard. This should resolve any issues with infinite loading.
        </p>

        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <p className="text-sm text-gray-500 text-center mt-6">
          You'll be redirected automatically in a moment...
        </p>
      </div>
    </div>
  );
}
