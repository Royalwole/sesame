import { useState } from "react";
import Head from "next/head";

export default function ApproveAgent() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleApproveAgent = async () => {
    if (!userId && !email) {
      setMessage("Please enter a user ID or email address");
      setStatus("error");
      return;
    }

    setLoading(true);
    setMessage("Approving agent...");
    setStatus("info");

    try {
      const res = await fetch("/api/agent/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId || undefined,
          email: email || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve agent");
      }

      setMessage(`Agent approved successfully! ${data.message || ""}`);
      setStatus("success");
    } catch (error) {
      console.error("Error approving agent:", error);
      setMessage(`Error: ${error.message}`);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Head>
        <title>Approve Agent Account - TopDial</title>
      </Head>

      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Approve Agent Account
        </h1>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID (if known)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_2abc123..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
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

        <button
          onClick={handleApproveAgent}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Processing..." : "Approve Agent Account"}
        </button>

        <div className="mt-6 text-center">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
