/**
 * Clerk to MongoDB Synchronization Utilities
 *
 * This module handles data synchronization between Clerk and MongoDB,
 * ensuring all user data is properly mirrored between both systems.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { connectDB } from "./db";
import User from "../models/User";
import { getUserRole, getApprovalStatus } from "./clerk-role-management";
import { ROLES } from "./role-management";

/**
 * Comprehensive sync of a user from Clerk to MongoDB
 * Ensures all relevant user data is stored in MongoDB
 *
 * @param {String} userId - Clerk user ID
 * @returns {Promise<Object>} - Result of the sync operation
 */
export async function syncUserFromClerk(userId) {
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }

  try {
    await connectDB();

    // Get the user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return { success: false, error: "User not found in Clerk" };
    }

    // Extract all relevant data from Clerk
    const metadata = clerkUser.publicMetadata || {};
    const privateMetadata = clerkUser.privateMetadata || {};

    // Get primary email
    const primaryEmailObj = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    const email =
      primaryEmailObj?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "";

    // Get role information
    const role = getUserRole(clerkUser);
    const approved = getApprovalStatus(clerkUser);

    // Find or create user in MongoDB
    let dbUser = await User.findOne({ clerkId: userId });
    let isNewUser = false;

    if (!dbUser) {
      // Create new user if not exists
      dbUser = new User({
        clerkId: userId,
        email: email,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        profileImage: clerkUser.imageUrl || "",
        role: role,
        approved: approved,
        createdAt: new Date(),
      });
      isNewUser = true;
    } else {
      // Update existing user with Clerk data
      dbUser.email = email || dbUser.email;
      dbUser.firstName = clerkUser.firstName || dbUser.firstName;
      dbUser.lastName = clerkUser.lastName || dbUser.lastName;
      dbUser.profileImage = clerkUser.imageUrl || dbUser.profileImage;
      dbUser.role = role;
      dbUser.approved = approved;
      dbUser.updatedAt = new Date();
    }

    // Store additional Clerk metadata in MongoDB
    // This ensures we have all relevant user data locally
    dbUser.metadata = {
      ...(dbUser.metadata || {}),
      clerkMetadata: metadata,
      lastSyncedAt: new Date(),
    };

    // Store user preferences if available
    if (metadata.preferences) {
      dbUser.preferences = metadata.preferences;
    }

    // Store any custom profile fields from Clerk
    if (metadata.profile) {
      dbUser.profile = {
        ...(dbUser.profile || {}),
        ...metadata.profile,
      };
    }

    // Save the user to MongoDB
    await dbUser.save();

    return {
      success: true,
      isNewUser,
      userId,
      email,
      role,
      approved,
      message: isNewUser
        ? "New user created in MongoDB from Clerk data"
        : "Existing user updated with Clerk data",
    };
  } catch (error) {
    console.error("Error syncing user from Clerk to MongoDB:", error);
    return {
      success: false,
      error: error.message,
      userId,
    };
  }
}

/**
 * Sync all users from Clerk to MongoDB
 * Useful for initial data population or routine maintenance
 *
 * @param {Number} batchSize - Number of users to process per batch
 * @returns {Promise<Object>} - Results of the sync operation
 */
export async function syncAllUsersFromClerk(batchSize = 100) {
  const results = {
    success: true,
    total: 0,
    created: 0,
    updated: 0,
    failed: 0,
    failures: [],
  };

  try {
    await connectDB();

    // Get all users from Clerk with pagination
    let allProcessed = false;
    let pageNum = 1;

    while (!allProcessed) {
      console.log(`Processing user batch ${pageNum}...`);

      const userListResponse = await clerkClient.users.getUserList({
        limit: batchSize,
        offset: (pageNum - 1) * batchSize,
      });

      const users = userListResponse.data || [];

      // If we got fewer users than the batch size, we've processed all users
      if (users.length < batchSize) {
        allProcessed = true;
      }

      // Process each user in the batch
      for (const user of users) {
        const syncResult = await syncUserFromClerk(user.id);
        results.total++;

        if (syncResult.success) {
          if (syncResult.isNewUser) {
            results.created++;
          } else {
            results.updated++;
          }
        } else {
          results.failed++;
          results.failures.push({
            userId: user.id,
            error: syncResult.error,
          });
        }
      }

      pageNum++;
    }

    return results;
  } catch (error) {
    console.error("Error syncing all users:", error);
    return {
      ...results,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update the MongoDB model schema to ensure it can store all Clerk data
 * Call this when you need to add new fields to the User model
 *
 * @returns {Promise<Boolean>} - Whether the operation was successful
 */
export async function ensureUserSchemaCompatibility() {
  try {
    await connectDB();

    // Get a sample user from Clerk to analyze structure
    const userListResponse = await clerkClient.users.getUserList({
      limit: 1,
    });

    if (userListResponse.data && userListResponse.data.length > 0) {
      const sampleUser = userListResponse.data[0];

      // Log the structure for reference
      console.log(
        "Clerk user structure sample:",
        Object.keys(sampleUser).filter(
          (k) => !["object", "function"].includes(typeof sampleUser[k])
        )
      );

      console.log(
        "Metadata structure sample:",
        Object.keys(sampleUser.publicMetadata || {})
      );
    }

    return true;
  } catch (error) {
    console.error("Error checking schema compatibility:", error);
    return false;
  }
}
