import { requireAdmin } from "../../../middlewares/authMiddleware";
import {
  synchronizeUserRole,
  promoteToAgentPending,
  approveAgent,
  rejectAgent,
  promoteToAdmin,
  demoteToUser,
  auditRoleChange,
} from "../../../lib/role-sync";
import { ROLES, canChangeRole } from "../../../lib/role-management";
import User from "../../../models/User";

/**
 * Role Management API
 * Handles all user role changes by administrators
 */
async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Extract request data
    const { action, userId, reason } = req.body;

    // Validate required fields
    if (!action || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Get the target user
    const targetUser = await User.findOne({ clerkId: userId }).lean();
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get the admin user making the change
    const adminUser = req.user;

    // Execute the requested action
    let result;
    let oldRole = targetUser.role;
    let newRole;

    switch (action) {
      case "promote_to_agent_pending":
        newRole = ROLES.AGENT_PENDING;
        if (!canChangeRole(oldRole, newRole)) {
          return res.status(400).json({
            success: false,
            error: `Cannot change role from ${oldRole} to ${newRole}`,
          });
        }
        result = await promoteToAgentPending(userId);
        break;

      case "approve_agent":
        newRole = ROLES.AGENT;
        if (oldRole !== ROLES.AGENT_PENDING) {
          return res.status(400).json({
            success: false,
            error: "Only pending agents can be approved",
          });
        }
        result = await approveAgent(userId);
        break;

      case "reject_agent":
        newRole = ROLES.USER;
        if (oldRole !== ROLES.AGENT_PENDING) {
          return res.status(400).json({
            success: false,
            error: "Only pending agents can be rejected",
          });
        }
        result = await rejectAgent(userId);
        break;

      case "promote_to_admin":
        newRole = ROLES.ADMIN;
        if (!canChangeRole(oldRole, newRole)) {
          return res.status(400).json({
            success: false,
            error: `Cannot change role from ${oldRole} to ${newRole}`,
          });
        }
        result = await promoteToAdmin(userId);
        break;

      case "demote_to_user":
        newRole = ROLES.USER;
        if (!canChangeRole(oldRole, newRole)) {
          return res.status(400).json({
            success: false,
            error: `Cannot change role from ${oldRole} to ${newRole}`,
          });
        }
        result = await demoteToUser(userId);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to change user role",
      });
    }

    // Audit the role change
    await auditRoleChange(
      userId,
      oldRole,
      newRole,
      adminUser.clerkId,
      reason || "No reason provided"
    );

    return res.status(200).json({
      success: true,
      message: `User role updated successfully to ${newRole}`,
      user: result.user,
    });
  } catch (error) {
    console.error("Role management API error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Wrap the handler with admin middleware
export default requireAdmin(handler);
