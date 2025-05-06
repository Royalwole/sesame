import { createContext, useContext, useState, useEffect } from "react";
import { checkDBConnection, connectDB } from "../lib/db";
import { loadEnvConfig } from "../lib/env-loader";
import { useHydration } from '../lib/useHydration';

// Check if running on client or server
const isServer = typeof window === 'undefined';

// Create the context
const DatabaseContext = createContext({
  isConnected: false,
  isLoading: true,
  error: null,
});

// Connection status constants
const CONNECTION_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  ERROR: "error"
};

// Provider component
export function DatabaseProvider({ children }) {
  // Move loadEnvConfig call here
  useEffect(() => {
    if (isServer) {
      loadEnvConfig();
    }
  }, []);

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const [connectionDetails, setConnectionDetails] = useState({});
  const [connectionTimeoutId, setConnectionTimeoutId] = useState(null);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.CONNECTING);
  const isHydrated = useHydration();

  // Categorize database errors for better handling
  const categorizeDBError = (error) => {
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("connect ETIMEDOUT")) {
      return {
        type: "CONNECTION_REFUSED",
        message: "Database server is unreachable",
        recoverable: false,
        statusCode: 503
      };
    } else if (errorMessage.includes("Authentication failed")) {
      return {
        type: "AUTH_FAILED",
        message: "Database authentication failed",
        recoverable: false,
        statusCode: 401
      };
    } else if (errorMessage.includes("timed out")) {
      return {
        type: "TIMEOUT",
        message: "Database connection timed out",
        recoverable: true,
        statusCode: 504
      };
    } else {
      return {
        type: "UNKNOWN",
        message: errorMessage,
        recoverable: true,
        statusCode: 500
      };
    }
  };

  // Function to check connection status with timeout
  const checkConnection = async () => {
    // Skip database operations on client side
    if (!isServer) {
      console.log("⚠️ Cannot check database connection on client side");
      return;
    }
    
    setIsLoading(true);
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);

    // Set a timeout to prevent hanging on connection check
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setIsConnected(false);
      setConnectionStatus(CONNECTION_STATUS.ERROR);
      setError("Connection check timed out");
      setLastChecked(new Date());
    }, 5000); // 5-second timeout

    try {
      const status = await checkDBConnection();
      // Clear timeout as we got a response
      clearTimeout(timeoutId);
      
      setIsConnected(status.isConnected);
      setConnectionDetails({
        host: status.host,
        database: status.database,
        readyState: status.readyState
      });
      
      if (!status.isConnected && status.error) {
        const categorizedError = categorizeDBError(status.error);
        setError(categorizedError.message);
        setConnectionStatus(CONNECTION_STATUS.ERROR);
      } else {
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        // Reset recovery attempts on successful connection
        setRecoveryAttempts(0);
      }
    } catch (err) {
      // Clear timeout as we got an error
      clearTimeout(timeoutId);
      
      const categorizedError = categorizeDBError(err);
      setIsConnected(false);
      setConnectionStatus(CONNECTION_STATUS.ERROR);
      setError(categorizedError.message);
      console.error(`Database connection check failed [${categorizedError.type}]:`, err.message);
      
      // Attempt recovery if the error is recoverable
      if (categorizedError.recoverable && recoveryAttempts < 3) {
        const delay = Math.pow(2, recoveryAttempts) * 1000; // Exponential backoff
        console.log(`Scheduling connection recovery in ${delay}ms (attempt ${recoveryAttempts + 1})`);
        
        setTimeout(() => {
          setRecoveryAttempts(prev => prev + 1);
          handleReconnect();
        }, delay);
      }
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
      setCheckCount(prev => prev + 1);
    }
  };

  // Check connection on mount with a connection timeout
  useEffect(() => {
    // Don't attempt to connect on client side
    if (!isServer) {
      // Set a state that indicates we're in client mode
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      setIsLoading(false);
      console.log("📱 Client-side rendering detected - database connections will be handled server-side");
      return;
    }
    
    let mounted = true;
    
    const initialCheck = async () => {
      try {
        console.log("🔄 Attempting initial database connection...");
        setIsLoading(true);
        
        // Create connection timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (mounted) {
            console.warn("⚠️ Database connection timed out");
            setIsLoading(false);
            setIsConnected(false);
            setConnectionStatus(CONNECTION_STATUS.ERROR);
            setError("Connection attempt timed out");
            setLastChecked(new Date());
          }
        }, 8000); // 8-second timeout
        
        setConnectionTimeoutId(timeout);
        
        // First connection attempt
        await connectDB();
        
        // Clear timeout as we got a successful connection
        clearTimeout(timeout);
        
        if (mounted) {
          setIsConnected(true);
          setError(null);
          setConnectionStatus(CONNECTION_STATUS.CONNECTED);
          setIsLoading(false);
          setLastChecked(new Date());
        }
      } catch (error) {
        console.error("❌ Initial database connection failed:", error.message);
        
        // Clear any existing timeout
        if (connectionTimeoutId) {
          clearTimeout(connectionTimeoutId);
        }
        
        if (mounted) {
          const categorizedError = categorizeDBError(error);
          setIsConnected(false);
          setConnectionStatus(CONNECTION_STATUS.ERROR);
          setError(categorizedError.message);
          setIsLoading(false);
          setLastChecked(new Date());
        }
      }
    };
    
    // Delay the initial database connection to prioritize UI rendering
    const delayInitialConnection = setTimeout(() => {
      initialCheck();
    }, 1000); // Delay by 1 second
    
    // Periodic check
    let intervalId;
    
    // Set more frequent checks in development, less frequent in production
    const checkInterval = process.env.NODE_ENV === 'production' ? 300000 : 60000; // 5 min in prod, 1 min in dev
    
    // Start periodic checks after a delay to prevent overloading on initial load
    const intervalDelayId = setTimeout(() => {
      intervalId = setInterval(checkConnection, checkInterval);
    }, 10000); // Start interval checks after 10 seconds
    
    return () => {
      mounted = false;
      if (delayInitialConnection) clearTimeout(delayInitialConnection);
      if (intervalId) clearInterval(intervalId);
      if (intervalDelayId) clearTimeout(intervalDelayId);
      if (connectionTimeoutId) clearTimeout(connectionTimeoutId);
    };
  }, []);

  // Handle manual reconnect with timeout
  const handleReconnect = async () => {
    setIsLoading(true);
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    setError(null);
    
    // Set a timeout to prevent hanging on reconnect
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setIsConnected(false);
      setConnectionStatus(CONNECTION_STATUS.ERROR);
      setError("Reconnection attempt timed out");
      setLastChecked(new Date());
    }, 5000); // 5-second timeout
    
    try {
      await connectDB(true); // Force reconnection
      clearTimeout(timeoutId);
      setIsConnected(true);
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
    } catch (error) {
      clearTimeout(timeoutId);
      const categorizedError = categorizeDBError(error);
      setIsConnected(false);
      setConnectionStatus(CONNECTION_STATUS.ERROR);
      setError(categorizedError.message);
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
      setCheckCount(prev => prev + 1);
    }
  };

  // During SSR or before hydration, return a minimal context
  if (!isHydrated) {
    return (
      <DatabaseContext.Provider value={{ isConnected: false, isLoading: true, error: null }}>
        {children}
      </DatabaseContext.Provider>
    );
  }

  // Context value
  const contextValue = {
    isConnected,
    isLoading,
    error,
    lastChecked,
    checkCount,
    connectionDetails,
    connectionStatus,
    checkConnection,
    handleReconnect,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}

// Custom hook for using the database context
export function useDatabaseConnection() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabaseConnection must be used within a DatabaseProvider");
  }
  return context;
}

// Export as default as well
export default DatabaseContext;
