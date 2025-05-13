import { useState, useEffect } from "react";
import Head from "next/head";

// This special page can help break authentication redirect loops
export default function BreakRedirectLoop() {
  const [isClearing, setIsClearing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [destination, setDestination] = useState("/dashboard/user");

  // Handle redirect with breakLoop parameter
  const handleRedirect = (path) => {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("breakLoop", "true");
    url.searchParams.set("noRedirect", "true");
    url.searchParams.set("t", Date.now());

    window.location.href = url.toString();
  };

  // Clear all authentication state
  const clearAuthState = () => {
    setIsClearing(true);

    try {
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });

      // Clear localStorage
      const keysToKeep = ["debug_mode", "theme", "language"];
      Object.keys(localStorage).forEach((key) => {
        if (
          (!keysToKeep.includes(key) && key.includes("clerk")) ||
          key.includes("auth") ||
          key.includes("td_") ||
          key.includes("redirect") ||
          key.includes("session")
        ) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (
          key.includes("clerk") ||
          key.includes("auth") ||
          key.includes("td_") ||
          key.includes("redirect") ||
          key.includes("session")
        ) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.error("Error clearing auth state:", err);
    }

    setTimeout(() => {
      setIsDone(true);
      setIsClearing(false);
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Break Redirect Loop | Topdial Debugger</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Loop Breaker Utility</h1>
            <p className="text-gray-600 mb-6">
              This tool helps resolve authentication redirect loops in the
              application.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-t border-b border-gray-100 py-4">
              <h2 className="text-lg font-semibold mb-2">
                Step 1: Clear Auth State
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                This will clear cookies, localStorage, and sessionStorage items
                related to authentication.
              </p>
              <button
                onClick={clearAuthState}
                disabled={isClearing || isDone}
                className={`w-full py-2 rounded-md ${
                  isDone
                    ? "bg-green-500 text-white"
                    : isClearing
                      ? "bg-gray-300 text-gray-700"
                      : "bg-red-600 hover:bg-red-700 text-white"
                } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              >
                {isDone
                  ? "Cleared ✓"
                  : isClearing
                    ? "Clearing..."
                    : "Clear Auth State"}
              </button>
            </div>

            <div
              className={`border-b border-gray-100 py-4 ${!isDone ? "opacity-50" : ""}`}
            >
              <h2 className="text-lg font-semibold mb-2">
                Step 2: Choose Destination
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Select where you want to go with the circuit breaker enabled.
              </p>
              <div className="space-y-2">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={!isDone}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="/dashboard/user">User Dashboard</option>
                  <option value="/dashboard/admin">Admin Dashboard</option>
                  <option value="/dashboard/agent">Agent Dashboard</option>
                  <option value="/auth/sign-in">Sign In Page</option>
                  <option value="/auth/sign-up">Sign Up Page</option>
                  <option value="/">Home Page</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleRedirect(destination)}
              disabled={!isDone}
              className={`w-full py-2 rounded-md ${
                isDone
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-700"
              } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isDone ? "Go to Selected Page" : "Complete Step 1 First"}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-6">
            <p>
              If problems persist, try clearing your browser cache and cookies
              manually.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
