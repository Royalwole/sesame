import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

export default function FixDashboard() {
  const [status, setStatus] = useState("Diagnosing...");
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    async function checkUser() {
      try {
        if (!isSignedIn || !user) {
          setStatus("Not signed in");
          setErrorDetails("You need to be signed in to use this tool");
          setLoading(false);
          return;
        }

        // Get user details for diagnosis
        const details = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "No email",
          role: user.publicMetadata?.role || "No role",
          approved: user.publicMetadata?.approved === true ? "Yes" : "No",
          permissions: (user.publicMetadata?.permissions || []).slice(0, 5),
          hasMorePermissions:
            (user.publicMetadata?.permissions || []).length > 5,
        };

        setUserDetails(details);

        // Simple role-based checks
        if (details.role === "agent" && details.approved === "Yes") {
          setStatus(
            "Role and approval status look correct for Agent dashboard"
          );
        } else if (details.role === "admin" && details.approved === "Yes") {
          setStatus(
            "Role and approval status look correct for Admin dashboard"
          );
        } else if (details.role === "agent" && details.approved !== "Yes") {
          setStatus("You have the agent role but are not approved");
          setErrorDetails(
            "This explains your redirect loop - you need to be approved to access the agent dashboard"
          );
        } else {
          setStatus(
            `Your current role is "${details.role}" (Approved: ${details.approved})`
          );
          setErrorDetails(
            "This may not match the required role for the dashboard you're trying to access"
          );
        }
      } catch (error) {
        console.error("Error diagnosing user:", error);
        setStatus("Error");
        setErrorDetails(`Failed to diagnose: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [user, isLoaded, isSignedIn]);

  const handleClearCache = async () => {
    setLoading(true);
    setStatus("Clearing cache...");

    try {
      // Clear client-side cache
      localStorage.removeItem("td_user_cache");
      sessionStorage.clear();

      // Clear server-side cache
      const res = await fetch("/api/user/clear-permission-cache", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to clear server-side permission cache");
      }

      setStatus("Cache cleared successfully!");
    } catch (error) {
      console.error("Error clearing cache:", error);
      setStatus("Error clearing cache");
      setErrorDetails(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = (dashboardType) => {
    // Add parameters to break potential redirect loops
    router.push(`/dashboard/${dashboardType}?breakLoop=true&t=${Date.now()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Dashboard Access Fix
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div
              className={`p-4 mb-6 rounded ${
                status.includes("Error") || errorDetails
                  ? "bg-red-100"
                  : "bg-blue-100"
              }`}
            >
              <h2 className="font-semibold text-lg mb-1">Status: {status}</h2>
              {errorDetails && <p className="text-red-700">{errorDetails}</p>}
            </div>

            {userDetails && (
              <div className="mb-6 bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">User Details:</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <strong>ID:</strong> {userDetails.id}
                  </li>
                  <li>
                    <strong>Email:</strong> {userDetails.email}
                  </li>
                  <li>
                    <strong>Role:</strong> {userDetails.role}
                  </li>
                  <li>
                    <strong>Approved:</strong> {userDetails.approved}
                  </li>
                  <li>
                    <strong>Sample Permissions:</strong>
                    <ul className="ml-4 mt-1">
                      {userDetails.permissions.map((perm, i) => (
                        <li key={i} className="text-xs text-gray-700">
                          {perm}
                        </li>
                      ))}
                      {userDetails.hasMorePermissions && (
                        <li className="text-xs text-gray-500">...more</li>
                      )}
                    </ul>
                  </li>
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-medium">Actions:</h3>

              <button
                onClick={handleClearCache}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
              >
                Clear All Caches
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleGoToDashboard("user")}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  User Dashboard
                </button>
                <button
                  onClick={() => handleGoToDashboard("agent")}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Agent Dashboard
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/auth/sign-in?noRedirect=true"
                  className="px-3 py-2 bg-gray-200 text-center text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Sign In Page
                </a>
                <a
                  href="/auth/sign-out"
                  className="px-3 py-2 bg-gray-200 text-center text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Sign Out
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
