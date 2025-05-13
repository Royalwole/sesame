import { processExpiredPermissions } from "../../../lib/tasks/process-expired-permissions";
import { logger } from "../../../lib/error-logger";

/**
 * API Route to process expired permissions
 *
 * This endpoint runs the permission expiration processor and can be called
 * by a scheduled task using a webhook or cron job service.
 *
 * The endpoint is protected by an API key to prevent unauthorized access.
 */
export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Validate API key for security
    const apiKey = req.headers["x-api-key"];
    const validApiKey = process.env.SCHEDULED_TASKS_API_KEY;

    if (!apiKey || apiKey !== validApiKey) {
      logger.warn("Unauthorized attempt to process expired permissions", {
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      });

      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Process expired permissions
    logger.info("Processing expired permissions via API");
    const results = await processExpiredPermissions();

    // Return results
    return res.status(200).json({
      success: true,
      message: "Successfully processed expired permissions",
      stats: {
        processed: results.processed,
        expiredFound: results.expiredFound,
        updated: results.updated,
        errors: results.errors,
      },
      timestamp: results.timestamp,
    });
  } catch (error) {
    logger.error("Error processing expired permissions via API", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}
