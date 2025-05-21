// Simple emergency fix tool - no dependencies on AuthContext
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Head from "next/head";

export default function SimpleEmergencyFix() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [fixed, setFixed] = useState(false);

  // Simplified fix function that calls the API directly
  const handleFix = async () => {
    if (!isSignedIn) {
      setMessage("You need to be signed in to use this tool.");
      setStatus("error");
      return;
    }

    setLoading(true);
    setMessage("Applying emergency fix...");
    setStatus("info");

    try {
      // Call the emergency fix API
      const res = await fetch("/api/simple-emergency-fix", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to apply fix");
      }

      setMessage(
        "Fix applied successfully! Please refresh the page to see changes."
      );
      setStatus("success");
      setFixed(true);
    } catch (error) {
      console.error("Error applying fix:", error);
      setMessage(`Error: ${error.message}`);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/auth/sign-in";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Simple Emergency Fix</title>
      </Head>

      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Simple Emergency Fix
        </h1>

        <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
          <h2 className="font-semibold text-red-700">
            Critical Agent Dashboard Fix
          </h2>
          <p className="text-sm mt-1">
            This tool will directly fix your account to access the agent
            dashboard. It sets your role to "agent" and marks your account as
            approved.
          </p>
        </div>

        {isLoaded ? (
          <>
            {isSignedIn ? (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded">
                  <h2 className="font-medium mb-2">Your Account</h2>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>User ID:</strong> {user?.id}
                    </p>
                    <p>
                      <strong>Name:</strong> {user?.firstName} {user?.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                    <p>
                      <strong>Role:</strong>{" "}
                      {user?.publicMetadata?.role || "Not set"}
                    </p>
                    <p>
                      <strong>Approved:</strong>{" "}
                      {user?.publicMetadata?.approved ? "Yes" : "No"}
                    </p>
                  </div>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded ${
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
                    onClick={handleFix}
                    disabled={loading || fixed}
                    className="w-full py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading
                      ? "Applying Fix..."
                      : fixed
                        ? "Fixed Successfully!"
                        : "Apply Emergency Fix"}
                  </button>

                  {fixed && (
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href="/dashboard/agent?breakLoop=true&fixed=true&t=123"
                        className="py-2 bg-blue-600 text-white font-bold rounded text-center hover:bg-blue-700"
                      >
                        Go to Agent Dashboard
                      </a>
                      <a
                        href="/"
                        className="py-2 bg-gray-600 text-white font-bold rounded text-center hover:bg-gray-700"
                      >
                        Go to Homepage
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="/dashboard/user?breakLoop=true"
                      className="py-2 bg-gray-200 text-center rounded hover:bg-gray-300"
                    >
                      User Dashboard
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="py-2 bg-gray-200 text-center rounded hover:bg-gray-300"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4">
                  You need to be signed in to use this tool.
                </p>
                <a
                  href="/auth/sign-in?redirect_url=/simple-fix"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sign In
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
