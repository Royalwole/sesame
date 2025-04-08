import { clerkClient } from "@clerk/nextjs";

/**
 * Helper function to get a Clerk user with better error handling
 * @param {string} userId - The Clerk user ID
 * @returns {Object} - User data or null
 */
export async function getClerkUser(userId) {
  if (!userId) return null;

  try {
    const user = await clerkClient.users.getUser(userId);
    return user;
  } catch (error) {
    console.error(`Error fetching Clerk user ${userId}:`, error);
    return null;
  }
}

/**
 * Get a user's profile data from Clerk in a normalized format
 * @param {string} userId - The Clerk user ID
 * @returns {Object} - Normalized user profile data
 */
export async function getUserProfile(userId) {
  const user = await getClerkUser(userId);

  if (!user) {
    return {
      id: userId,
      firstName: "",
      lastName: "",
      email: "",
      imageUrl: "",
      complete: false,
    };
  }

  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );

  return {
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email:
      primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || "",
    imageUrl: user.imageUrl || "",
    complete: !!user.firstName && !!user.lastName,
  };
}
