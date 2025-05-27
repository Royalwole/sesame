/**
 * Resilient user synchronization utility
 *
 * This utility provides robust handling for synchronizing user data
 * between Clerk and MongoDB with retry logic and error recovery.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "./db";
import User from "../models/User";
import Listing from "../models/Listing";

// Ensure Clerk client is available
const getClerkClient = () => {
  if (!clerkClient || !clerkClient.users) {
    throw new Error("Clerk client is not properly initialized");
  }
  return clerkClient;
};

/**
 * Sync user from Clerk to MongoDB with retry logic
 * @param {string} clerkId - The Clerk user ID
 * @param {Object} options - Options for the sync operation
 * @param {number} options.maxRetries - Maximum number of retries (default: 2)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<Object>} - Result of sync operation
 */
export async function resilientUserSync(clerkId, options = {}) {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    traceId = `trace-${Date.now()}`,
  } = options;
  let attempts = 0;
  let lastError = null;

  // Track database connection state
  let dbConnectionEstablished = false;

  // Track performance metrics
  const startTime = Date.now();
  const metrics = {
    clerkApiTime: 0,
    dbTime: 0,
    totalTime: 0,
    listingUpdateTime: 0,
  };

  try {
    while (attempts <= maxRetries) {
      try {
        console.log(
          `[ResilientSync] [${traceId}] Attempt ${attempts + 1}/${maxRetries + 1} for user: ${clerkId}`
        );

        // Get user from Clerk - with timeout and error tracking
        const clerkApiStartTime = Date.now();
        let clerkUser;
        try {
          const client = getClerkClient();
          clerkUser = await client.users.getUser(clerkId);
          metrics.clerkApiTime = Date.now() - clerkApiStartTime;
        } catch (clerkError) {
          console.error(
            `[ResilientSync] [${traceId}] Clerk API error:`,
            clerkError
          );
          metrics.clerkApiTime = Date.now() - clerkApiStartTime;

          // Categorize clerk errors
          if (clerkError.status === 404) {
            throw new Error(`User not found in Clerk: ${clerkId}`);
          } else if (clerkError.status === 429) {
            throw new Error(
              `Clerk API rate limit exceeded for user: ${clerkId}`
            );
          } else {
            throw new Error(
              `Clerk API error: ${clerkError.message || "Unknown error"}`
            );
          }
        }

        if (!clerkUser) {
          throw new Error(`User not found in Clerk: ${clerkId}`);
        } // Connect to database if not already connected
        if (!dbConnectionEstablished) {
          const dbStartTime = Date.now();
          try {
            await connectDB();
            dbConnectionEstablished = true;
            metrics.dbTime += Date.now() - dbStartTime;
          } catch (dbError) {
            metrics.dbTime += Date.now() - dbStartTime;
            console.error(
              `[ResilientSync] [${traceId}] Database connection error:`,
              dbError
            );
            throw new Error(
              `Database connection failed: ${dbError.message || "Unknown error"}`
            );
          }
        }

        // Find user in database with error handling
        const findStartTime = Date.now();
        let user;
        try {
          user = await User.findOne({ clerkId });
          metrics.dbTime += Date.now() - findStartTime;
        } catch (findError) {
          metrics.dbTime += Date.now() - findStartTime;
          console.error(
            `[ResilientSync] [${traceId}] Error finding user:`,
            findError
          );
          throw new Error(
            `Database query failed: ${findError.message || "Unknown error"}`
          );
        }

        // Extract profile data from Clerk
        const primaryEmail = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        );

        const userData = {
          clerkId,
          email: primaryEmail?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          fullName:
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          profileImage: clerkUser.profileImageUrl,
          updatedAt: new Date(),
          lastSyncedAt: new Date(),
          syncStatus: "success",
        };

        let listingsUpdated = 0;
        if (user) {
          // Update existing user with error handling
          Object.assign(user, userData);

          const saveStartTime = Date.now();
          try {
            await user.save();
            metrics.dbTime += Date.now() - saveStartTime;

            console.log(
              `[ResilientSync] [${traceId}] User updated successfully: ${user._id}`
            );

            // Update user's listings with performance tracking
            const listingStartTime = Date.now();
            listingsUpdated = await updateListingsForUser(user._id, traceId);
            metrics.listingUpdateTime = Date.now() - listingStartTime;
          } catch (saveError) {
            metrics.dbTime += Date.now() - saveStartTime;
            console.error(
              `[ResilientSync] [${traceId}] Error saving user:`,
              saveError
            );
            throw new Error(
              `Failed to save user data: ${saveError.message || "Database error"}`
            );
          }
        } else {
          // Create new user
          userData.createdAt = new Date();
          userData.role = clerkUser.publicMetadata?.role || "user";

          const createStartTime = Date.now();
          try {
            user = new User(userData);
            await user.save();
            metrics.dbTime += Date.now() - createStartTime;

            console.log(
              `[ResilientSync] [${traceId}] New user created: ${user._id}`
            );
          } catch (createError) {
            metrics.dbTime += Date.now() - createStartTime;
            console.error(
              `[ResilientSync] [${traceId}] Error creating user:`,
              createError
            );
            throw new Error(
              `Failed to create user: ${createError.message || "Database error"}`
            );
          }
        } // Calculate total time
        metrics.totalTime = Date.now() - startTime;

        return {
          success: true,
          user,
          listingsUpdated,
          attempts: attempts + 1,
          metrics,
          traceId,
        };
      } catch (error) {
        lastError = error;

        // Store sync failure if we have a user and database connection
        if (dbConnectionEstablished) {
          try {
            // Try to update the sync status if the user exists
            await User.updateOne(
              { clerkId },
              {
                $set: {
                  syncStatus: "error",
                  lastSyncError: error.message,
                  syncHistory: {
                    date: new Date(),
                    status: "error",
                    error: error.message,
                  },
                },
              },
              { upsert: false }
            );
          } catch (storageError) {
            console.error(
              "[ResilientSync] Failed to store sync status:",
              storageError
            );
          }
        }

        attempts++;
        console.error(
          `[ResilientSync] Attempt ${attempts}/${maxRetries + 1} failed:`,
          error
        );

        // If we've tried enough times, throw the error
        if (attempts > maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  } catch (error) {
    // Calculate total time even when failed
    metrics.totalTime = Date.now() - startTime;

    console.error(
      `[ResilientSync] [${traceId}] All sync attempts failed after ${attempts} tries:`,
      error
    );

    // Try to record the error in the database if possible
    if (dbConnectionEstablished) {
      try {
        await User.updateOne(
          { clerkId },
          {
            $set: {
              syncStatus: "failed",
              lastSyncError: error.message,
              lastSyncAttempt: new Date(),
            },
            $push: {
              syncHistory: {
                date: new Date(),
                status: "failed",
                error: error.message,
                attempts,
                traceId,
              },
            },
          },
          { upsert: false }
        );
      } catch (recordError) {
        console.error(
          `[ResilientSync] [${traceId}] Failed to record error:`,
          recordError
        );
      }
    }

    return {
      success: false,
      error: error.message,
      attempts,
      metrics,
      traceId,
      errorType: error.constructor.name,
      errorDetails:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  } finally {
    // Ensure database connection is closed if it was opened
    if (dbConnectionEstablished) {
      try {
        await disconnectDB();
      } catch (disconnectError) {
        console.error(
          `[ResilientSync] [${traceId}] Error disconnecting from database:`,
          disconnectError
        );
      }
    }
  }
}

/**
 * Update all listings for a user
 * @param {string} userId - MongoDB user ID
 * @param {string} traceId - Trace ID for logging
 * @returns {Promise<number>} - Number of updated listings
 */
async function updateListingsForUser(userId, traceId = "no-trace") {
  try {
    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      console.warn(
        `[ResilientSync] [${traceId}] User not found for listing update: ${userId}`
      );
      return 0;
    }

    // Prepare profile data for listings
    const profileData = {
      _id: user._id,
      name:
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      profileImage: user.profileImage,
    };

    // Update listings with error handling and retry
    let result;
    const maxAttempts = 2;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        result = await Listing.updateMany(
          { agentId: user._id },
          {
            $set: {
              createdBy: profileData,
              updatedAt: new Date(),
              lastSync: new Date(),
            },
          }
        );

        // If successful, break out of the retry loop
        break;
      } catch (updateError) {
        console.error(
          `[ResilientSync] [${traceId}] Error updating listings (attempt ${attempt + 1}/${maxAttempts}):`,
          updateError
        );

        // If this was the last attempt, rethrow
        if (attempt === maxAttempts - 1) {
          throw updateError;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(
      `[ResilientSync] [${traceId}] Updated ${result?.modifiedCount || 0} listings for user: ${userId}`
    );
    return result?.modifiedCount || 0;
  } catch (error) {
    console.error(
      `[ResilientSync] [${traceId}] Error updating listings:`,
      error
    );
    // Don't fail the whole sync just because listing updates failed
    return 0;
  }
}
