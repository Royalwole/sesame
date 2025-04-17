import { connectDB, disconnectDB, getConnectionStatus } from "../../../lib/db";

/**
 * API endpoint to force a database reconnection
 * Useful for debugging and recovery after connection issues
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "This endpoint only accepts POST requests",
    });
  }

  // For security, restrict access in production
  if (process.env.NODE_ENV === "production") {
    const authToken = req.headers.authorization?.split(" ")[1];

    // Verify access token
    if (!authToken || authToken !== process.env.DB_ADMIN_TOKEN) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication required",
      });
    }
  }

  try {
    // Get current status
    const beforeStatus = getConnectionStatus();

    // Force disconnect if currently connected
    if (beforeStatus.isConnected) {
      await disconnectDB();
    }

    // Attempt reconnection
    await connectDB(true); // Force new connection

    // Get new status after reconnection
    const afterStatus = getConnectionStatus();

    // Return status
    return res.status(200).json({
      success: true,
      message: "Database reconnection attempt complete",
      result: {
        isConnected: afterStatus.isConnected,
        reconnected: !beforeStatus.isConnected && afterStatus.isConnected,
        previousState: beforeStatus.isConnected ? "connected" : "disconnected",
        currentState: afterStatus.isConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
      },
      details: afterStatus,
    });
  } catch (error) {
    console.error("Database reconnection failed:", error);

    // Return detailed error info
    return res.status(500).json({
      success: false,
      error: "Reconnection failed",
      message: error.message,
      errorType: error.name,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
    });
  }
}
