// Fix for the refreshing issue on the agent listings create page

import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * One-time circuit breaker that bypasses the auth refresh loop
 * Apply this at the component level for pages experiencing refresh loops
 */
export function useCircuitBreaker(options = {}) {
  const { forceBreak = false, threshold = 3, timeWindow = 10000 } = options;
  const router = useRouter();

  useEffect(() => {
    // Only run this once on client-side
    if (typeof window === "undefined") return;

    // Check if we need to break an auth loop
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;

    // Special handling for known problematic pages
    const isCreateListingsPage =
      pathname === "/dashboard/agent/listings/create";

    // Skip if we already have the circuit breaker parameters
    if (urlParams.get("breakLoop") === "true") {
      console.log("[CircuitBreaker] Circuit breaker already active");
      return;
    }

    // Force break for known problematic pages or when requested
    if (forceBreak || isCreateListingsPage) {
      console.log("[CircuitBreaker] Force breaking potential loop");
      applyManualCircuitBreaker();
      return;
    }

    // Check if we've loaded this page multiple times in quick succession
    const now = Date.now();
    let pageLoadHistory;

    try {
      // Get the stored load history
      const storedHistory = localStorage.getItem("page_load_history");
      pageLoadHistory = storedHistory ? JSON.parse(storedHistory) : [];

      // Add current load time
      pageLoadHistory.push(now);

      // Only keep the last 10 entries
      pageLoadHistory = pageLoadHistory.slice(-10);

      // Save updated history
      localStorage.setItem(
        "page_load_history",
        JSON.stringify(pageLoadHistory)
      );

      // Check for rapid refreshes - if we have 3+ page loads in the last 10 seconds
      const recentLoads = pageLoadHistory.filter((time) => now - time < 10000);

      if (recentLoads.length >= 3) {
        console.log(
          "[CircuitBreaker] Detected rapid refreshes, applying circuit breaker"
        );

        // Apply circuit breaker to prevent further refreshes
        const url = new URL(window.location.href);
        url.searchParams.set("breakLoop", "true");
        url.searchParams.set("bypassLoad", "true");
        url.searchParams.set("t", now.toString());

        // Replace the current URL without causing another reload
        window.history.replaceState({}, document.title, url.toString());

        // Reset the load history
        localStorage.setItem("page_load_history", "[]");

        console.log(
          "[CircuitBreaker] Circuit breaker applied, refresh cycle should stop"
        );
      }
    } catch (e) {
      console.error("[CircuitBreaker] Error accessing localStorage", e);
    }
  }, []);
}

/**
 * Apply this to the listings create page to fix refresh cycles
 * This is a manual one-time fix
 */
export function applyManualCircuitBreaker() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.set("breakLoop", "true");
  url.searchParams.set("bypassLoad", "true");
  url.searchParams.set("t", Date.now().toString());

  // Replace the current URL without causing another reload
  window.history.replaceState({}, document.title, url.toString());

  console.log("[CircuitBreaker] Manual circuit breaker applied");

  // Also save state to localStorage for persistent protection
  try {
    localStorage.setItem("circuit_breaker_applied", "true");
    localStorage.setItem("circuit_breaker_timestamp", Date.now().toString());
    localStorage.setItem("circuit_breaker_path", window.location.pathname);
  } catch (e) {
    console.error("[CircuitBreaker] Error setting localStorage", e);
  }

  return true;
}

/**
 * Check if a page is experiencing a refresh loop
 * @returns {boolean} True if a refresh loop is detected
 */
export function detectRefreshLoop() {
  if (typeof window === "undefined") return false;

  try {
    const now = Date.now();
    const storedHistory = localStorage.getItem("page_load_history");
    const pageLoadHistory = storedHistory ? JSON.parse(storedHistory) : [];

    // Check for rapid refreshes - if we have 3+ page loads in the last 10 seconds
    const recentLoads = pageLoadHistory.filter((time) => now - time < 10000);
    return recentLoads.length >= 3;
  } catch (e) {
    console.error("[CircuitBreaker] Error detecting refresh loop:", e);
    return false;
  }
}

// Make the manual fix and detection available in the console for emergency use
if (typeof window !== "undefined") {
  window.fixAuthLoop = applyManualCircuitBreaker;
  window.detectAuthLoop = detectRefreshLoop;
}
