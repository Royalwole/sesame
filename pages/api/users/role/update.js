// filepath: c:\Users\HomePC\Desktop\topdial\pages\api\users\role\update.js
import { requireAdmin } from "../../../../middlewares/authMiddleware";
import { connectDB, disconnectDB } from "../../../../lib/db";
import User from "../../../../models/User";
import { ROLES, canChangeRole } from "../../../../lib/role-management";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * API endpoint for managing user roles
 *
 * This endpoint allows administrators to:
 * 1. Update a user's role (user, agent, admin)
 * 2. Set approval status for agents
 * 3. Synchronize role data between Clerk and MongoDB
 *
 * POST /api/users/role/update
 *
 * Required body:
 * - userId: Clerk user ID
 * - role: New role to assign (from ROLES object)
 * - approved: Boolean indicating approval status (for agents)
 * - reason: Optional reason for the role change (for audit logs)
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

  // Get request body parameters
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
      error: "Missing required parameters",
      message: "userId and role parameters are required",
    });
  }

  // Validate role value
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      success: false,
      error: "Invalid role",
      message: `Role must be one of: ${Object.values(ROLES).join(", ")}`,
    });
  }

  // Get database connection
  let dbConnection = false;

  try {
    await connectDB();
    dbConnection = true;

    // Find user in database
    const dbUser = await User.findOne({ clerkId: userId });
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "The specified user was not found in the database",
      });
    }

    // Store current role for comparison and response
    const previousRole = dbUser.role;
    const previousApproved = dbUser.approved;

    // Check if the role transition is allowed
    if (!canChangeRole(previousRole, role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role transition",
        message: `Cannot change role from ${previousRole} to ${role}`,
      });
    }

    // Determine approval status (different logic based on role)
    let newApproved = previousApproved;

    if (role === ROLES.AGENT) {
      // For agents, use the provided approved value or default to false (pending)
      newApproved = approved === true;
    } else if (role === ROLES.AGENT_PENDING) {
      // Pending agents are always unapproved
      newApproved = false;
    } else if (role === ROLES.USER || role === ROLES.ADMIN) {
      // Regular users and admins are always "approved" (field is irrelevant)
      newApproved = true;
    }

    // Update user in database
    dbUser.role = role;
    dbUser.approved = newApproved;
    await dbUser.save();

    // Sync with Clerk's public metadata
    const clerkUpdateResult = await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: role,
        approved: newApproved,
      },
    });

    // Check if anything changed
    const roleChanged = previousRole !== role;
    const approvalChanged = previousApproved !== newApproved;
    const somethingChanged = roleChanged || approvalChanged;

    // Log the role change for auditing
    if (somethingChanged) {
      console.log(
        `[ROLE CHANGE] User ${userId}: ${previousRole}${previousApproved ? "(approved)" : ""} -> ${role}${newApproved ? "(approved)" : ""}. Reason: ${reason}`
      );
    }

    // Return appropriate response
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
        newApproved,
      },
      user: {
        id: dbUser._id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        approved: dbUser.approved,
      },
    });
  } catch (error) {
    console.error("Role update error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: `An unexpected error occurred: ${error.message}`,
    });
  } finally {
    // Close database connection if it was opened
    if (dbConnection) {
      await disconnectDB();
    }
  }
}

// Wrap with admin middleware to ensure only admins can access
export default requireAdmin(handler);
