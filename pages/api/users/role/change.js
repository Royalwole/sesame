import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { isAdmin, ROLES } from "../../../../lib/role-management";
import { connectDB } from "../../../../lib/db";
import User from "../../../../models/User";

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
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Get the current authenticated user
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Connect to database
    await connectDB();

    // Check if the current user is an admin
    const adminUser = await User.findOne({ clerkId: auth.userId });
    if (!adminUser || !isAdmin(adminUser)) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    // Extract parameters from request
    const { userId, newRole } = req.body;

    // Validate required parameters
    if (!userId || !newRole) {
      return res.status(400).json({
        success: false,
        error: "User ID and new role are required",
      });
    }

    // Validate role is one of the defined roles
    if (!Object.values(ROLES).includes(newRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role: ${newRole}`,
      });
    }

    // Find the target user
    const targetUser = await User.findOne({ clerkId: userId });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Store current role for response
    const previousRole = targetUser.role;

    // Update user role in database
    targetUser.role = newRole;
    await targetUser.save();

    // Update role in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: newRole,
      },
    });

    // Return success response
    return res.status(200).json({
      success: true,
      previousRole,
      newRole,
      userId,
      message: `User role updated from ${previousRole} to ${newRole}`,
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}
