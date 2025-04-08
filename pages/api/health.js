import { checkDBConnection, getConnectionStatus } from "../../lib/db";
import { checkBlobConnection, isBlobConfigured } from "../../lib/blob";

/**
 * API Health Check endpoint
 * Returns detailed information about system health including database connectivity
 */
export default async function handler(req, res) {
  // Set appropriate cache headers for health check
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    // Check MongoDB connection health
    const dbStatus = await checkDBConnection();
    const connectionDetails = getConnectionStatus();

    // Check Vercel Blob storage health
    const blobStatus = await checkBlobConnection();

    console.log("[HEALTH] DB Status:", dbStatus, "Blob Status:", blobStatus);

    // Return health status
    return res.status(200).json({
      status: dbStatus.isConnected ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.NEXT_PUBLIC_VERSION || "1.0.0",
      storage: {
        database: {
          connected: dbStatus.isConnected,
          status: dbStatus.status,
          lastConnection: connectionDetails.connectionTime,
          reconnectAttempts: connectionDetails.reconnectAttempts,
        },
        blob: {
          enabled: isBlobConfigured(),
          connected: blobStatus.isConnected,
          status: blobStatus.status,
          message: blobStatus.message,
        },
      },
    });
  } catch (error) {
    console.error("[HEALTH] Health check failed:", error);

    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: "Health check failed",
      error: error.message,
    });
  }
}
