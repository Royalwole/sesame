import { requireAdmin } from "../../../middlewares/authMiddleware";
import { syncUserFromClerk } from "../../../lib/clerk-sync";
import User from "../../../models/User";

/**
 * API endpoint to synchronize a single user from Clerk to MongoDB
 * This is an admin-only endpoint for targeted user data synchronization
 *
 * POST /api/admin/sync-clerk-user
 * Request body: { userId: "clerk_user_id" }
 */
async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "Only POST requests are supported",
    });
  }

  try {
    // Get the user ID from request body
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing parameter",
        message: "User ID is required",
      });
    }

    // Perform the sync operation
    console.log(`Syncing user ${userId} from Clerk to MongoDB`);
    const result = await syncUserFromClerk(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to sync user",
        message: `Error syncing user ${userId}`,
      });
    }

    // Fetch the final user to return
    const user = await User.findOne({ clerkId: userId }).lean();

    // Return the results
    return res.status(200).json({
      success: true,
      message: result.message || `User ${userId} synchronized successfully`,
      isNewUser: result.isNewUser,
      user: user,
    });
  } catch (error) {
    console.error("Error in sync-clerk-user endpoint:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Protect this endpoint - only admins can access it
export default requireAdmin(handler);
