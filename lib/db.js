import mongoose from "mongoose";
import { loadEnvConfig, getEnv } from "./env-loader";
import { logError } from "./error-logger";

// Check if running on client or server
const isServer = typeof window === "undefined";

// Only load environment variables on the server side
if (isServer) {
  loadEnvConfig();
}

// Track connection status and metrics
let isConnected = false;
let lastConnection = null;
let reconnectAttempts = 0;
let connectionError = null;
let connectionPromise = null;

// Enhanced connection options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000, // Increased from 10s to 15s
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000, // Increased from 10s to 15s
  maxPoolSize: 50, // Increased from 10 to handle more concurrent connections
  minPoolSize: 5, // Increased minimum pool size
  maxIdleTimeMS: 60000, // Close idle connections after 1 minute
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: "majority",
  // Add these options to help with IP whitelist issues
  directConnection: false,
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
};

/**
 * Connect to MongoDB with enhanced retry logic
 */
export async function connectDB(force = false) {
  if (!isServer) {
    console.log("⚠️ Database connection attempted client-side");
    return null;
  }

  if (isConnected && !force && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise && !force) {
    return connectionPromise;
  }

  const uri = getEnv("MONGODB_URI");
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const maxRetries = 5;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
        console.log(
          `🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      connectionPromise = mongoose.connect(uri, connectionOptions);
      await connectionPromise;

      isConnected = true;
      console.log("✅ MongoDB connected successfully");

      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
        isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
        isConnected = false;
      });

      return mongoose.connection;
    } catch (error) {
      lastError = error;
      console.error(
        `❌ Connection attempt ${attempt + 1} failed:`,
        error.message
      );
      isConnected = false;
    }
  }

  console.error("❌ All connection attempts failed");
  throw lastError;
}

/**
 * Connect with retry logic using exponential backoff
 */
async function connectWithRetry(uri, retryCount = 0) {
  try {
    // Reset connection error
    connectionError = null;

    // Track reconnection attempt
    reconnectAttempts = retryCount;

    console.log(
      `📡 Connecting to MongoDB... (attempt ${reconnectAttempts + 1})`
    );

    // Connect to MongoDB
    await mongoose.connect(uri, connectionOptions);

    // Update connection state
    isConnected = true;
    lastConnection = new Date();
    reconnectAttempts = 0;

    console.log("✅ MongoDB connected successfully");

    // Set up connection event listeners for better monitoring
    setupMongoEventListeners();

    return mongoose.connection;
  } catch (error) {
    connectionError = error;
    isConnected = false;

    console.error(
      `❌ MongoDB connection failed (attempt ${retryCount + 1}):`,
      error.message
    );

    // Maximum retry attempts (3 times with exponential backoff)
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);

      console.log(`🔄 Retrying in ${delay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectWithRetry(uri, retryCount + 1);
    }

    console.error(
      `❌ Maximum retry attempts (${maxRetries}) reached. MongoDB connection failed.`
    );
    throw error;
  }
}

/**
 * Set up event listeners for the MongoDB connection
 */
function setupMongoEventListeners() {
  // Remove existing listeners if any
  mongoose.connection.removeAllListeners("disconnected");
  mongoose.connection.removeAllListeners("error");
  mongoose.connection.removeAllListeners("connected");

  // Listen for disconnection events
  mongoose.connection.on("disconnected", () => {
    console.log("❗ MongoDB disconnected");
    isConnected = false;
  });

  mongoose.connection.on("error", (err) => {
    console.error("❗ MongoDB connection error:", err);
    logError("MongoDB Connection Error", err);
    isConnected = false;
    connectionError = err;
  });

  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
    isConnected = true;
    lastConnection = new Date();
  });
}

/**
 * Get current database connection status
 */
export function getConnectionStatus() {
  return {
    isConnected,
    lastConnection,
    reconnectAttempts,
    error: connectionError ? connectionError.message : null,
    readyState: mongoose.connection ? mongoose.connection.readyState : 0,
    host: mongoose.connection?.host || null,
    database: mongoose.connection?.name || null,
  };
}

/**
 * Check database connection status and attempt reconnection if needed
 * @returns {Promise<Object>} - Connection status object
 */
export async function checkDBConnection() {
  // If not connected at all, try to connect
  if (
    !isConnected ||
    !mongoose.connection ||
    mongoose.connection.readyState !== 1
  ) {
    try {
      await connectDB(true); // Force a new connection
      return {
        isConnected: true,
        status: "connected",
        message: "Connection established successfully",
      };
    } catch (error) {
      return {
        isConnected: false,
        status: "error",
        error: error.message,
        type: error.name,
      };
    }
  }

  // If connected, test with a ping
  try {
    const pingResult = await mongoose.connection.db.admin().ping();
    return {
      isConnected: pingResult.ok === 1,
      status: "connected",
      message: "Database is responsive",
    };
  } catch (error) {
    return {
      isConnected: false,
      status: "error",
      error: error.message,
    };
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  if (!mongoose.connection) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    connectionPromise = null;
    console.log("✅ MongoDB disconnected successfully");
  } catch (error) {
    console.error("❌ Error disconnecting from MongoDB:", error);
    logError("MongoDB Disconnect Error", error);
    throw error;
  }
}

/**
 * Check database health with ping
 */
export async function checkDBHealth() {
  if (!isConnected || !mongoose.connection) {
    return { ok: false, error: "Not connected" };
  }

  try {
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    return {
      ok: result.ok === 1,
      responseTime: result.operationTime,
      connection: getConnectionStatus(),
    };
  } catch (error) {
    logError("MongoDB Health Check Failed", error);
    return {
      ok: false,
      error: error.message,
      connection: getConnectionStatus(),
    };
  }
}
