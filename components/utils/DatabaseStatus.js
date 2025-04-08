import React from "react";
import { useDatabaseConnection } from "../../contexts/DatabaseContext";
import { FiDatabase, FiAlertCircle, FiCheck } from "react-icons/fi";

/**
 * Component to display database connection status
 * Only shown in development mode or when there's an error
 */
export default function DatabaseStatus({ showAlways = false }) {
  const {
    isConnected,
    isConnecting,
    connectionError,
    lastChecked,
    checkConnection,
  } = useDatabaseConnection();

  // Only show in development or if there's an error (unless showAlways is true)
  if (
    !showAlways &&
    process.env.NODE_ENV !== "development" &&
    isConnected &&
    !connectionError
  ) {
    return null;
  }

  // Format time since last check
  const getTimeAgo = () => {
    if (!lastChecked) return "never checked";

    const seconds = Math.floor((new Date() - new Date(lastChecked)) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 p-3 rounded-lg shadow-lg ${
        connectionError
          ? "bg-red-50"
          : isConnected
            ? "bg-green-50"
            : "bg-yellow-50"
      }`}
    >
      <div className="flex items-center space-x-2">
        <div
          className={`p-2 rounded-full ${
            connectionError
              ? "bg-red-100 text-red-600"
              : isConnected
                ? "bg-green-100 text-green-600"
                : "bg-yellow-100 text-yellow-600"
          }`}
        >
          {connectionError ? (
            <FiAlertCircle size={16} />
          ) : isConnected ? (
            <FiCheck size={16} />
          ) : (
            <FiDatabase size={16} />
          )}
        </div>

        <div>
          <div
            className={`text-sm font-medium ${
              connectionError
                ? "text-red-700"
                : isConnected
                  ? "text-green-700"
                  : "text-yellow-700"
            }`}
          >
            Database:{" "}
            {connectionError
              ? "Error"
              : isConnected
                ? "Connected"
                : "Connecting..."}
          </div>

          <div className="text-xs text-gray-500">
            {connectionError
              ? `Error: ${connectionError}`
              : `Last checked: ${getTimeAgo()}`}
          </div>
        </div>

        <button
          onClick={() => checkConnection(true)}
          className={`ml-2 text-xs py-1 px-2 rounded ${
            isConnecting
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : connectionError
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          }`}
          disabled={isConnecting}
        >
          {isConnecting ? "Checking..." : "Check Now"}
        </button>
      </div>
    </div>
  );
}
