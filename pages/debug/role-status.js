import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUser } from "@clerk/nextjs";

export default function RoleStatusPage() {
  const { user: clerkUser } = useUser();
  const { dbUser, isLoading, syncUserData } = useAuth();
  const [apiData, setApiData] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);

  // Fetch role data from API on mount
  useEffect(() => {
    async function checkRoleData() {
      try {
        setIsChecking(true);
        const response = await fetch("/api/debug/check-role");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setApiData(data.roleInfo);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsChecking(false);
      }
    }

    if (!isLoading) {
      checkRoleData();
    }
  }, [isLoading]);

  // Function to force refresh user data
  const forceRefresh = async () => {
    setIsChecking(true);
    await syncUserData(true); // Force refresh from AuthContext

    try {
      const response = await fetch("/api/debug/check-role");
      const data = await response.json();
      setApiData(data.roleInfo);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-4">
            Loading role information...
          </h1>
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-bold mb-4">Error checking role</h1>
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={forceRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">User Role Diagnostic</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <div className="flex space-x-3">
            <button
              onClick={forceRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Force Refresh User Data
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AuthContext User Data */}
          <div className="border rounded-lg p-4">
            <h2 className="font-bold mb-2">AuthContext Data:</h2>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">User ID:</span>{" "}
                {dbUser?.clerkId || "Not available"}
              </p>
              <p>
                <span className="font-semibold">Name:</span> {dbUser?.firstName}{" "}
                {dbUser?.lastName}
              </p>
              <p>
                <span className="font-semibold">Role:</span>{" "}
                <span className="bg-yellow-100 px-1">
                  {dbUser?.role || "none"}
                </span>
              </p>
              <p>
                <span className="font-semibold">Approved:</span>{" "}
                {dbUser?.approved ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-semibold">Is Fallback:</span>{" "}
                {dbUser?.isFallback ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {/* Clerk User Data */}
          <div className="border rounded-lg p-4">
            <h2 className="font-bold mb-2">Clerk Data:</h2>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">User ID:</span>{" "}
                {clerkUser?.id || "Not available"}
              </p>
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {clerkUser?.firstName} {clerkUser?.lastName}
              </p>
              <p>
                <span className="font-semibold">Role:</span>{" "}
                <span className="bg-yellow-100 px-1">
                  {clerkUser?.publicMetadata?.role || "none"}
                </span>
              </p>
              <p>
                <span className="font-semibold">Approved:</span>{" "}
                {clerkUser?.publicMetadata?.approved ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* API Check Results */}
        {apiData && (
          <div className="mt-6 border rounded-lg p-4">
            <h2 className="font-bold mb-2">API Check Results:</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold mb-1">Clerk Database:</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Role:</span>{" "}
                    <span className="bg-yellow-100 px-1">
                      {apiData.clerk.role}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Approved:</span>{" "}
                    {apiData.clerk.approved ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    {apiData.clerk.email}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-1">MongoDB Database:</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Role:</span>{" "}
                    <span className="bg-yellow-100 px-1">
                      {apiData.database.role}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">Approved:</span>{" "}
                    {apiData.database.approved ? "Yes" : "No"}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    {apiData.database.email}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-md ${apiData.isConsistent ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              <p className="font-medium">
                {apiData.isConsistent
                  ? "Systems are in sync"
                  : "Systems are NOT in sync"}
              </p>
              <p className="text-sm mt-1">
                {apiData.isConsistent
                  ? "Your role data is consistent across all systems."
                  : "Your role data is different in Clerk and MongoDB. This might cause redirect issues."}
              </p>
            </div>

            <div className="mt-4">
              <p className="font-semibold">Recommended Dashboard:</p>
              <p className="bg-blue-50 p-2 rounded">
                {apiData.recommendedDashboard}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
