/**
 * Clerk authentication utilities
 */

/**
 * Gets the user's role from Clerk user metadata
 * @param {Object} user - Clerk user object
 * @returns {String} - User role (general, agent, admin)
 */
export function getUserRole(user) {
  if (!user || !user.publicMetadata) return 'general';
  return user.publicMetadata.role || 'general';
}

/**
 * Checks if a user is an admin
 * @param {Object} user - Clerk user object
 * @returns {Boolean}
 */
export function isAdmin(user) {
  return getUserRole(user) === 'admin';
}

/**
 * Checks if a user is an agent
 * @param {Object} user - Clerk user object
 * @returns {Boolean}
 */
export function isAgent(user) {
  return getUserRole(user) === 'agent';
}

/**
 * Updates a user's role in Clerk metadata
 * @param {String} userId - Clerk user ID
 * @param {String} role - New role (general, agent, admin)
 */
export async function updateUserRole(userId, role) {
  // This would use the Clerk Admin API to update user metadata
  // Implementation depends on your Clerk setup
}
