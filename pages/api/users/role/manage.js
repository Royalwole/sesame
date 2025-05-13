import { requireAdmin } from "../../../../middlewares/authMiddleware";
import { updateUserRole } from "../../../../lib/clerk-role-management";
import { ROLES } from "../../../../lib/role-management";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * API Endpoint for role management
 * Uses Clerk as source of truth and ensures consistency
 *
 * POST /api/users/role/manage
 *
 * Request Body:
 * - userId: Clerk user ID
 * - role: New role to assign
 * - approved: (Optional) Approval status for agents
 * - reason: (Optional) Reason for the change
 *
 * Returns:
 * - success: Boolean indicating success
 * - message: Description of the action taken
 * - changes: Details of what changed
 */
async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "Only POST requests are allowed for this endpoint",
    });
  }

  try {
    // Extract parameters from request body
    const {
      userId,
      role,
      approved = undefined,
      reason = "Admin role change",
    } = req.body;

    // Validate required parameters
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "User ID and role are required",
      });
    }

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
        message: `Role must be one of: ${Object.values(ROLES).join(", ")}`,
      });
    }

    // Get the current user to compare changes
    let currentUser;
    try {
      currentUser = await clerkClient.users.getUser(userId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "The specified Clerk user was not found",
      });
    }

    // Get current metadata
    const metadata = currentUser.publicMetadata || {};
    const previousRole = metadata.role || ROLES.USER;
    const previousApproved = metadata.approved === true;

    // Determine approval status based on role
    let approvalStatus = approved;
    if (role === ROLES.AGENT_PENDING) {
      // Pending agents are always unapproved
      approvalStatus = false;
    } else if (
      role === ROLES.USER ||
      role === ROLES.ADMIN ||
      role === ROLES.SUPER_ADMIN
    ) {
      // These roles are always "approved" (field is irrelevant)
      approvalStatus = true;
    }

    // Update the role in Clerk (with retries and database sync)
    const result = await updateUserRole(userId, role, approvalStatus);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: "Role update failed",
        message: result.error || "Could not update user role",
      });
    }

    // Check what changed
    const roleChanged = previousRole !== role;
    const approvalChanged = previousApproved !== approvalStatus;
    const somethingChanged = roleChanged || approvalChanged;

    // Log the role change for auditing
    if (somethingChanged) {
      console.log(
        `[ROLE CHANGE] User ${userId}: ${previousRole}${previousApproved ? "(approved)" : ""} -> ${role}${approvalStatus ? "(approved)" : ""}. Reason: ${reason}`
      );
    }

    return res.status(200).json({
      success: true,
      message: somethingChanged
        ? `User role updated from ${previousRole} to ${role}`
        : "No changes were needed",
      changes: {
        roleChanged,
        approvalChanged,
        previousRole,
        newRole: role,
        previousApproved,
        newApproved: approvalStatus,
      },
    });
  } catch (error) {
    console.error("Role management error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Protect this endpoint - only admins can access
export default requireAdmin(handler);
