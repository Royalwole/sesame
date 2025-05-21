import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserPermissions } from "../lib/permissions-manager";
import { useRouter } from "next/router";
import Head from "next/head";

export default function PermissionDebugger() {
  const { user, isLoaded } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixAttempted, setFixAttempted] = useState(false);
  const router = useRouter();

  // Get the user's permissions
  useEffect(() => {
    if (isLoaded && user) {
      // Extract user details
      setUserDetails({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.primaryEmailAddress?.emailAddress,
        role: user.publicMetadata?.role || "No role",
        approved: user.publicMetadata?.approved === true ? "Yes" : "No",
      });

      // Get permissions
      try {
        const userPermissions = getUserPermissions(user);
        setPermissions(userPermissions);
      } catch (err) {
        console.error("Error getting permissions:", err);
      }

      setLoading(false);
    } else if (isLoaded) {
      // User is not logged in
      setLoading(false);
    }
  }, [user, isLoaded]);

  // Handle manual fix attempt
  const handleFixUserRole = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Simple direct approach - update the user's metadata through the API
      const response = await fetch("/api/user/fix-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "agent",
          approved: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFixAttempted(true);
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        console.error("Error fixing role:", data.error);
      }
    } catch (error) {
      console.error("Error fixing role:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle returning to dashboard
  const handleTryDashboard = () => {
    router.push("/dashboard/agent?breakLoop=true");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Head>
        <title>Permission Debugger - TopDial</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Permission Debugger</h1>

          {loading ? (
            <div className="py-10 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <p className="mt-2">Loading user data...</p>
            </div>
          ) : !user ? (
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded mb-4">
              <p>You are not signed in. Please sign in to debug permissions.</p>
              <a
                href="/auth/sign-in"
                className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Sign In
              </a>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50 rounded mb-6">
                <h2 className="text-lg font-semibold mb-2">User Information</h2>
                {userDetails && (
                  <dl className="grid grid-cols-2 gap-2">
                    <dt className="font-medium">ID:</dt>
                    <dd>{userDetails.id}</dd>

                    <dt className="font-medium">Name:</dt>
                    <dd>
                      {userDetails.firstName} {userDetails.lastName}
                    </dd>

                    <dt className="font-medium">Email:</dt>
                    <dd>{userDetails.email}</dd>

                    <dt className="font-medium">Role:</dt>
                    <dd
                      className={
                        userDetails.role !== "agent"
                          ? "text-orange-600 font-bold"
                          : ""
                      }
                    >
                      {userDetails.role}
                    </dd>

                    <dt className="font-medium">Approved:</dt>
                    <dd
                      className={
                        userDetails.approved !== "Yes"
                          ? "text-red-600 font-bold"
                          : "text-green-600"
                      }
                    >
                      {userDetails.approved}
                    </dd>
                  </dl>
                )}
              </div>

              {/* Permission List */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">User Permissions</h2>
                {permissions.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left">Permission</th>
                          <th className="px-4 py-2 text-left">Domain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {permissions.map((permission, index) => {
                          const [domain, action] = permission.split(":");
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                  {permission}
                                </span>
                              </td>
                              <td className="px-4 py-2 capitalize">{domain}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-red-600">
                    No permissions found! This may be causing your access
                    issues.
                  </p>
                )}
              </div>

              {/* Diagnosis */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-6">
                <h2 className="text-lg font-semibold mb-2">Diagnosis</h2>

                {userDetails?.role !== "agent" && (
                  <p className="text-red-600 mb-2">
                    <strong>Issue detected:</strong> Your role is not set to
                    "agent" which is required for agent dashboard access.
                  </p>
                )}

                {userDetails?.approved !== "Yes" && (
                  <p className="text-red-600 mb-2">
                    <strong>Issue detected:</strong> Your account is not marked
                    as approved. Agent dashboard requires an approved account.
                  </p>
                )}

                {userDetails?.role === "agent" &&
                  userDetails?.approved === "Yes" && (
                    <p className="text-green-600 mb-2">
                      <strong>Good news:</strong> Your role and approval status
                      appear to be correct. The issue might be with the
                      permission cache.
                    </p>
                  )}

                <div className="mt-4">
                  <h3 className="font-medium mb-1">Recommended action:</h3>
                  {userDetails?.role !== "agent" ||
                  userDetails?.approved !== "Yes" ? (
                    <p>Fix your user metadata by clicking the button below.</p>
                  ) : (
                    <p>
                      Clear your permission cache and try accessing the
                      dashboard again.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleFixUserRole}
                  disabled={loading || fixAttempted}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex-1"
                >
                  {loading
                    ? "Working..."
                    : fixAttempted
                      ? "Fix Applied!"
                      : "Fix My Agent Role & Approval Status"}
                </button>

                <button
                  onClick={handleTryDashboard}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex-1"
                >
                  Try Agent Dashboard
                </button>

                <a
                  href="/fix-permission-cache"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-center flex-1"
                >
                  Clear Permission Cache
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
