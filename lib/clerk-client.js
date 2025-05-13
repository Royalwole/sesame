/**
 * Clerk Client-side Role Management
 *
 * Contains only client-safe functions for role checking that don't use server-only imports.
 */

import { ROLES } from "./role-management";

/**
 * Get user role from Clerk user object with better detection
 * @param {Object} user - Clerk user object
 * @returns {string} - User role
 */
export function getUserRole(user) {
  if (!user) return "user";

  try {
    // Check both locations for role information
    const publicRole = user.publicMetadata?.role;
    const privateRole = user.privateMetadata?.role;
    const role = publicRole || privateRole || "user";

    // Double verification for admin roles to prevent loops
    if (role === "admin" || role === "super_admin") {
      // Make sure admin has the right metadata
      const hasAdminApproval = user.publicMetadata?.approved === true;

      // Return admin only if properly approved
      return hasAdminApproval ? role : "user";
    }

    return role;
  } catch (error) {
    console.error("Error getting user role:", error);
    return "user"; // Default to lowest permission
  }
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
 * @returns {Promise<boolean>} - Whether the refresh was successful
 */
export async function refreshUserSession(clerk) {
  if (!clerk) return false;

  try {
    // Force token refresh to get latest metadata
    await clerk.session.touch();
    return true;
  } catch (error) {
    // More graceful error handling - don't break the app flow for network errors
    console.error("Error refreshing user session:", error);

    // For network errors, we don't want to break the application flow
    if (
      error.message &&
      (error.message.includes("Network error") ||
        error.message.includes("NetworkError") ||
        error.name === "TypeError")
    ) {
      console.warn(
        "Network error during session refresh - continuing without refresh"
      );
      return false;
    }

    // For other errors, we still want to throw to be handled by the caller
    throw error;
  }
}
