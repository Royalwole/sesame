import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";
import { clearUserPermissionCache } from "../lib/permissions-manager";
import { getDashboardByRole } from "../lib/role-management"; // Added import for consistent redirection logic

export default function FixPermissionCache() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Check for redirection loop coming into this page
  useEffect(() => {
    // Check URL parameters to see if we were redirected here due to a loop
    const fromRedirectLoop = router.query.fromLoop === "true";

    if (fromRedirectLoop && user) {
      setMessage("Detected a redirection loop. This tool can help fix it.");
    }
  }, [router.query, user]);
  const handleFixCache = async () => {
    if (!user) {
      setMessage("You need to be logged in to use this tool.");
      return;
    }

    setLoading(true);
    setMessage("Clearing permission cache and fixing authentication issues...");

    try {
      // Clear the permission cache for the current user
      clearUserPermissionCache(user);

      // Clear ALL localStorage items that might be causing issues
      if (typeof window !== "undefined") {
        // Clear any auth-related cached items
        localStorage.removeItem("td_user_cache");
        localStorage.removeItem("td_permissions");
        localStorage.removeItem("td_role_cache");
        localStorage.removeItem("clerk-db-user");

        // Clear any redirection tracking cookies
        document.cookie = "td_redirect_count=0; path=/; max-age=3600";
      }

      // Also make a server-side request to clear it there as well
      const res = await fetch("/api/user/clear-permission-cache", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to clear server-side permission cache");
      }

      // Log the current user metadata to help with debugging
      console.log("User metadata after cache clearing:", {
        role: user.publicMetadata?.role || "user",
        approved: user.publicMetadata?.approved === true,
      });

      setMessage(
        "Permission cache cleared successfully! Redirecting to dashboard..."
      );

      // Add a slight delay before redirecting
      setTimeout(() => {
        // Use the centralized function for determining the dashboard path
        // This ensures we use the same logic as withAuth and main routing
        let dashboardPath = getDashboardByRole(user);

        // Add robust circuit breaker parameters
        dashboardPath +=
          (dashboardPath.includes("?") ? "&" : "?") +
          "cacheCleared=true&breakLoop=true&clearAuth=true&t=" +
          Date.now();

        // Log the redirection to help with debugging
        console.log(
          `Redirecting to ${dashboardPath} after clearing permission cache`
        );

        router.push(dashboardPath);
      }, 1500);
    } catch (error) {
      console.error("Error clearing cache:", error);
      setMessage(`Error clearing cache: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Fix Permission Cache
        </h1>

        <p className="text-gray-600 mb-6">
          If you're experiencing issues with permissions or redirection loops,
          this tool can help clear your permission cache.
        </p>

        {message && (
          <div
            className={`p-4 mb-4 rounded ${
              message.includes("Error")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleFixCache}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          >
            {loading ? "Working..." : "Clear Permission Cache"}
          </button>

          <div className="flex space-x-4">
            <a
              href="/dashboard/user?breakLoop=true"
              className="flex-1 px-4 py-2 bg-gray-200 text-center text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              User Dashboard
            </a>
            <a
              href="/auth/sign-out"
              className="flex-1 px-4 py-2 bg-gray-200 text-center text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Sign Out
            </a>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>
            <strong>User ID:</strong> {user?.id || "Not logged in"}
          </p>
          <p>
            <strong>Role:</strong> {user?.publicMetadata?.role || "None"}
          </p>
          <p>
            <strong>Approved:</strong>{" "}
            {user?.publicMetadata?.approved ? "Yes" : "No"}
          </p>
        </div>
      </div>
    </div>
  );
}
