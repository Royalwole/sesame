/**
 * Auth Loop Breaker - Utility to detect, diagnose and fix authentication loops
 *
 * This module provides utility functions to help diagnose and fix refresh loops
 * in authentication flows, particularly focused on the agent dashboard.
 */

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * Hook to detect and break potential auth refresh loops
 * @param {Object} options Configuration options
 * @param {number} options.maxPageLoads Maximum page loads before considering it a loop
 * @param {number} options.timeWindow Time window in ms to count page loads
 * @returns {Object} Loop detection state and utilities
 */
export function useAuthLoopDetection(options = {}) {
  const {
    maxPageLoads = 3,
    timeWindow = 5000,
    debug = false,
    applyFix = true,
  } = options;

  const router = useRouter();
  const [loopDetected, setLoopDetected] = useState(false);
  const [pageLoads, setPageLoads] = useState(0);

  // Use storage to persist across page loads
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Special handling for known problematic pages
    const isCreateListingsPage =
      router.pathname === "/dashboard/agent/listings/create";
    if (isCreateListingsPage && applyFix) {
      // Apply immediate fix for listings create page
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get("breakLoop")) {
        console.log(
          "[AuthLoopBreaker] Pre-emptively applying fix for listings create page"
        );
        const url = new URL(window.location.href);
        url.searchParams.set("breakLoop", "true");
        url.searchParams.set("bypassLoad", "true");
        window.history.replaceState({}, document.title, url.toString());
        setLoopDetected(true);
        return;
      }
    }

    try {
      // Get or initialize page load tracking
      const storageKey = `auth_loop_${router.pathname.replace(/\//g, "_")}`;
      const storedData = localStorage.getItem(storageKey);

      let data = {
        loads: 1,
        timestamps: [Date.now()],
        firstLoad: Date.now(),
      };

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);

          // Clean up old timestamps outside our window
          const validTimestamps = parsedData.timestamps.filter(
            (ts) => Date.now() - ts < timeWindow
          );

          data = {
            loads: validTimestamps.length + 1,
            timestamps: [...validTimestamps, Date.now()],
            firstLoad: parsedData.firstLoad,
          };
        } catch (e) {
          console.error("[Auth Loop Breaker] Error parsing stored data:", e);
        }
      }

      // Save updated data
      localStorage.setItem(storageKey, JSON.stringify(data));

      // Check if we've exceeded the threshold
      if (data.loads >= maxPageLoads) {
        console.warn(
          `[Auth Loop Breaker] Detected ${data.loads} page loads in ${timeWindow}ms window`
        );
        setLoopDetected(true);

        // Add circuit breaker parameter if not already present
        if (!router.query.breakLoop) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set("breakLoop", "true");
          newUrl.searchParams.set("bypassLoad", "true");

          if (debug) {
            console.log(
              "[Auth Loop Breaker] Redirecting to circuit breaker URL:",
              newUrl.toString()
            );
          }

          // Replace current URL with circuit breaker parameters
          window.history.replaceState({}, "", newUrl.toString());
        }
      }

      // Set state for component use
      setPageLoads(data.loads);
    } catch (err) {
      console.error("[Auth Loop Breaker] Error in loop detection:", err);
    }

    // Cleanup function
    return () => {
      // Nothing to clean up
    };
  }, [router.pathname, router.query, maxPageLoads, timeWindow, debug]);

  return {
    loopDetected,
    pageLoads,
    breakLoop: () => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("breakLoop", "true");
      newUrl.searchParams.set("bypassLoad", "true");
      window.history.replaceState({}, "", newUrl.toString());
      window.location.reload();
    },
  };
}

/**
 * Function to check URL for loop indicators
 * @param {Object} router Next.js router object
 * @returns {boolean} Whether loop indicators are present
 */
export function hasLoopIndicators(router) {
  if (!router) return false;

  const query = router.query || {};
  const asPath = router.asPath || "";

  return (
    query.breakLoop === "true" ||
    query.bypassLoad === "true" ||
    (query.rc && parseInt(query.rc) > 1) ||
    (asPath.match(/t=/g) || []).length > 1
  );
}

/**
 * Utility to apply circuit breaker to current URL
 * Call this from devtools console to fix a stuck page
 */
export function applyCircuitBreaker() {
  const url = new URL(window.location.href);
  url.searchParams.set("breakLoop", "true");
  url.searchParams.set("bypassLoad", "true");
  window.location.href = url.toString();
}

// Expose a global fix function for use in browser console
if (typeof window !== "undefined") {
  window.__fixAuthLoop = applyCircuitBreaker;
}

export default {
  useAuthLoopDetection,
  hasLoopIndicators,
  applyCircuitBreaker,
};
