import { useState, useEffect } from "react";
import Head from "next/head";

export default function DbStatusPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check server health
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

  // Load on mount
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <>
      <Head>
        <title>Database Status - TopDial Debug</title>
      </Head>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Database Status</h1>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="text-xl font-medium">{status.status}</div>
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

              <div className="border-t pt-4">
                <h2 className="text-lg font-medium mb-3">Database</h2>

                {status.database ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded p-4">
                      <div className="text-sm text-gray-500">
                        Connection Status
                      </div>
                      <div
                        className={`text-xl font-medium ${status.database.connected ? "text-green-600" : "text-red-600"}`}
                      >
                        {status.database.connected
                          ? "Connected"
                          : "Disconnected"}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {status.database.status}
                      </div>
                    </div>

                    {status.database.lastConnection && (
                      <div className="border rounded p-4">
                        <div className="text-sm text-gray-500">
                          Last Connection
                        </div>
                        <div className="text-xl font-medium">
                          {new Date(
                            status.database.lastConnection
                          ).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-yellow-600">
                    No database information available
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h2 className="text-lg font-medium mb-2">Raw Response</h2>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(status, null, 2)}
                </pre>
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
