import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { requireAdmin } from "../../../middlewares/authMiddleware";

/**
 * API endpoint to sync user role data from Clerk to the database
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

  let dbConnection = false;

  try {
    // Connect to database
    await connectDB();
    dbConnection = true;

    // Fetch user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
      return res.status(404).json({
        success: false,
        error: "User not found in Clerk",
      });
    }

    // Extract role information from Clerk metadata
    const clerkRole = clerkUser.publicMetadata.role;
    const clerkApproved = clerkUser.publicMetadata.approved === true;

    if (!clerkRole) {
      return res.status(400).json({
        success: false,
        error: "User has no role defined in Clerk",
      });
    }

    // Find user in database
    const dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: "User not found in database",
      });
    }

    // Check if roles already match
    if (dbUser.role === clerkRole && dbUser.approved === clerkApproved) {
      return res.status(200).json({
        success: true,
        changed: false,
        message: "Roles already match, no changes needed",
      });
    }

    // Store current role for response
    const previousRole = dbUser.role;
    const previousApproved = dbUser.approved;

    // Update database with Clerk data
    dbUser.role = clerkRole;
    dbUser.approved = clerkApproved;
    await dbUser.save();

    return res.status(200).json({
      success: true,
      changed: true,
      previousRole,
      newRole: clerkRole,
      previousApproved,
      newApproved: clerkApproved,
      message: `Role synced from Clerk to database (${previousRole} → ${clerkRole})`,
    });
  } catch (error) {
    console.error("Error in sync-from-clerk API:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    // Always close DB connection
    if (dbConnection) {
      await disconnectDB();
    }
  }
}

// Wrap with admin middleware to ensure only admins can access
export default requireAdmin(handler);
