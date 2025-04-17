import { systemHealthCheck } from "../../../lib/debug";
import { createApiLogger } from "../../../lib/debug/api";

// Authentication for health API
const AUTH_TOKEN = process.env.HEALTH_CHECK_TOKEN || "debug-token-change-me";

// Apply API logging middleware conditionally
const apiLogger = createApiLogger({
  logBody: false, // Don't log bodies for health checks
  logHeaders: true,
});

export default async function handler(req, res) {
  // Apply API logging
  apiLogger(req, res);

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Protect endpoint in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    // Set cache control headers to prevent caching
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Get detailed health status
    const health = await systemHealthCheck();

    // Determine status code based on health
    const statusCode =
      health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 500;

    return res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}
