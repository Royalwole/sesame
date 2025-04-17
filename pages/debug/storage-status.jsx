import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

export default function StorageStatusPage() {
  const [status, setStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check health status
  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/health?t=${Date.now()}`);
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run storage tests
  const runTest = async (testType) => {
    setTestLoading(true);
    try {
      const res = await fetch(`/api/test/storage?test=${testType}`, {
        method: "POST",
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error("Test error:", err);
    } finally {
      setTestLoading(false);
    }
  };

  // Run Blob diagnostic test
  const runBlobTest = async () => {
    setTestLoading("blob-detailed");
    try {
      // Test connection and get detailed diagnostic info
      const res = await fetch("/api/test/blob-diagnostic", {
        method: "POST",
      });
      const data = await res.json();
      setTestResult({
        ...testResult,
        blobDetailed: data,
      });
    } catch (err) {
      console.error("Blob diagnostic test error:", err);
      setTestResult({
        ...testResult,
        blobDetailed: {
          success: false,
          error: err.message,
          clientSide: true,
        },
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <>
      <Head>
        <title>Storage Status - TopDial Debug</title>
      </Head>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Storage Systems Status</h1>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Checking..." : "Refresh"}
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              Error checking status: {error}
            </div>
          ) : loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : status ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500">Status</div>
                  <div
                    className={`text-xl font-medium ${status.status === "ok" ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {status.status}
                  </div>
                </div>

                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500">Environment</div>
                  <div className="text-xl font-medium">
                    {status.environment}
                  </div>
                </div>

                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500">Version</div>
                  <div className="text-xl font-medium">{status.version}</div>
                </div>
              </div>

              {/* Storage systems status */}
              <div className="border-t pt-4">
                <h2 className="text-lg font-medium mb-4">Storage Systems</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* MongoDB Status */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-lg">MongoDB Database</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          status.storage?.database?.connected
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {status.storage?.database?.connected
                          ? "Connected"
                          : "Disconnected"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Status: </span>
                        <span className="font-medium">
                          {status.storage?.database?.status || "Unknown"}
                        </span>
                      </div>

                      {status.storage?.database?.lastConnection && (
                        <div>
                          <span className="text-gray-500">
                            Last Connection:{" "}
                          </span>
                          <span className="font-medium">
                            {new Date(
                              status.storage.database.lastConnection
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => runTest("db")}
                        disabled={testLoading}
                        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {testLoading === "db"
                          ? "Testing..."
                          : "Test Connection"}
                      </button>
                    </div>
                  </div>

                  {/* Vercel Blob Status */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-lg">
                        Vercel Blob Storage
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          !status.storage?.blob?.enabled
                            ? "bg-gray-100 text-gray-800"
                            : status.storage?.blob?.connected
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {!status.storage?.blob?.enabled
                          ? "Not Configured"
                          : status.storage?.blob?.connected
                            ? "Connected"
                            : "Error"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Status: </span>
                        <span className="font-medium">
                          {status.storage?.blob?.status || "Unknown"}
                        </span>
                      </div>

                      {status.storage?.blob?.message && (
                        <div>
                          <span className="text-gray-500">Message: </span>
                          <span className="font-medium">
                            {status.storage.blob.message}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => runTest("blob")}
                        disabled={testLoading || !status.storage?.blob?.enabled}
                        className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {testLoading === "blob"
                          ? "Testing..."
                          : "Test Connection"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blob Diagnostics */}
              <div className="mt-6">
                <h3 className="font-medium text-lg mb-3">
                  Vercel Blob Diagnostics
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="mb-3">
                    Run a detailed diagnostic to check Vercel Blob setup:
                  </p>
                  <button
                    onClick={runBlobTest}
                    disabled={testLoading === "blob-detailed"}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                  >
                    {testLoading === "blob-detailed"
                      ? "Running diagnostics..."
                      : "Test Blob Configuration"}
                  </button>

                  {testResult?.blobDetailed && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Results:</h4>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-64">
                          {JSON.stringify(testResult.blobDetailed, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Results */}
              {testResult && (
                <div className="border-t pt-4">
                  <h2 className="text-lg font-medium mb-3">Test Results</h2>
                  <div className="bg-gray-50 p-4 rounded">
                    <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Setup Instructions */}
              <div className="border-t pt-4">
                <h2 className="text-lg font-medium mb-3">Setup Instructions</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">MongoDB Setup</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      <li>
                        Add <code>MONGODB_URI</code> to your{" "}
                        <code>.env.local</code> file
                      </li>
                      <li>
                        For local development:{" "}
                        <code>
                          MONGODB_URI=mongodb://localhost:27017/topdial_dev
                        </code>
                      </li>
                      <li>
                        For production: Use MongoDB Atlas connection string
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Vercel Blob Setup</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      <li>
                        Add <code>BLOB_READ_WRITE_TOKEN</code> to your{" "}
                        <code>.env.local</code> file
                      </li>
                      <li>
                        Create Vercel Blob store:{" "}
                        <code>npx vercel@latest add blob</code>
                      </li>
                      <li>
                        Add @vercel/blob to your project:{" "}
                        <code>npm install @vercel/blob</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between">
                <Link
                  href="/debug/db-status"
                  className="text-blue-600 hover:underline"
                >
                  Database Status Details
                </Link>

                <Link href="/" className="text-blue-600 hover:underline">
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No status information available</div>
          )}
        </div>
      </div>
    </>
  );
}
