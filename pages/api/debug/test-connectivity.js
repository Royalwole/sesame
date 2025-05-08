import { connectDB, disconnectDB, checkDBHealth } from "../../../lib/db";
import { checkBlobConnection, isBlobConfigured } from "../../../lib/blob";
import { getFirebaseStatus } from "../../../lib/firebase-config";

/**
 * API endpoint for testing connectivity with various storage systems
 * Useful for verifying server, backend, and storage communication
 */
export default async function handler(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not available in production" });
  }

  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    status: {},
  };

  let dbConnection = false;

  try {
    // Test MongoDB connection
    try {
      console.log("[TEST] Connecting to MongoDB...");
      await connectDB();
      dbConnection = true;

      const dbHealth = await checkDBHealth();

      results.status.mongodb = {
        connected: dbHealth.ok,
        message: dbHealth.ok ? "Connected successfully" : "Connection failed",
        connectionDetails: {
          host: dbHealth.connection?.host,
          database: dbHealth.connection?.database,
          readyState: dbHealth.connection?.readyState,
        },
        error: dbHealth.error || null,
      };
    } catch (dbError) {
      console.error("[TEST] MongoDB connection error:", dbError);
      results.status.mongodb = {
        connected: false,
        error: dbError.message,
        errorType: dbError.name,
      };
    }

    // Test Firebase configuration
    const firebaseStatus = getFirebaseStatus();
    results.status.firebase = {
      initialized: firebaseStatus.isInitialized,
      error: firebaseStatus.error,
      config: firebaseStatus.config,
    };

    // Test Firebase Storage connectivity
    try {
      console.log("[TEST] Testing Firebase Storage connectivity...");
      const blobStatus = await checkBlobConnection();

      results.status.firebaseStorage = {
        connected: blobStatus.isConnected,
        status: blobStatus.status,
        message: blobStatus.message,
        error: blobStatus.error || null,
      };
    } catch (storageError) {
      console.error("[TEST] Firebase Storage error:", storageError);
      results.status.firebaseStorage = {
        connected: false,
        error: storageError.message,
      };
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("[TEST] Unexpected error:", error);
    return res.status(500).json({
      error: "Test failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    // Always disconnect from MongoDB if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log("[TEST] MongoDB disconnected");
      } catch (error) {
        console.error("[TEST] Error disconnecting from MongoDB:", error);
      }
    }
  }
}
