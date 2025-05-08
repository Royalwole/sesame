import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { ROLES } from "../../../../lib/role-management";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/User";

/**
 * API handler for syncing a user's roles between Clerk and MongoDB
 *
 *
 * POST /api/users/role/sync
 *
 * Required body:
 * - userId: Clerk user ID
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Get the current authenticated user
    const { userId: currentUserId } = getAuth(req);
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Get the current user from Clerk to check permissions
    const currentUser = await clerkClient.users.getUser(currentUserId);

    // Ensure the current user is an admin
    if (!isAdmin(currentUser)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Admin access required",
      });
    }

    // Get request parameters
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required userId field",
      });
    }

    // Get the target user from Clerk
    const targetUser = await clerkClient.users.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Connect to database
    await connectDB();

    // Find the user in MongoDB
    let dbUser = await User.findOne({ clerkId: userId });

    // If user doesn't exist in MongoDB, create a basic record
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: userId,
        email: targetUser.emailAddresses[0]?.emailAddress,
        role: targetUser.publicMetadata?.role || ROLES.USER,
        approved: targetUser.publicMetadata?.approved || false,
      });
    }

    // Sync the roles between Clerk and MongoDB
    const syncResult = await syncUserRoles(targetUser, dbUser);

    return res.status(200).json({
      success: true,
      changed: syncResult.changed,
      from: syncResult.from,
      to: syncResult.to,
    });
  } catch (error) {
    console.error("Error syncing user roles:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync user roles",
    });
  }
}
