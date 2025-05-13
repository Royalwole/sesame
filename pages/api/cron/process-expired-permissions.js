import { processExpiredPermissions } from "../../../lib/tasks/process-expired-permissions";
import { logger } from "../../../lib/error-logger";

/**
 * Endpoint for scheduled task to process expired permissions
 * This API can be called by a cron job or external scheduler service
 *
 * Protected by an API key for security
 *
 * GET /api/cron/process-expired-permissions
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  // Check for API key in header or query param
  const apiKey = req.headers["x-api-key"] || req.query.key;
  const validApiKey = process.env.CRON_API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    logger.warn("Unauthorized access attempt to cron endpoint", {
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      endpoint: "process-expired-permissions",
    });
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    // Run the processor
    const result = await processExpiredPermissions();

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    logger.error("Error processing expired permissions via API", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Failed to process expired permissions",
      message: error.message,
    });
  }
}
