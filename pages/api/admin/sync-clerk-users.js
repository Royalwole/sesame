import { requireAdmin } from "../../../middlewares/authMiddleware";
import { syncAllUsersFromClerk } from "../../../lib/clerk-sync";

/**
 * API endpoint to initiate a full sync of user data from Clerk to MongoDB
 * This is an admin-only endpoint that can be used for maintenance or data reconciliation
 *
 * GET /api/admin/sync-clerk-users - Synchronize all users with default settings
 * GET /api/admin/sync-clerk-users?batchSize=200 - Synchronize with custom batch size
 */
async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "Only GET requests are supported",
    });
  }

  try {
    // Get batch size from query params with default of 100
    const batchSize = parseInt(req.query.batchSize) || 100;

    // Validate batch size to prevent abuse
    if (batchSize < 10 || batchSize > 500) {
      return res.status(400).json({
        success: false,
        error: "Invalid batch size",
        message: "Batch size must be between 10 and 500",
      });
    }

    // Perform the sync operation
    console.log(
      `Starting Clerk -> MongoDB user sync with batch size ${batchSize}`
    );
    const results = await syncAllUsersFromClerk(batchSize);

    // Return the results
    return res.status(200).json({
      success: results.success,
      message: `Sync completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    console.error("Error in sync-clerk-users endpoint:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Protect this endpoint - only admins can access it
export default requireAdmin(handler);
