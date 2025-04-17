import { getConnectionStatus, checkDBConnection } from "../../lib/db";
import { checkBlobConnection } from "../../lib/blob";

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only GET requests are allowed",
    });
  }

  try {
    // Check database connection
    const dbStatus = await checkDBConnection();

    // Check blob connection
    const blobStatus = await checkBlobConnection();

    // Get detailed connection status
    const connectionStatus = getConnectionStatus();

    // Overall system status
    const systemStatus =
      dbStatus.isConnected && blobStatus.isConnected ? "ok" : "degraded";

    // Calculate uptime (if server-side)
    let uptimeSeconds = 0;
    if (typeof process !== "undefined" && process.uptime) {
      uptimeSeconds = Math.floor(process.uptime());
    }

    // Complete response
    const healthStatus = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      uptime: uptimeSeconds,
      storage: {
        database: {
          connected: dbStatus.isConnected,
          status: dbStatus.status,
          lastConnection: connectionStatus.lastConnection,
          reconnectAttempts: connectionStatus.reconnectAttempts,
          error: connectionStatus.error,
          host: connectionStatus.host,
          database: connectionStatus.database,
        },
        blob: {
          enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
          connected: blobStatus.isConnected,
          status: blobStatus.status,
          message: blobStatus.message,
        },
      },
    };

    // Set cache control headers
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    return res.status(200).json(healthStatus);
  } catch (error) {
    console.error("Health check error:", error);

    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}
