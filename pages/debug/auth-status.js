import { useState, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "../../contexts/AuthContext";
import { useUser, useClerk } from "@clerk/nextjs";

export default function AuthStatusPage() {
  const {
    isAuthenticated,
    dbUser,
    isLoading,
    lastSynced,
    syncUserData,
    hasError,
    error,
  } = useAuth();
  const { user, isSignedIn, isLoaded } = useUser();
  const { session } = useClerk();

  const [syncing, setSyncing] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  // Function to handle manual sync
  const handleSync = async () => {
    setSyncing(true);
    await syncUserData();
    setSyncing(false);
  };

  return (
    <>
      <Head>
        <title>Auth Status - TopDial Debug</title>
      </Head>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Authentication Status</h1>
            <button
              onClick={handleSync}
              disabled={syncing || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {syncing ? "Syncing..." : "Sync User Data"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border rounded p-4">
              <div className="text-sm text-gray-500">Clerk Status</div>
              <div
                className={`text-xl font-medium ${isLoaded ? (isSignedIn ? "text-green-600" : "text-red-600") : "text-yellow-600"}`}
              >
                {!isLoaded
                  ? "Loading..."
                  : isSignedIn
                    ? "Authenticated"
                    : "Not Authenticated"}
              </div>
            </div>

            <div className="border rounded p-4">
              <div className="text-sm text-gray-500">Database User</div>
              <div
                className={`text-xl font-medium ${isLoading ? "text-yellow-600" : dbUser ? "text-green-600" : "text-red-600"}`}
              >
                {isLoading
                  ? "Loading..."
                  : dbUser
                    ? dbUser.isFallback
                      ? "Fallback Data"
                      : "Synchronized"
                    : "Not Found"}
              </div>
            </div>

            <div className="border rounded p-4">
              <div className="text-sm text-gray-500">User Role</div>
              <div className="text-xl font-medium">
                {dbUser?.role
                  ? dbUser.role.charAt(0).toUpperCase() + dbUser.role.slice(1)
                  : "N/A"}
              </div>
            </div>
          </div>

          {hasError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div>
                  <p className="font-bold text-red-700">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {dbUser && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">User Information</h2>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        Full Name
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dbUser.firstName} {dbUser.lastName}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        Email
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dbUser.email}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        Role
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dbUser.role}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        User ID
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dbUser._id || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        Clerk ID
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dbUser.clerkId}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        Last Synced
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lastSynced
                          ? new Date(lastSynced).toLocaleString()
                          : "Never"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                        Data Source
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dbUser.isFallback ? "Clerk (Fallback)" : "Database"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <button
              onClick={() => setDetailsVisible(!detailsVisible)}
              className="text-blue-600 hover:text-blue-800"
            >
              {detailsVisible
                ? "Hide Technical Details"
                : "Show Technical Details"}
            </button>

            {detailsVisible && (
              <div className="mt-4 bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Debug Information</h3>
                <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
                  {JSON.stringify(
                    {
                      clerk: {
                        isLoaded,
                        isSignedIn,
                        user: user
                          ? {
                              id: user.id,
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.primaryEmailAddress?.emailAddress,
                            }
                          : null,
                        session: session
                          ? {
                              id: session.id,
                              status: session.status,
                              lastActiveAt: session.lastActiveAt,
                              expireAt: session.expireAt,
                            }
                          : null,
                      },
                      topdial: {
                        isAuthenticated,
                        isLoading,
                        hasError,
                        error,
                        dbUser: dbUser
                          ? {
                              ...dbUser,
                              // Hide sensitive data
                              password: dbUser.password
                                ? "[REDACTED]"
                                : undefined,
                            }
                          : null,
                        lastSynced,
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
