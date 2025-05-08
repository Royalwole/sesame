/**
 * Role Synchronization Utility
 *
 * This utility ensures consistent role data between Clerk and MongoDB
 * and provides functionality for role changes with proper validation
 */

import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import { connectDB } from "./db";
import User from "../models/User";
import { ROLES, canChangeRole } from "./role-management";

/**
 * Sync a user's role from database to Clerk
 *
 * @param {string} userId - Clerk user ID
 * @returns {Promise<object>} - Result of sync operation
 */
export async function syncRoleToClerk(userId) {
  if (!userId) return { success: false, error: "No user ID provided" };

  try {
    // Connect to database
    await connectDB();

    // Get user from database
    const dbUser = await User.findOne({ clerkId: userId }).lean();
    if (!dbUser) {
      return { success: false, error: "User not found in database" };
    }

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);

    // Extract current metadata
    const currentMetadata = clerkUser.publicMetadata || {};
    const currentRole = currentMetadata.role;

    // If roles match, no need to update
    if (currentRole === dbUser.role) {
      return {
        success: true,
        changed: false,
        message: "Roles already in sync",
      };
    }

    // Update Clerk metadata with database role
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        role: dbUser.role,
        approved: dbUser.approved === true,
      },
    });

    return {
      success: true,
      changed: true,
      from: currentRole,
      to: dbUser.role,
    };
  } catch (error) {
    console.error("Error syncing role to Clerk:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Change a user's role with proper validation and synchronization
 *
 * @param {string} userId - Clerk user ID
 * @param {string} newRole - New role from ROLES object
 * @param {boolean} approved - Whether the user is approved (for agents)
 * @returns {Promise<object>} - Result of role change
 */
export async function changeUserRole(userId, newRole, approved = false) {
  if (!userId || !newRole) {
    return { success: false, error: "User ID and new role are required" };
  }

  // Validate role is one of the defined roles
  if (!Object.values(ROLES).includes(newRole)) {
    return { success: false, error: `Invalid role: ${newRole}` };
  }

  try {
    // Connect to database
    await connectDB();

    // Get current user data
    const dbUser = await User.findOne({ clerkId: userId });
    if (!dbUser) {
      return { success: false, error: "User not found in database" };
    }

    const currentRole = dbUser.role;

    // Validate role transition
    if (!canChangeRole(currentRole, newRole)) {
      return {
        success: false,
        error: `Invalid role transition from ${currentRole} to ${newRole}`,
      };
    }

    // Special handling for agent roles
    let approvedStatus = dbUser.approved;
    if (newRole === ROLES.AGENT) {
      approvedStatus = approved;
    } else if (newRole === ROLES.AGENT_PENDING) {
      approvedStatus = false; // Pending agents are never approved
    }

    // Update database user
    dbUser.role = newRole;
    dbUser.approved = approvedStatus;
    await dbUser.save();

    // Sync to Clerk
    const clerkSync = await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: newRole,
        approved: approvedStatus,
      },
    });

    return {
      success: true,
      userId,
      previousRole: currentRole,
      newRole: newRole,
      approved: approvedStatus,
      clerkSynced: !!clerkSync,
    };
  } catch (error) {
    console.error("Error changing user role:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * API handler for role changes (can be used in API routes)
 *
 * @param {Object} req - Next.js API request
 * @param {Object} res - Next.js API response
 */
export async function handleRoleChange(req, res) {
  try {
    // Only allow POST method
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, error: "Method not allowed" });
    }

    // Get auth data from request
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Check if requesting user is admin
    const adminUser = await User.findOne({ clerkId: auth.userId });
    if (!adminUser || adminUser.role !== ROLES.ADMIN) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // Get request data
    const { userId, role, approved } = req.body;
    if (!userId || !role) {
      return res
        .status(400)
        .json({ success: false, error: "User ID and role are required" });
    }

    // Execute role change
    const result = await changeUserRole(userId, role, approved);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Role change error:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
