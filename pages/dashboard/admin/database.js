import { useState, useEffect } from "react";
import { withAuth } from "../../../lib/withAuth";
import Head from "next/head";
import Link from "next/link";
import { useDatabaseConnection } from "../../../contexts/DatabaseContext";
import {
  FiArrowLeft,
  FiDatabase,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi";

function AdminDatabasePage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected, connectionError, lastChecked, checkConnection } =
    useDatabaseConnection();

  // Initial data fetch
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Fetch system health data
  async function fetchHealthData() {
    try {
      setLoading(true);
      setError(null);

      // Manually check connection first
      await checkConnection(true);

      // Then fetch detailed health data from the API
      const response = await fetch(`/api/health?_t=${Date.now()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch health data");
      }

      setHealthData(data);
    } catch (err) {
      console.error("Error fetching health data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Database Management | Admin Dashboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link
            href="/dashboard/admin"
            className="flex items-center text-gray-600 hover:text-blue-600 mr-4"
          >
            <FiArrowLeft className="mr-2" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Database Management</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Overall Status Card */}
          <div
            className={`rounded-lg shadow p-6 ${
              connectionError
                ? "bg-red-50 border border-red-100"
                : isConnected
                  ? "bg-green-50 border border-green-100"
                  : "bg-yellow-50 border border-yellow-100"
            }`}
          >
            <div className="flex items-center mb-4">
              <div
                className={`p-2 rounded-full mr-3 ${
                  connectionError
                    ? "bg-red-100 text-red-600"
                    : isConnected
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                }`}
              >
                <FiDatabase size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Database Status</h2>
                <p
                  className={`${
                    connectionError
                      ? "text-red-700"
                      : isConnected
                        ? "text-green-700"
                        : "text-yellow-700"
                  }`}
                >
                  {connectionError
                    ? "Connection Error"
                    : isConnected
                      ? "Connected"
                      : "Connecting..."}
                </p>
              </div>
            </div>

            {connectionError && (
              <div className="mt-2 p-3 bg-red-100 rounded-md text-red-700 text-sm">
                <strong>Error:</strong> {connectionError}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={fetchHealthData}
                className="flex items-center justify-center w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                <FiRefreshCw
                  className={`mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Checking..." : "Check Connection"}
              </button>
            </div>
          </div>

          {/* Last Check Information */}
          <div className="rounded-lg shadow p-6 bg-white">
            <h2 className="text-xl font-semibold mb-3">Last Check</h2>
            {lastChecked ? (
              <>
                <p className="text-gray-700">
                  <strong>Timestamp:</strong>{" "}
                  {new Date(lastChecked).toLocaleString()}
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Status:</strong>{" "}
                  {isConnected ? "Successful" : "Failed"}
                </p>
              </>
            ) : (
              <p className="text-gray-500">No recent checks recorded</p>
            )}
          </div>

          {/* Environment Information */}
          <div className="rounded-lg shadow p-6 bg-white">
            <h2 className="text-xl font-semibold mb-3">Environment</h2>
            {healthData ? (
              <>
                <p className="text-gray-700">
                  <strong>Mode:</strong> {healthData.environment}
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Version:</strong> {healthData.version}
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Server Time:</strong>{" "}
                  {new Date(healthData.timestamp).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-gray-500">
                {loading ? "Loading..." : "Information unavailable"}
              </p>
            )}
          </div>
        </div>

        {/* Database Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Metrics</h2>

          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-700 flex items-start">
              <FiAlertTriangle size={20} className="mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Error fetching database metrics</p>
                <p className="mt-1 text-sm">{error}</p>
                <button
                  onClick={fetchHealthData}
                  className="mt-2 text-sm bg-red-100 px-3 py-1 rounded hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : healthData?.database ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Connection Status</p>
                <p
                  className={`text-lg font-medium ${healthData.database.connected ? "text-green-600" : "text-red-600"}`}
                >
                  {healthData.database.status}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Last Connected</p>
                <p className="text-lg font-medium">
                  {healthData.database.lastConnection
                    ? new Date(
                        healthData.database.lastConnection
                      ).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Reconnect Attempts</p>
                <p className="text-lg font-medium">
                  {healthData.database.reconnectAttempts || 0}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No database metrics available</p>
          )}
        </div>

        {/* Troubleshooting Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            Troubleshooting Actions
          </h2>

          <div className="space-y-3">
            <button
              onClick={fetchHealthData}
              className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Refresh Connection Status
            </button>

            <button
              onClick={() => {
                // Force reload database health endpoint
                fetch("/api/health?force=true");
                setTimeout(fetchHealthData, 1000);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Force Reconnection Attempt
            </button>

            <Link
              href="/api/health"
              target="_blank"
              className="inline-block w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-center"
            >
              View Raw Health Data
            </Link>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Connection Troubleshooting</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Verify that MongoDB is running and accessible</li>
              <li>Check that environment variables are properly configured</li>
              <li>
                Ensure network connectivity between the application and the
                database
              </li>
              <li>
                Review database logs for any authentication or authorization
                issues
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// Only allow admin access to this page
export const getServerSideProps = withAuth({ role: "admin" });

export default AdminDatabasePage;
