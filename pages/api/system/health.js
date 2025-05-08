import { connectDB, checkDBHealth, disconnectDB } from "../../../lib/db";
import { checkBlobConnection } from "../../../lib/blob";
import { getFirebaseStatus } from "../../../lib/firebase-config";

/**
 * System health check API endpoint
 * Provides comprehensive status of all server and storage components
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    systems: {},
    duration: 0,
  };

  let dbConnection = false;

  try {
    // Check MongoDB connection
    try {
      console.log("[HEALTH] Testing MongoDB connection...");
      const dbStartTime = Date.now();
      await connectDB();
      dbConnection = true;

      const dbHealth = await checkDBHealth();
      const dbResponseTime = Date.now() - dbStartTime;

      results.systems.mongodb = {
        isConnected: dbHealth.ok,
        responseTime: dbResponseTime,
        status: dbHealth.ok ? "healthy" : "unhealthy",
        details: dbHealth.connection,
        error: dbHealth.error || null,
      };
    } catch (dbError) {
      console.error("[HEALTH] MongoDB check failed:", dbError);
      results.systems.mongodb = {
        isConnected: false,
        status: "error",
        error: dbError.message,
        type: dbError.name,
      };
      results.success = false;
    }

    // Check Firebase Storage connection
    try {
      console.log("[HEALTH] Testing Firebase Storage connection...");
      const storageStartTime = Date.now();
      const storageStatus = await checkBlobConnection();
      const storageResponseTime = Date.now() - storageStartTime;

      results.systems.firebaseStorage = {
        isConnected: storageStatus.isConnected,
        status: storageStatus.status,
        responseTime: storageResponseTime,
        message: storageStatus.message,
        error: storageStatus.error || null,
      };

      if (!storageStatus.isConnected) {
        results.success = false;
      }
    } catch (storageError) {
      console.error("[HEALTH] Firebase Storage check failed:", storageError);
      results.systems.firebaseStorage = {
        isConnected: false,
        status: "error",
        error: storageError.message,
      };
      results.success = false;
    }

    // Get Firebase initialization status
    results.systems.firebaseInit = getFirebaseStatus();

    // Calculate overall duration
    results.duration = Date.now() - startTime;

    // Return health check results
    return res.status(results.success ? 200 : 503).json(results);
  } catch (error) {
    console.error("[HEALTH] Unexpected error in health check:", error);
    return res.status(500).json({
      success: false,
      error: "Health check failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    // Always disconnect from database if connected
    if (dbConnection) {
      try {
        await disconnectDB();
      } catch (disconnectError) {
        console.error(
          "[HEALTH] Error disconnecting from database:",
          disconnectError
        );
      }
    }
  }
}
