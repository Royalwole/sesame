import { useState, useEffect } from "react";
import Head from "next/head";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "../contexts/AuthContext";

export default function AuthStatus() {
  const { user } = useUser();
  const { isAgent, isAdmin, dbUser, isLoading } = useAuth();
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkAgentStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/debug/check-agent-status");
      const data = await res.json();
      setApiStatus(data);
    } catch (err) {
      console.error(err);
      setApiStatus({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Only for development environment
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-800">
            This debug tool is only available in development mode
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Auth Status Debugger</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">
        Authentication Status Debugger
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">
            Client-Side Auth Status
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-wine border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Authentication:</h3>
                <p>{user ? "✅ Authenticated" : "❌ Not authenticated"}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">User ID:</h3>
                <p className="font-mono text-sm">
                  {user?.id || "Not available"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Email:</h3>
                <p>
                  {user?.primaryEmailAddress?.emailAddress || "Not available"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Roles:</h3>
                <div className="space-x-2">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${
                      isAdmin
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Admin: {isAdmin ? "Yes" : "No"}
                  </span>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${
                      isAgent
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Agent: {isAgent ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">DB User Info:</h3>
                {dbUser ? (
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(
                      {
                        id: dbUser._id,
                        role: dbUser.role,
                        approved: dbUser.approved,
                        firstName: dbUser.firstName,
                        lastName: dbUser.lastName,
                      },
                      null,
                      2
                    )}
                  </pre>
                ) : (
                  <p className="text-orange-500">No DB user data available</p>
                )}
              </div>
            </div>
          )}

          <button
            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">
            Server-Side Auth Status
          </h2>

          <button
            className="mb-4 bg-wine text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
            onClick={checkAgentStatus}
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Agent Status from API"}
          </button>

          {apiStatus && (
            <div className="mt-4 border rounded">
              <div
                className={`p-2 ${
                  apiStatus.success ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <span className="font-medium">Status: </span>
                {apiStatus.success ? "Success" : "Error"}
              </div>
              <div className="p-4">
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto h-96">
                  {JSON.stringify(apiStatus, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
