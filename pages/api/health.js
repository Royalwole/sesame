import { connectDB, disconnectDB } from "../../lib/db";
import { withJsonResponse } from "../../lib/api/middleware";

async function handler(req, res) {
  // Return the status of each system component
  const status = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    components: {
      api: { status: "online" },
      database: { status: "unknown", responseTime: null },
    },
  };

  // Check database connection
  const dbStart = Date.now();
  try {
    await connectDB();
    const dbResponseTime = Date.now() - dbStart;

    status.components.database = {
      status: "online",
      responseTime: `${dbResponseTime}ms`,
    };
  } catch (error) {
    status.success = false;
    status.components.database = {
      status: "offline",
      error: error.message,
      responseTime: `${Date.now() - dbStart}ms`,
    };
  } finally {
    try {
      await disconnectDB();
    } catch (e) {
      // Ignore disconnect errors
    }
  }

  // Set appropriate status code
  const statusCode = status.success ? 200 : 503;
  return res.status(statusCode).json(status);
}

export default withJsonResponse(handler);
