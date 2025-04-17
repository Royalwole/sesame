import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";

export default function RoleCheckPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { dbUser, isLoading, isAdmin, isAgent, syncUserData } = useAuth();
  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkRoleFromAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/debug/auth-status?t=${Date.now()}`);
      const data = await response.json();
      setApiResult(data);
    } catch (error) {
      console.error("Error checking role:", error);
      setApiResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      checkRoleFromAPI();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <>
      <Head>
        <title>Role Debugging | TopDial</title>
      </Head>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Role Debugging Tool</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border rounded-md p-4">
              <h2 className="font-medium mb-2">Authentication Status</h2>
              <p>
                <strong>Clerk Loaded:</strong> {isLoaded ? "Yes" : "No"}
              </p>
              <p>
                <strong>Signed In:</strong> {isSignedIn ? "Yes" : "No"}
              </p>
              <p>
                <strong>Auth Loading:</strong> {isLoading ? "Yes" : "No"}
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h2 className="font-medium mb-2">User Roles</h2>
              <p>
                <strong>DB User Found:</strong> {dbUser ? "Yes" : "No"}
              </p>
              <p>
                <strong>Role:</strong> {dbUser?.role || "Not set"}
              </p>
              <p>
                <strong>Is Admin:</strong> {isAdmin ? "Yes" : "No"}
              </p>
              <p>
                <strong>Is Agent:</strong> {isAgent ? "Yes" : "No"}
              </p>
              <p>
                <strong>Is Fallback:</strong>{" "}
                {dbUser?.isFallback ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={syncUserData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Force Sync User Data
              </button>

              <button
                onClick={checkRoleFromAPI}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "Loading..." : "Check API Directly"}
              </button>
            </div>
          </div>

          {apiResult && (
            <div className="border rounded-md p-4">
              <h2 className="font-medium mb-2">API Result</h2>
              <pre className="bg-gray-100 p-3 rounded-md overflow-auto max-h-80 text-xs">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <h2 className="font-medium mb-2">Troubleshooting Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                Check that the user exists in the database with the right
                clerkId
              </li>
              <li>
                Verify the user has the correct role assigned in the database
              </li>
              <li>
                Check network requests to ensure /api/users/me returns the
                correct role
              </li>
              <li>Make sure the database connection is working properly</li>
              <li>Clear your browser cache or try in an incognito window</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
