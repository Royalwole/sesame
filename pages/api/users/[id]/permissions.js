import { requireAdmin } from "../../../../middlewares/authMiddleware";
import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../../lib/db";
import User from "../../../../models/User";
import { logger } from "../../../../lib/error-logger";

/**
 * API endpoint to get a user's permissions
 *
 * GET /api/users/[id]/permissions
 *
 * Protected - requires admin access
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  const { id } = req.query; // Changed from userId to id to match route parameter

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Missing user ID",
    });
  }

  let dbConnection = false;

  try {
    await connectDB();
    dbConnection = true;

    // Get user from Clerk
    let user;
    try {
      user = await clerkClient.users.getUser(id); // Changed from userId to id
    } catch (error) {
      logger.error("Error fetching user from Clerk", {
        error: error.message,
        userId: id, // Changed variable but keeping the log field name for consistency
      });
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get metadata from Clerk user
    const { publicMetadata = {} } = user;
    const {
      role,
      permissions = [],
      temporaryPermissions = {},
    } = publicMetadata;

    // Get additional info from database (optional)
    const dbUser = await User.findOne({ clerkId: id }).lean(); // Changed from userId to id

    // Extract temporary permission details
    const temporaryPermissionDetails = Object.entries(temporaryPermissions).map(
      ([permission, details]) => ({
        permission,
        ...details,
        isExpired:
          details.expiresAt && new Date(details.expiresAt) <= new Date(),
      })
    );

    return res.status(200).json({
      success: true,
      userId: id, // Changed variable but keeping the response field name for API compatibility
      email: user.emailAddresses?.[0]?.emailAddress || dbUser?.email,
      firstName: user.firstName || dbUser?.firstName,
      lastName: user.lastName || dbUser?.lastName,
      role,
      permissions,
      temporaryPermissions: temporaryPermissionDetails,
      // Include basic user profile from DB if available
      profile: dbUser
        ? {
            id: dbUser._id,
            createdAt: dbUser.createdAt,
            approved: dbUser.approved,
          }
        : null,
    });
  } catch (error) {
    logger.error("Error retrieving user permissions", {
      userId: id, // Changed from userId to id but keeping the log field name for consistency
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    if (dbConnection) {
      try {
        await disconnectDB();
      } catch (err) {
        logger.error("Error disconnecting from database", {
          error: err.message,
        });
      }
    }
  }
}

// Wrap with admin middleware to ensure only admins can access
export default requireAdmin(handler);
