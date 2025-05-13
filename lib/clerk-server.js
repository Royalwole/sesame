/**
 * Clerk Server-Side Management Functions
 *
 * IMPORTANT: This file should ONLY be imported in server-side code (API routes, getServerSideProps, etc.)
 * DO NOT import this file in client components or pages directly!
 */

import { clerkClient } from "@clerk/nextjs/server";
import { ROLES } from "./role-management";
import User from "../models/User";
import { connectDB } from "./db";

/**
 * Updates a user's role in Clerk with retry mechanism
 * @param {String} userId - Clerk user ID
 * @param {String} role - New role to assign
 * @param {Boolean} approved - Approval status (for agents)
 * @param {Number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} - Result of the operation
 */
export async function updateUserRole(
  userId,
  role,
  approved = false,
  maxRetries = 3
) {
  if (!userId || !role) {
    return { success: false, error: "User ID and role are required" };
  }

  // Validate the role
  if (!Object.values(ROLES).includes(role)) {
    return { success: false, error: `Invalid role: ${role}` };
  }

  // Special handling for approval status based on role
  let approvalStatus = approved;
  if (role === ROLES.AGENT_PENDING) {
    approvalStatus = false; // Pending agents are never approved
  } else if (
    role === ROLES.USER ||
    role === ROLES.ADMIN ||
    role === ROLES.SUPER_ADMIN
  ) {
    approvalStatus = true; // These roles are always "approved"
  }

  let attempts = 0;
  let lastError = null;

  while (attempts < maxRetries) {
    try {
      // Get current user to compare metadata
      const currentUser = await clerkClient.users.getUser(userId);
      const currentMetadata = currentUser.publicMetadata || {};

      // Update the user's public metadata with the new role
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...currentMetadata,
          role,
          approved: approvalStatus,
          lastUpdated: new Date().toISOString(),
        },
      });

      // After successful update, sync to database
      await syncRoleToDatabase(userId, role, approvalStatus);

      return {
        success: true,
        role,
        approved: approvalStatus,
        previousRole: currentMetadata.role || ROLES.USER,
        previousApproved: currentMetadata.approved === true,
      };
    } catch (error) {
      lastError = error;
      attempts++;
      // Wait before retrying (exponential backoff)
      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  console.error(
    `Failed to update user role after ${maxRetries} attempts:`,
    lastError
  );
  return {
    success: false,
    error: lastError?.message || "Failed to update user role",
  };
}

/**
 * Sync role from Clerk to MongoDB database
 * @param {String} userId - Clerk user ID
 * @param {String} role - Role to set in database
 * @param {Boolean} approved - Approval status
 * @returns {Promise<Object>} - Result of database update
 */
export async function syncRoleToDatabase(userId, role, approved) {
  try {
    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      console.warn(`User ${userId} not found in database during role sync`);
      return { success: false, error: "User not found in database" };
    }

    // Only update if values are different
    const needsUpdate = user.role !== role || user.approved !== approved;

    if (needsUpdate) {
      user.role = role;
      user.approved = approved;
      await user.save();

      console.log(
        `Synced role from Clerk to database for user ${userId}: ${role} (approved: ${approved})`
      );
      return { success: true, updated: true };
    }

    return { success: true, updated: false };
  } catch (error) {
    console.error("Error syncing role to database:", error);
    return { success: false, error: error.message };
  }
}
