import { requireAdmin } from "../../../../middlewares/authMiddleware";
import {
  verifyRoleConsistency,
  fixUserRoleInconsistency,
} from "../../../../lib/verify-role-consistency";
import { logger } from "../../../../lib/error-logger";

/**
 * API endpoint for checking and fixing role consistency between Clerk and MongoDB
 *
 * GET /api/admin/roles/consistency - Get consistency report
 * POST /api/admin/roles/consistency - Fix inconsistencies with options
 *
 * Protected - requires admin access
 */
async function handler(req, res) {
  try {
    // GET request - Run consistency check
    if (req.method === "GET") {
      const { limit = 100, autofix = false, direction = "toClerk" } = req.query;

      // Convert query params to proper types
      const options = {
        limit: parseInt(limit, 10) || 100,
        autoFix: autofix === "true",
        fixDirection: ["toClerk", "toDb"].includes(direction)
          ? direction
          : "toClerk",
      };

      logger.info("Starting role consistency check", { options });
      const result = await verifyRoleConsistency(options);

      return res.status(200).json({
        success: true,
        ...result,
      });
    }

    // POST request - Fix a specific user
    else if (req.method === "POST") {
      const { userId, direction = "toClerk" } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "Missing required userId",
        });
      }

      // Validate direction
      if (!["toClerk", "toDb"].includes(direction)) {
        return res.status(400).json({
          success: false,
          error: "Invalid direction. Use 'toClerk' or 'toDb'",
        });
      }

      // Fix the role inconsistency
      const result = await fixUserRoleInconsistency(userId, direction);

      return res.status(result.success ? 200 : 400).json({
        ...result,
      });
    }

    // Other methods not allowed
    else {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }
  } catch (error) {
    logger.error("Error in role consistency API", {
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

// Wrap with admin middleware to ensure only admins can access
export default requireAdmin(handler);
