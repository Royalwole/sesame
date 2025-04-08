import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { connectDB, checkDBConnection, getConnectionStatus } from "../lib/db";

// Create context
const DatabaseContext = createContext({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  lastChecked: null,
  checkConnection: () => Promise.resolve(),
});

/**
 * Database connection provider to monitor connection status
 * across the application
 */
export function DatabaseProvider({ children }) {
  const [status, setStatus] = useState({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    lastChecked: null,
  });

  // Check connection status
  const checkConnection = useCallback(async (force = false) => {
    try {
      setStatus((prev) => ({ ...prev, isConnecting: true }));

      const connectionStatus = await checkDBConnection();

      setStatus({
        isConnected: connectionStatus.isConnected,
        isConnecting: false,
        connectionError: null,
        lastChecked: new Date(),
      });

      return connectionStatus;
    } catch (error) {
      setStatus({
        isConnected: false,
        isConnecting: false,
        connectionError: error.message,
        lastChecked: new Date(),
      });
      return { isConnected: false, error: error.message };
    }
  }, []);

  // Check connection on mount for server-rendered pages
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only run in browser
      // Check current connection status from cached state
      const currentStatus = getConnectionStatus();
      setStatus({
        isConnected: !!currentStatus.hasConnection,
        isConnecting: currentStatus.isConnecting,
        connectionError: currentStatus.lastError,
        lastChecked: currentStatus.connectionTime,
      });

      // Then actually check the connection
      checkConnection();

      // Setup interval to periodically check connection in the background
      const interval = setInterval(
        () => {
          checkConnection();
        },
        5 * 60 * 1000
      ); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [checkConnection]);

  return (
    <DatabaseContext.Provider
      value={{
        ...status,
        checkConnection,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

// Custom hook to access database connection status
export function useDatabaseConnection() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error(
      "useDatabaseConnection must be used within a DatabaseProvider"
    );
  }
  return context;
}
