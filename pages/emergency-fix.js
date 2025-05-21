import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Head from "next/head";
// Remove server-side import that causes build issues
// import { clerkClient } from "@clerk/nextjs/server";

// EMERGENCY FIX TOOL - This bypasses all permissions and directly fixes your account
export default function EmergencyRoleFixTool() {
  const { user, isLoaded } = useUser();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [fixAttempted, setFixAttempted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") return;

    // Extract user details when loaded
    if (isLoaded) {
      if (user) {
        setUserDetails({
          id: user.id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          role: user.publicMetadata?.role || "No role",
          approved: user.publicMetadata?.approved === true ? "Yes" : "No",
        });
      }
      setLoading(false);
    }
  }, [user, isLoaded]);

  // Handle the emergency fix
  const handleEmergencyFix = async () => {
    setStatus("info");
    setMessage("Applying emergency fix to user account...");
    setLoading(true);

    try {
      const response = await fetch("/api/emergency-fix", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Emergency fix failed");
      }

      setStatus("success");
      setMessage(`Success! Your account has been fixed. ${data.message || ""}`);
      setFixAttempted(true);

      // Force reload all metadata
      setTimeout(() => {
        window.location.href =
          "/dashboard/agent?fixed=true&breakLoop=true&t=" + Date.now();
      }, 3000);
    } catch (error) {
      console.error("Error applying emergency fix:", error);
      setStatus("error");
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Head>
        <title>Emergency Fix Tool - TopDial</title>
      </Head>

      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="bg-red-600 text-white p-3 -mt-6 -mx-6 mb-6 rounded-t-lg">
            <h1 className="text-xl font-bold">
              🚨 EMERGENCY REDIRECT LOOP FIX
            </h1>
          </div>

          {loading && !fixAttempted ? (
            <div className="py-10 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-3">Loading account details...</p>
            </div>
          ) : (
            <>
              {!user ? (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                  <p className="text-yellow-700">
                    You are not logged in. Please sign in first.
                  </p>
                  <a
                    href="/auth/sign-in?redirect_url=/emergency-fix"
                    className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Sign In
                  </a>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-bold mb-2">Account Details</h2>
                    <div className="bg-gray-50 p-3 rounded">
                      {userDetails && (
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>User ID:</strong> {userDetails.id}
                          </p>
                          <p>
                            <strong>Name:</strong> {userDetails.firstName}{" "}
                            {userDetails.lastName}
                          </p>
                          <p>
                            <strong>Email:</strong> {userDetails.email}
                          </p>
                          <p
                            className={
                              userDetails.role !== "agent"
                                ? "text-red-600 font-bold"
                                : ""
                            }
                          >
                            <strong>Role:</strong> {userDetails.role}
                          </p>
                          <p
                            className={
                              userDetails.approved !== "Yes"
                                ? "text-red-600 font-bold"
                                : ""
                            }
                          >
                            <strong>Approved:</strong> {userDetails.approved}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-lg font-bold mb-2">Diagnosis</h2>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      {userDetails?.role !== "agent" && (
                        <p className="text-red-600 mb-2">
                          Problem detected: Your role is not set to "agent".
                        </p>
                      )}

                      {userDetails?.approved !== "Yes" && (
                        <p className="text-red-600 mb-2">
                          Problem detected: Your account is not marked as
                          approved.
                        </p>
                      )}

                      {userDetails?.role === "agent" &&
                        userDetails?.approved === "Yes" && (
                          <p className="text-green-600 mb-2">
                            Your role and approval status look correct. The
                            issue might be with cached permissions.
                          </p>
                        )}

                      <p>
                        <strong>Solution:</strong> The emergency fix will set
                        your role to "agent", mark your account as approved, and
                        clear all permissions cache.
                      </p>
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`p-4 mb-4 rounded ${
                        status === "error"
                          ? "bg-red-100 text-red-700"
                          : status === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={handleEmergencyFix}
                      disabled={loading || fixAttempted}
                      className="w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60 font-bold"
                    >
                      {loading
                        ? "Applying Fix..."
                        : fixAttempted
                          ? "Fixed! Redirecting..."
                          : "Apply Emergency Fix"}
                    </button>

                    {!fixAttempted && (
                      <div className="grid grid-cols-2 gap-3">
                        <a
                          href="/dashboard/user?breakLoop=true"
                          className="py-2 bg-gray-200 text-center rounded hover:bg-gray-300"
                        >
                          User Dashboard
                        </a>
                        <a
                          href="/bypass-agent"
                          className="py-2 bg-gray-200 text-center rounded hover:bg-gray-300"
                        >
                          Bypass Agent Dashboard
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <div className="mt-6 text-xs text-gray-500">
            <p>
              Emergency Fix Tool v1.0 | This tool will directly modify your
              Clerk user metadata
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
