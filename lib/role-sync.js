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
import { logger } from "./error-logger";
import { clearUserPermissionCache } from "./permissions-manager";

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

    // Log the sync operation
    logger.info(`Syncing user role to Clerk`, {
      userId,
      fromRole: currentRole || "undefined",
      toRole: dbUser.role,
      operation: "syncRoleToClerk",
    });

    // Update Clerk metadata with database role
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        role: dbUser.role,
        approved: dbUser.approved === true,
        lastUpdated: new Date().toISOString(),
        syncSource: "database",
      },
    });

    // Clear the user's permission cache since their role has changed
    clearUserPermissionCache(userId);

    return {
      success: true,
      changed: true,
      from: currentRole,
      to: dbUser.role,
    };
  } catch (error) {
    logger.error("Error syncing role to Clerk:", {
      userId,
      error: error.message,
      stack: error.stack,
    });

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
 * @param {Object} options - Additional options
 * @param {Object} options.adminUser - The user making the change
 * @param {string} options.reason - Reason for the change
 * @returns {Promise<object>} - Result of role change
 */
export async function changeUserRole(
  userId,
  newRole,
  approved = false,
  options = {}
) {
  const { adminUser, reason = "Manual role change" } = options;

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

    // Validate role transition with enhanced system
    const transitionCheck = canChangeRole(currentRole, newRole, {
      adminUser,
      logRejection: true,
    });

    if (!transitionCheck.allowed) {
      logger.warn(`Role transition rejected`, {
        userId,
        currentRole,
        newRole,
        reason: transitionCheck.reason,
        adminId: adminUser?.clerkId || "unknown",
      });

      return {
        success: false,
        error: `Invalid role transition from ${currentRole} to ${newRole}`,
        reason: transitionCheck.reason,
        requiredRole: transitionCheck.requiredRole,
      };
    }

    // Special handling for agent roles
    let approvedStatus = dbUser.approved;
    if (newRole === ROLES.AGENT) {
      approvedStatus = approved;
    } else if (newRole === ROLES.AGENT_PENDING) {
      approvedStatus = false; // Pending agents are never approved
    } else if (newRole !== ROLES.AGENT && !approvedStatus) {
      // Non-agents are always "approved"
      approvedStatus = true;
    }

    // Log the change
    logger.info(`User role change`, {
      userId,
      currentRole,
      newRole,
      currentApproved: dbUser.approved,
      newApproved: approvedStatus,
      changedBy: adminUser?.clerkId || "system",
      reason,
    });

    // Update database user
    dbUser.role = newRole;
    dbUser.approved = approvedStatus;
    dbUser.updatedAt = new Date();
    dbUser.lastRoleChange = {
      previousRole: currentRole,
      newRole: newRole,
      timestamp: new Date(),
      changedBy: adminUser?.clerkId || "system",
      reason,
    };

    await dbUser.save();

    // Sync to Clerk
    const clerkSync = await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: newRole,
        approved: approvedStatus,
        lastRoleChange: {
          previousRole: currentRole,
          timestamp: new Date().toISOString(),
          reason,
        },
      },
    });

    // Clear the user's permission cache since role has changed
    clearUserPermissionCache(userId);

    // Audit the role change
    await auditRoleChange(
      userId,
      currentRole,
      newRole,
      adminUser?.clerkId || "system",
      reason
    );

    return {
      success: true,
      userId,
      previousRole: currentRole,
      newRole: newRole,
      approved: approvedStatus,
      clerkSynced: !!clerkSync,
    };
  } catch (error) {
    logger.error("Error changing user role:", {
      userId,
      newRole,
      error: error.message,
      stack: error.stack,
    });

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
    if (
      !adminUser ||
      (adminUser.role !== ROLES.ADMIN && adminUser.role !== ROLES.SUPER_ADMIN)
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Admin access required" });
    }

    // Get request data
    const { userId, role, approved, reason } = req.body;
    if (!userId || !role) {
      return res
        .status(400)
        .json({ success: false, error: "User ID and role are required" });
    }

    // Execute role change
    const result = await changeUserRole(userId, role, approved, {
      adminUser,
      reason,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Role change API error:", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });

    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

/**
 * Promote a user to a pending agent role
 *
 * @param {string} userId - Clerk user ID
 * @param {Object} options - Additional options
 * @returns {Promise<object>} - Result of role change
 */
export async function promoteToAgentPending(userId, options = {}) {
  return changeUserRole(userId, ROLES.AGENT_PENDING, false, {
    ...options,
    reason: options.reason || "Promoted to pending agent",
  });
}

/**
 * Approve a pending agent
 *
 * @param {string} userId - Clerk user ID
 * @param {Object} options - Additional options
 * @returns {Promise<object>} - Result of role change
 */
export async function approveAgent(userId, options = {}) {
  return changeUserRole(userId, ROLES.AGENT, true, {
    ...options,
    reason: options.reason || "Agent application approved",
  });
}

/**
 * Reject an agent application
 *
 * @param {string} userId - Clerk user ID
 * @param {Object} options - Additional options
 * @returns {Promise<object>} - Result of role change
 */
export async function rejectAgent(userId, options = {}) {
  return changeUserRole(userId, ROLES.USER, false, {
    ...options,
    reason: options.reason || "Agent application rejected",
  });
}

/**
 * Promote a user to admin role
 *
 * @param {string} userId - Clerk user ID
 * @param {Object} options - Additional options
 * @returns {Promise<object>} - Result of role change
 */
export async function promoteToAdmin(userId, options = {}) {
  return changeUserRole(userId, ROLES.ADMIN, true, {
    ...options,
    reason: options.reason || "Promoted to administrator",
  });
}

/**
 * Demote a user to regular user role
 *
 * @param {string} userId - Clerk user ID
 * @param {Object} options - Additional options
 * @returns {Promise<object>} - Result of role change
 */
export async function demoteToUser(userId, options = {}) {
  return changeUserRole(userId, ROLES.USER, false, {
    ...options,
    reason: options.reason || "Demoted to regular user",
  });
}

/**
 * Audit a role change for tracking and compliance
 *
 * @param {string} userId - Clerk user ID of the target user
 * @param {string} oldRole - Previous role
 * @param {string} newRole - New role
 * @param {string} adminId - Clerk user ID of the admin who made the change
 * @param {string} reason - Reason for the role change
 * @returns {Promise<object>} - Audit record
 */
export async function auditRoleChange(
  userId,
  oldRole,
  newRole,
  adminId,
  reason
) {
  try {
    // Log the change
    logger.info(`Role change audit`, {
      userId,
      oldRole,
      newRole,
      adminId,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Here you would typically write to a database audit log table
    // For a comprehensive solution, implement a RoleChangeAudit model
    // For now, we just log it and return success

    return {
      success: true,
      timestamp: new Date().toISOString(),
      userId,
      oldRole,
      newRole,
      adminId,
      reason,
    };
  } catch (error) {
    logger.error("Role change audit error:", {
      error: error.message,
      userId,
      oldRole,
      newRole,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}
