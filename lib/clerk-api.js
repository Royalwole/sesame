/**
 * Robust Clerk API utility for server-side operations
 * This helps resolve initialization issues with the Clerk client
 */
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Gets a user from Clerk API with error handling
 * @param {string} userId - Clerk user ID
 * @returns {Promise<Object|null>} - Clerk user or null if not found
 */
async function getUser(userId) {
  if (!userId) {
    console.error("getUser called without userId");
    return null;
  }

  try {
    console.log(`Fetching user data from Clerk API: ${userId}`);
    const user = await clerkClient.users.getUser(userId);
    return user;
  } catch (error) {
    console.error(`Clerk API error when fetching user ${userId}:`, error);
    return null;
  }
}

/**
 * Updates a user in Clerk API
 * @param {string} userId - Clerk user ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object|null>} - Updated user or null on error
 */
async function updateUser(userId, data) {
  if (!userId || !data) {
    console.error("updateUser called with invalid parameters");
    return null;
  }

  try {
    console.log(`Updating user in Clerk API: ${userId}`);
    const user = await clerkClient.users.updateUser(userId, data);
    return user;
  } catch (error) {
    console.error(`Clerk API error when updating user ${userId}:`, error);
    return null;
  }
}

/**
 * Creates a fallback user object from minimal data
 * Used when Clerk API is unavailable
 * @param {string} userId - Clerk user ID
 * @returns {Object} - Minimal user data
 */
function createFallbackUserData(userId) {
  return {
    id: userId,
    firstName: "",
    lastName: "",
    emailAddresses: [],
    imageUrl: "",
    publicMetadata: {
      role: "user",
    },
  };
}

export { getUser, updateUser, createFallbackUserData };
