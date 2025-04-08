import mongoose from "mongoose";

// Configuration with fallback values for robustness
const CONNECTION_TIMEOUT = parseInt(
  process.env.DB_CONNECTION_TIMEOUT || "15000",
  10
);
const SOCKET_TIMEOUT = parseInt(process.env.DB_SOCKET_TIMEOUT || "45000", 10);

// Enhanced connection options with better defaults
const options = {
  serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
  connectTimeoutMS: CONNECTION_TIMEOUT,
  socketTimeoutMS: SOCKET_TIMEOUT,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  retryReads: true,
};

// Safe global state management that works with both app and pages router
const getGlobalMongoose = () => {
  if (typeof window === "undefined") {
    // Server-side: use global object safely
    const globalWithMongo = global;
    if (!globalWithMongo.mongoose) {
      globalWithMongo.mongoose = {
        conn: null,
        promise: null,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        connectionTimestamp: null,
      };
    }
    return globalWithMongo.mongoose;
  }

  // Client-side: use a mock cache object
  return {
    conn: null,
    promise: null,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,
    connectionTimestamp: null,
  };
};

// Get cached connection
const cached = getGlobalMongoose();

// Safe check for MongoDB URI
const getMongoDB_URI = () => {
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.MONGODB_URI
  ) {
    return process.env.MONGODB_URI;
  }

  // Development fallback
  if (process.env.NODE_ENV === "development") {
    return "mongodb://localhost:27017/topdial_dev";
  }

  return null;
};

// Connection events monitoring - only use on server
function setupConnectionMonitoring(connection) {
  if (!connection) return;

  connection.on("connected", () => {
    console.log("[DB] MongoDB connection established successfully");
    cached.isConnecting = false;
    cached.reconnectAttempts = 0;
    cached.connectionTimestamp = new Date();
    cached.lastError = null;
  });

  connection.on("disconnected", () => {
    console.log("[DB] MongoDB disconnected");
    cached.conn = null;
  });

  connection.on("error", (err) => {
    console.error("[DB] MongoDB connection error:", err);
    cached.lastError = err;
  });
}

/**
 * Connect to MongoDB with enhanced error handling
 */
export async function connectDB(forceNewConnection = false) {
  // CLIENT-SIDE SAFETY: Return dummy connection in browser environment
  if (typeof window !== "undefined") {
    console.log(
      "[DB] Browser environment detected - returning dummy connection"
    );
    return { isConnected: false, isDummy: true };
  }

  try {
    // Check for existing connection that's ready
    const readyState = mongoose.connection?.readyState || 0;
    if (!forceNewConnection && cached.conn && readyState === 1) {
      return cached.conn;
    }

    // If a connection attempt is already in progress, join that promise
    if (cached.isConnecting && cached.promise) {
      return cached.promise;
    }

    // Get MongoDB URI with safety checks
    let MONGODB_URI = getMongoDB_URI();

    // Still no URI? Throw descriptive error
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in environment variables. " +
          "Please add it to your .env.local file or environment."
      );
    }

    // Add database name if specified separately
    const MONGODB_DB = process.env.MONGODB_DB;
    let uri = MONGODB_URI;
    if (MONGODB_DB && !uri.includes("/?") && !uri.includes("?")) {
      uri = uri.endsWith("/") ? `${uri}${MONGODB_DB}` : `${uri}/${MONGODB_DB}`;
    }

    console.log(
      `[DB] Connecting to MongoDB (URI format: ${uri.slice(0, 12)}...)`
    );
    cached.isConnecting = true;

    try {
      // Clear existing promise if forcing new connection
      if (forceNewConnection && cached.promise) {
        cached.promise = null;
      }

      // Create a new connection promise with timeout
      cached.promise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cached.isConnecting = false;
          cached.reconnectAttempts++;
          reject(
            new Error(`[DB] Connection timed out after ${CONNECTION_TIMEOUT}ms`)
          );
        }, CONNECTION_TIMEOUT + 2000);

        mongoose
          .connect(uri, options)
          .then((mongooseInstance) => {
            clearTimeout(timeoutId);
            setupConnectionMonitoring(mongooseInstance.connection);
            cached.conn = mongooseInstance;
            cached.isConnecting = false;
            cached.connectionTimestamp = new Date();
            console.log("[DB] Connection established successfully");
            resolve(mongooseInstance);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            cached.isConnecting = false;
            cached.reconnectAttempts++;
            cached.lastError = error;
            console.error("[DB] Connection attempt failed:", error);
            reject(error);
          });
      });

      return await cached.promise;
    } catch (error) {
      cached.isConnecting = false;
      console.error("[DB] Failed to establish connection:", error.message);
      throw error;
    }
  } catch (error) {
    console.error("[DB] Connection error:", error);
    throw error;
  }
}

// Other database functions with isomorphic safety checks
export async function disconnectDB() {
  if (typeof window !== "undefined") return;

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      console.log("[DB] Disconnected successfully");
    }
  } catch (error) {
    console.error("[DB] Error disconnecting:", error);
  }
}

export async function checkDBConnection() {
  if (typeof window !== "undefined") {
    return { isConnected: false, status: "browser-environment" };
  }

  try {
    if (mongoose.connection.readyState === 1) {
      return { isConnected: true, status: "connected" };
    }

    try {
      await connectDB(true); // Force new connection
      return { isConnected: true, status: "reconnected" };
    } catch (error) {
      return {
        isConnected: false,
        status: "connection-failed",
        error: error.message,
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      status: "error",
      error: error.message,
    };
  }
}

export function getConnectionStatus() {
  if (typeof window !== "undefined") {
    return {
      hasConnection: false,
      isConnecting: false,
      reconnectAttempts: 0,
      lastError: "Running in browser environment",
      connectionTime: null,
    };
  }

  return {
    hasConnection: mongoose.connection.readyState === 1,
    isConnecting: cached.isConnecting,
    reconnectAttempts: cached.reconnectAttempts,
    lastError: cached.lastError ? cached.lastError.message : null,
    connectionTime: cached.connectionTimestamp,
    readyState: mongoose.connection.readyState,
  };
}
