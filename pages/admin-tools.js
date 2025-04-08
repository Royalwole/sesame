import { useState } from "react";
import Head from "next/head";

export default function AdminTools() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState("");

  const promoteAdmin = async () => {
    setLoading(true);
    setOperation("admin");
    try {
      const response = await fetch("/api/direct-admin-promotion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert("Success! User has been promoted to admin.");
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: error.message });
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const promoteAgent = async () => {
    setLoading(true);
    setOperation("agent");
    try {
      const response = await fetch("/api/make-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert("Success! User has been promoted to agent.");
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: error.message });
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Admin Tools</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">Admin Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl mb-2">Promote Admin</h2>
          <p className="mb-4">
            Click the button below to promote the user
            (akolawoleakinola@gmail.com) to admin.
          </p>
          <button
            onClick={promoteAdmin}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading && operation === "admin"
              ? "Processing..."
              : "Promote to Admin"}
          </button>
        </div>

        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl mb-2">Promote Agent</h2>
          <p className="mb-4">
            Click the button below to promote the user (royalvilleng@gmail.com)
            to agent.
          </p>
          <button
            onClick={promoteAgent}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && operation === "agent"
              ? "Processing..."
              : "Promote to Agent"}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-4 p-4 border rounded bg-gray-100">
          <h3 className="font-bold">Result:</h3>
          <pre className="mt-2 p-2 bg-white overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
