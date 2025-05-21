// Agent Dashboard Loading Fix
// This file adds a special loading timeout and error handler for the agent dashboard

import { useState, useEffect } from "react";

/**
 * This hook helps detect and fix loading issues in the agent dashboard
 * by adding a timeout that forces the dashboard to render even if auth is still loading
 */
export function useAgentDashboardLoadingFix(router) {
  const [shouldForceRender, setShouldForceRender] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  // Import circuit breaker utils if needed
  const detectRefreshLoop =
    typeof window !== "undefined"
      ? window.detectAuthLoop || (() => false)
      : () => false;

  // Check if current page is a known problem page
  const isCreateListingsPage =
    router?.pathname === "/dashboard/agent/listings/create";
  const isAgentDashboardPage = router?.pathname?.startsWith("/dashboard/agent");

  // Determine timeout based on the page
  const timeoutDuration = isCreateListingsPage
    ? 2000
    : isAgentDashboardPage
      ? 4000
      : 5000;

  useEffect(() => {
    // Skip for known problematic pages - they have their own circuit breakers
    if (isCreateListingsPage) {
      console.log(
        "[AgentDashboardFix] Skipping timeout for create listings page"
      );
      setShouldForceRender(true);
      return;
    }

    // Check if we should apply immediate circuit breaker
    if (detectRefreshLoop() || router?.query?.breakLoop === "true") {
      console.log(
        "[AgentDashboardFix] Refresh loop detected, skipping timeout"
      );
      setShouldForceRender(true);
      return;
    }

    // Set up loading timeout to detect stuck loading state
    const loadingTimeout = setTimeout(() => {
      console.log(
        "[AgentDashboardFix] Loading timeout reached - activating emergency render"
      );
      setLoadingTooLong(true);

      // Add special URL parameters to indicate we're using emergency rendering
      if (
        typeof window !== "undefined" &&
        router &&
        !router.asPath.includes("bypassLoad=true")
      ) {
        const separator = router.asPath.includes("?") ? "&" : "?";
        const newUrl = `${router.asPath}${separator}bypassLoad=true&breakLoop=true&t=${Date.now()}`;
        window.history.replaceState({}, document.title, newUrl);
      }

      // Force the component to render
      setShouldForceRender(true);
    }, timeoutDuration); // Customized timeout based on page

    return () => clearTimeout(loadingTimeout);
  }, [router]);

  // Clear local storage items that might be causing issues
  useEffect(() => {
    if (loadingTooLong && typeof window !== "undefined") {
      try {
        localStorage.removeItem("td_user_cache");
        localStorage.removeItem("td_permissions");
      } catch (e) {
        console.error("Error clearing cache:", e);
      }
    }
  }, [loadingTooLong]);

  return { shouldForceRender, loadingTooLong };
}

/**
 * Add this component to the agent dashboard to detect and recover from loading issues
 */
export function AgentDashboardLoadingFix({ isLoading }) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // If loading takes more than 8 seconds, show the help message
    let timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowHelp(true);
      }, 8000);
    }

    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!showHelp) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm z-50 border border-yellow-300">
      <h3 className="font-medium text-gray-900 mb-2">
        Dashboard Loading Slowly?
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        If the dashboard is stuck loading, try one of these options:
      </p>
      <div className="flex flex-col space-y-2">
        <a
          href={`/dashboard/agent?breakLoop=true&bypassLoad=true&t=${Date.now()}`}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md text-center"
        >
          Force Load Dashboard
        </a>
        <a
          href="/fix-permission-cache"
          className="text-sm px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-center"
        >
          Fix Permissions Cache
        </a>
      </div>
    </div>
  );
}
