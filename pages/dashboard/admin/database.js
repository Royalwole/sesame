import { useState, useEffect } from "react";
import { withAuth } from "../../../lib/withAuth";
import AdminLayout from "../../../components/layout/AdminLayout";
import { FiDatabase, FiClock, FiUsers, FiList } from "react-icons/fi";
import Loader from "../../../components/utils/Loader";

function DatabaseStatus() {
  const [status, setStatus] = useState({
    isConnected: false,
    lastSync: null,
    collections: {},
    performance: {
      avgResponseTime: null,
      activeConnections: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDatabaseStatus();
  }, []);

  const fetchDatabaseStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/database/status");
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to fetch database status");

      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatusCard = ({ icon: Icon, title, value, subtitle, status }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {subtitle && (
                  <div className="ml-2 flex items-baseline text-sm font-semibold">
                    {subtitle}
                  </div>
                )}
              </dd>
            </dl>
          </div>
          {status && (
            <div
              className={`ml-5 flex-shrink-0 ${status === "healthy" ? "text-green-500" : "text-red-500"}`}
            >
              <div className="h-3 w-3 rounded-full bg-current"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Database Status">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            System Status
          </h1>
          <button
            onClick={fetchDatabaseStatus}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh Status
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="large" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StatusCard
                icon={FiDatabase}
                title="Database Connection"
                value={status.isConnected ? "Connected" : "Disconnected"}
                status={status.isConnected ? "healthy" : "error"}
              />
              <StatusCard
                icon={FiClock}
                title="Average Response Time"
                value={`${status.performance.avgResponseTime || 0}ms`}
                status={
                  status.performance.avgResponseTime < 100 ? "healthy" : "error"
                }
              />
              <StatusCard
                icon={FiDatabase}
                title="Active Connections"
                value={status.performance.activeConnections}
                status={
                  status.performance.activeConnections < 100
                    ? "healthy"
                    : "error"
                }
              />
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Collection Statistics
                </h2>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  {Object.entries(status.collections).map(
                    ([collection, count], idx) => (
                      <div
                        key={collection}
                        className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                      >
                        <dt className="text-sm font-medium text-gray-500">
                          {collection}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {count} documents
                        </dd>
                      </div>
                    )
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = withAuth({ role: "admin" });

export default DatabaseStatus;
