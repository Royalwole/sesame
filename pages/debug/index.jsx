import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  FiDatabase,
  FiHardDrive,
  FiActivity,
  FiAlertCircle,
  FiCpu,
} from "react-icons/fi";

// Debug dashboard for development
export default function DebugDashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load health status on mount
  useEffect(() => {
    fetchHealthStatus();
  }, []);

  // Fetch health status from API
  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/debug/health?t=${Date.now()}`);
      const data = await res.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch health status");
      console.error("Health check error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>TopDial Debug Dashboard</title>
      </Head>

      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">TopDial Debug Dashboard</h1>

          <button
            onClick={fetchHealthStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiActivity className="mr-2" size={20} /> System Status
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded">
              <div className="flex items-center">
                <FiAlertCircle className="mr-2" />
                <span>Error loading status: {error}</span>
              </div>
            </div>
          ) : health ? (
            <div>
              <div className="flex mb-6">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    health.status === "ok"
                      ? "bg-green-100 text-green-800"
                      : health.status === "degraded"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {health.status === "ok"
                    ? "Healthy"
                    : health.status === "degraded"
                      ? "Degraded"
                      : "Critical Issues"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MongoDB Status */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FiDatabase className="mr-2" />
                    <h3 className="font-medium">MongoDB</h3>
                  </div>

                  <div
                    className={`text-sm px-2 py-1 rounded-full inline-block ${
                      health.services?.mongodb
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {health.services?.mongodb ? "Connected" : "Disconnected"}
                  </div>

                  <div className="mt-3 text-sm">
                    <Link
                      href="/debug/db-status"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Database Details →
                    </Link>
                  </div>
                </div>

                {/* Blob Storage Status */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FiHardDrive className="mr-2" />
                    <h3 className="font-medium">Blob Storage</h3>
                  </div>

                  <div
                    className={`text-sm px-2 py-1 rounded-full inline-block ${
                      health.services?.blobStorage
                        ? "bg-green-100 text-green-800"
                        : health.details?.blobStorage?.status ===
                            "not-configured"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {health.services?.blobStorage
                      ? "Connected"
                      : health.details?.blobStorage?.status === "not-configured"
                        ? "Not Configured"
                        : "Disconnected"}
                  </div>

                  <div className="mt-3 text-sm">
                    <Link
                      href="/debug/storage-status"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Storage Details →
                    </Link>
                  </div>
                </div>

                {/* Memory Status */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FiCpu className="mr-2" />
                    <h3 className="font-medium">Memory</h3>
                  </div>

                  <div
                    className={`text-sm px-2 py-1 rounded-full inline-block ${
                      health.services?.memory
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {health.services?.memory ? "Normal" : "High Usage"}
                  </div>

                  {health.details?.memory && (
                    <div className="mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Heap Usage: </span>
                        <span className="font-medium">
                          {Math.round(
                            health.details.memory.heapUsed / 1024 / 1024
                          )}{" "}
                          /
                          {Math.round(
                            health.details.memory.heapTotal / 1024 / 1024
                          )}{" "}
                          MB (
                          {Math.round(
                            health.details.memory.heapUsagePercent * 100
                          )}
                          %)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">RSS: </span>
                        <span className="font-medium">
                          {Math.round(health.details.memory.rss / 1024 / 1024)}{" "}
                          MB
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No status information available</div>
          )}
        </div>

        {/* Debug Pages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Utilities</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/debug/db-status"
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Database Status</h3>
              <p className="text-sm text-gray-500 mt-1">
                MongoDB connection details and statistics
              </p>
            </Link>

            <Link
              href="/debug/storage-status"
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Storage Status</h3>
              <p className="text-sm text-gray-500 mt-1">
                Blob storage configuration and testing
              </p>
            </Link>

            <Link
              href="/debug/blob-upload"
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Blob Upload Test</h3>
              <p className="text-sm text-gray-500 mt-1">
                Test file uploads to Vercel Blob
              </p>
            </Link>

            <Link
              href="/debug/auth-status"
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Authentication Status</h3>
              <p className="text-sm text-gray-500 mt-1">
                Check authentication and user details
              </p>
            </Link>

            <Link
              href="/api/debug/health"
              target="_blank"
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium">Raw Health Data</h3>
              <p className="text-sm text-gray-500 mt-1">
                View raw JSON health data
              </p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
