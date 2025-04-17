import { createContext, useContext, useState, useEffect } from "react";
import { checkDBConnection, connectDB } from "../lib/db";

// Create the context
const DatabaseContext = createContext();

// Provider component
export function DatabaseProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const [connectionDetails, setConnectionDetails] = useState({});
  const [connectionTimeoutId, setConnectionTimeoutId] = useState(null);

  // Function to check connection status with timeout
  const checkConnection = async () => {
    setIsConnecting(true);
    setConnectionError(null);

    // Set a timeout to prevent hanging on connection check
    const timeoutId = setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(false);
      setConnectionError("Connection check timed out");
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
        setConnectionError(status.error);
      }
    } catch (err) {
      // Clear timeout as we got an error
      clearTimeout(timeoutId);
      
      setIsConnected(false);
      setConnectionError(err.message);
      console.error("Database connection check failed:", err);
    } finally {
      setIsConnecting(false);
      setLastChecked(new Date());
      setCheckCount(prev => prev + 1);
    }
  };

  // Check connection on mount with a connection timeout
  useEffect(() => {
    let mounted = true;
    
    const initialCheck = async () => {
      try {
        console.log("🔄 Attempting initial database connection...");
        setIsConnecting(true);
        
        // Create connection timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (mounted) {
            console.warn("⚠️ Database connection timed out");
            setIsConnecting(false);
            setIsConnected(false);
            setConnectionError("Connection attempt timed out");
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
          setConnectionError(null);
          setIsConnecting(false);
          setLastChecked(new Date());
        }
      } catch (error) {
        console.error("❌ Initial database connection failed:", error.message);
        
        // Clear any existing timeout
        if (connectionTimeoutId) {
          clearTimeout(connectionTimeoutId);
        }
        
        if (mounted) {
          setIsConnected(false);
          setConnectionError(error.message);
          setIsConnecting(false);
          setLastChecked(new Date());
          
          // Skip retry on initial page load to prevent loading timeout
          // We'll try again later with the interval check
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
    setIsConnecting(true);
    setConnectionError(null);
    
    // Set a timeout to prevent hanging on reconnect
    const timeoutId = setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(false);
      setConnectionError("Reconnection attempt timed out");
      setLastChecked(new Date());
    }, 5000); // 5-second timeout
    
    try {
      await connectDB(true); // Force reconnection
      clearTimeout(timeoutId);
      setIsConnected(true);
    } catch (error) {
      clearTimeout(timeoutId);
      setIsConnected(false);
      setConnectionError(error.message);
    } finally {
      setIsConnecting(false);
      setLastChecked(new Date());
      setCheckCount(prev => prev + 1);
    }
  };

  // Context value
  const contextValue = {
    isConnected,
    isConnecting,
    connectionError,
    lastChecked,
    checkCount,
    connectionDetails,
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
