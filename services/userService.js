import User from "../models/User";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Service for managing users
 */
export async function getUserById(id) {
  try {
    return await User.findById(id);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

/**
 * Gets a user by their Clerk ID
 * @param {string} clerkId - The Clerk user ID
 * @returns {Promise<Object|null>} - The user object or null
 */
export async function getUserByClerkId(clerkId) {
  if (!clerkId) return null;

  try {
    const user = await User.findOne({ clerkId: clerkId });
    return user;
  } catch (error) {
    console.error("Error fetching user by clerk ID:", error);
    return null;
  }
}

/**
 * Creates a user in our database if they don't already exist
 * @param {string} clerkId - The Clerk user ID
 * @returns {Promise<Object|null>} - The user object or null
 */
export async function createUserIfNotExists(clerkId) {
  if (!clerkId) return null;

  try {
    // Check if user already exists
    let user = await User.findOne({ clerkId });
    if (user) return user;

    // User doesn't exist, fetch from Clerk and create
    console.log("Fetching user data from Clerk:", clerkId);
    const clerkUser = await clerkClient.users.getUser(clerkId);

    if (!clerkUser) {
      console.error("User not found in Clerk");
      return null;
    }

    // Create new user
    user = new User({
      clerkId,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      profileImage: clerkUser.imageUrl,
      role: getClerkUserRole(clerkUser),
      approved: isClerkUserApproved(clerkUser),
    });

    await user.save();
    console.log("Created new user in database:", user._id);

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

/**
 * Helper to get role from Clerk publicMetadata
 */
function getClerkUserRole(clerkUser) {
  if (!clerkUser?.publicMetadata) return "user";
  return clerkUser.publicMetadata.role || "user";
}

/**
 * Helper to check if user is approved from Clerk publicMetadata
 */
function isClerkUserApproved(clerkUser) {
  if (!clerkUser?.publicMetadata) return true;
  if (clerkUser.publicMetadata.role === "agent") {
    return clerkUser.publicMetadata.approved !== false;
  }
  return true;
}

export async function createUser(userData) {
  const user = new User(userData);
  await user.save();
  return user;
}

export async function updateUser(id, userData) {
  try {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

export async function deleteUser(id) {
  try {
    await User.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false };
  }
}

export async function approveAgent(id) {
  try {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "agent") {
      throw new Error("User is not an agent");
    }

    user.approved = true;
    await user.save();

    return user;
  } catch (error) {
    console.error("Error approving agent:", error);
    throw error;
  }
}

/**
 * Updates user metadata
 * @param {string} clerkId - The Clerk user ID
 * @param {Object} metadata - The metadata to update
 * @returns {Promise<boolean>} - Success status
 */
export async function updateUserMetadata(clerkId, metadata) {
  if (!clerkId) return false;

  try {
    await clerkClient.users.updateUser(clerkId, {
      publicMetadata: metadata,
    });
    return true;
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return false;
  }
}
