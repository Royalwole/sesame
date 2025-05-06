import { connectDB, checkDBHealth, getConnectionStatus } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Force a new connection attempt
    await connectDB(true);

    // Check database health
    const healthStatus = await checkDBHealth();
    const connectionStatus = getConnectionStatus();

    return res.status(200).json({
      ok: healthStatus.ok,
      timestamp: new Date().toISOString(),
      connection: connectionStatus,
      health: healthStatus,
    });
  } catch (error) {
    console.error("MongoDB Health Check Error:", error);
    return res.status(503).json({
      ok: false,
      error: error.message,
      type: error.name,
      timestamp: new Date().toISOString(),
    });
  }
}
