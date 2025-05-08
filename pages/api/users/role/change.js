import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { isAdmin, isValidRole, ROLES } from "../../../../lib/role-management";
import { connectDB } from "../../../../lib/db";
import User from "../../../../lib/models/User";

/**
 * API handler for changing a user's role
 *
 * POST /api/users/role/change
 *
 * Required body:
 * - userId: Clerk user ID
 * - newRole: The new role to assign
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
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields (userId and newRole)",
      });
    }

    // Validate the new role
    if (!isValidRole(newRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Valid roles are: ${Object.values(ROLES).join(", ")}`,
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

    // Super admins are protected
    if (
      targetUser.publicMetadata?.role === ROLES.SUPER_ADMIN &&
      newRole !== ROLES.SUPER_ADMIN
    ) {
      return res.status(403).json({
        success: false,
        error: "Cannot modify super admin role",
      });
    }

    // Update the role in Clerk
    const oldRole = targetUser.publicMetadata?.role || ROLES.USER;
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role: newRole,
      },
    });

    // Connect to database
    await connectDB();

    // Update the user in MongoDB
    await User.findOneAndUpdate(
      { clerkId: userId },
      { role: newRole },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      userId,
      oldRole,
      newRole,
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to change user role",
    });
  }
}
