import mongoose from "mongoose";
import { loadEnvConfig, getEnv } from "./env-loader";

// Check if running on client or server
const isServer = typeof window === "undefined";

// Only load environment variables on the server side
if (isServer) {
  loadEnvConfig();
}

// Track connection status
let isConnected = false;
let lastConnection = null;
let reconnectAttempts = 0;
let connectionError = null;

// Connection options with better defaults for reliability
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds to select server before timeout
  socketTimeoutMS: 45000, // How long to wait for operations
  connectTimeoutMS: 10000, // Connection timeout
  maxPoolSize: 10, // Maximum pool size
  minPoolSize: 1, // Minimum pool size
  heartbeatFrequencyMS: 10000, // Check server status
  retryWrites: true,
  retryReads: true,
  autoIndex: getEnv("NODE_ENV") !== "production",
};

/**
 * Connect to MongoDB with retry logic
 * @param {boolean} force - Force a new connection even if one exists
 * @returns {Promise<mongoose.Connection>} - Mongoose connection
 */
export async function connectDB(force = false) {
  // Only attempt connection on the server side
  if (!isServer) {
    console.log("⚠️ Database connection can only be established server-side");
    return null;
  }

  if (isConnected && !force) {
    console.log("🔄 Using existing database connection");
    return mongoose.connection;
  }

  // Use getEnv instead of directly accessing process.env
  const uri = getEnv("MONGODB_URI");
  if (!uri) {
    console.error("❌ MONGODB_URI environment variable is not set");
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    console.log("📡 Connecting to MongoDB...");
    const connection = await mongoose.connect(uri, connectionOptions);
    isConnected = true;
    lastConnection = new Date();
    reconnectAttempts = 0;
    connectionError = null;

    // Set up connection event listeners
    setupMongoEventListeners();

    console.log("✅ MongoDB connected successfully");
    return connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    connectionError = error;
    isConnected = false;
    throw error;
  }
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
    connectionError = err;
    isConnected = false;
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
    console.log("✅ MongoDB disconnected successfully");
  } catch (error) {
    console.error("❌ Error disconnecting from MongoDB:", error);
    throw error;
  }
}
