/**
 * Clerk authentication utilities
 *
 * @deprecated For role management use lib/role-management.js instead
 * This file contains Clerk-specific utilities that should be migrated to the role management system
 */

import { ROLES } from "./role-management";

/**
 * Gets the user's role from Clerk user metadata
 * @param {Object} user - Clerk user object
 * @returns {String} - User role (user, agent, admin)
 */
export function getUserRole(user) {
  if (!user || !user.publicMetadata) return ROLES.USER;
  return user.publicMetadata.role || ROLES.USER;
}

/**
 * Checks if a user is an admin
 * @param {Object} user - Clerk user object
 * @returns {Boolean}
 */
export function isAdmin(user) {
  return getUserRole(user) === ROLES.ADMIN;
}

/**
 * Checks if a user is an agent
 * @param {Object} user - Clerk user object
 * @returns {Boolean}
 */
export function isAgent(user) {
  return getUserRole(user) === ROLES.AGENT;
}

/**
 * Checks if user is a pending agent
 * @param {Object} user - Clerk user object
 * @returns {Boolean}
 */
export function isPendingAgent(user) {
  return getUserRole(user) === ROLES.AGENT_PENDING;
}

/**
 * Checks if user is any kind of agent (approved or pending)
 * @param {Object} user - Clerk user object
 * @returns {Boolean}
 */
export function isAnyAgent(user) {
  const role = getUserRole(user);
  return role === ROLES.AGENT || role === ROLES.AGENT_PENDING;
}

/**
 * Updates a user's role in Clerk metadata
 * @param {String} userId - Clerk user ID
 * @param {String} role - New role from ROLES object
 */
export async function updateUserRole(clerkClient, userId, role) {
  try {
    // Validate the role
    if (!Object.values(ROLES).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Update the user's public metadata with the new role
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user role in Clerk:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Synchronize a user's role between database and Clerk
 * @param {Object} clerkClient - Clerk client instance
 * @param {String} userId - Clerk user ID
 * @param {Object} dbUser - Database user object
 */
export async function syncUserRoleWithClerk(clerkClient, userId, dbUser) {
  try {
    if (!userId || !dbUser || !dbUser.role) {
      throw new Error("Missing required user data for sync");
    }

    // Get current Clerk user
    const clerkUser = await clerkClient.users.getUser(userId);

    // Extract current role from Clerk metadata
    const currentClerkRole = clerkUser.publicMetadata?.role || ROLES.USER;

    // If roles don't match, update Clerk
    if (currentClerkRole !== dbUser.role) {
      console.log(
        `Syncing user ${userId} role: ${currentClerkRole} → ${dbUser.role}`
      );

      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...clerkUser.publicMetadata,
          role: dbUser.role,
          approved: dbUser.approved === true,
        },
      });
    }

    return { success: true, synced: currentClerkRole !== dbUser.role };
  } catch (error) {
    console.error("Error syncing user role with Clerk:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
