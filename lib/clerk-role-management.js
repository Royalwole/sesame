/**
 * Clerk Role Management System - CLIENT VERSION
 *
 * IMPORTANT: This file has been modified to be safe for client-side usage.
 * All server-side functionality has been moved to clerk-server.js.
 *
 * This file is safe to import in client components.
 */

import { ROLES, ROLE_HIERARCHY } from "./role-management";

/**
 * Gets a user's role from Clerk metadata
 * @param {Object} user - Clerk user object
 * @returns {String} - User role
 */
export function getUserRole(user) {
  if (!user || !user.publicMetadata) return ROLES.USER;
  return user.publicMetadata.role || ROLES.USER;
}

/**
 * Gets approval status for an agent
 * @param {Object} user - Clerk user object
 * @returns {Boolean} - Whether the agent is approved
 */
export function getApprovalStatus(user) {
  if (!user || !user.publicMetadata) return false;
  return user.publicMetadata.approved === true;
}

/**
 * Force a token refresh to ensure the client has latest role data
 * @param {Object} clerk - Clerk instance from useClerk()
 * @returns {Promise<void>}
 */
export async function refreshUserSession(clerk) {
  if (!clerk) return;

  try {
    // Force token refresh to get latest metadata
    await clerk.session.touch();
  } catch (error) {
    console.error("Error refreshing user session:", error);
  }
}

/**
 * Check if a user has permission to change another user's role
 * @param {Object} adminUser - The admin user performing the action
 * @param {Object} targetUser - The user being modified
 * @param {String} newRole - The target role
 * @returns {Boolean} - Whether the admin can perform this change
 */
export function canChangeUserRole(adminUser, targetUser, newRole) {
  // Get roles
  const adminRole = getUserRole(adminUser);
  const targetRole = getUserRole(targetUser);

  // Check if admin has sufficient privileges
  const adminIndex = ROLE_HIERARCHY.indexOf(adminRole);
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);
  const newRoleIndex = ROLE_HIERARCHY.indexOf(newRole);

  // Rules:
  // 1. Admin must have higher privileges than target
  // 2. Admin can't promote to a role higher than their own
  return adminIndex > targetIndex && adminIndex >= newRoleIndex;
}

// NOTE: Server-side functions like updateUserRole and syncRoleToDatabase
// have been moved to clerk-server.js and should be imported there for
// API routes and server-side code only.
