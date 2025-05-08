import { syncRoleToClerk } from "../../../lib/role-sync";
import { requireAdmin } from "../../../middlewares/authMiddleware";

/**
 * API endpoint to sync user role data from the database to Clerk
 * Only admins can use this endpoint
 */
async function handler(req, res) {
  // Only GET method allowed for simplicity
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  // Get the user ID from query params
  const { userId } = req.query;

  // Ensure userId is provided
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "User ID is required",
    });
  }

  try {
    // Call the sync utility function
    const result = await syncRoleToClerk(userId);

    // Return appropriate response based on result
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.changed
          ? `Role synced from database to Clerk (${result.from} → ${result.to})`
          : "Roles were already in sync",
        ...result,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in sync-to-clerk API:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Wrap with admin middleware to ensure only admins can access
export default requireAdmin(handler);
