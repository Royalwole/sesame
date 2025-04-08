/**
 * Utility functions for user roles and permissions
 */

/**
 * Check if a user is an agent (either approved or pending)
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is any type of agent
 */
export function isAgent(user) {
  if (!user) return false;
  return user.role === "agent" || user.role === "agent_pending";
}

/**
 * Check if a user is an approved agent
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is an approved agent
 */
export function isApprovedAgent(user) {
  if (!user) return false;
  return user.role === "agent" && user.approved;
}

/**
 * Check if a user is a pending agent
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is a pending agent
 */
export function isPendingAgent(user) {
  if (!user) return false;
  return user.role === "agent_pending";
}

/**
 * Check if a user is an admin
 * @param {Object} user - User object from database
 * @returns {boolean} - Whether the user is an admin
 */
export function isAdmin(user) {
  if (!user) return false;
  return user.role === "admin";
}
