/**
 * Utility functions for user roles and permissions
 *
 * @deprecated Use the functions from lib/role-management.js instead
 * This file is kept for backward compatibility and will be removed in a future update.
 */

import {
  isAnyAgent as checkIsAgent,
  isApprovedAgent as checkIsApprovedAgent,
  isPendingAgent as checkIsPendingAgent,
  isAdmin as checkIsAdmin,
} from "./role-management";

/**
 * Check if a user is an agent (either approved or pending)
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is any type of agent
 * @deprecated Use isAnyAgent from role-management.js instead
 */
export function isAgent(user) {
  return checkIsAgent(user);
}

/**
 * Check if a user is an approved agent
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is an approved agent
 * @deprecated Use isApprovedAgent from role-management.js instead
 */
export function isApprovedAgent(user) {
  return checkIsApprovedAgent(user);
}

/**
 * Check if a user is a pending agent
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is a pending agent
 * @deprecated Use isPendingAgent from role-management.js instead
 */
export function isPendingAgent(user) {
  return checkIsPendingAgent(user);
}

/**
 * Check if a user is an admin
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is an admin
 * @deprecated Use isAdmin from role-management.js instead
 */
export function isAdmin(user) {
  return checkIsAdmin(user);
}
