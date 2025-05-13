/**
 * Role Consistency Verifier
 *
 * Utility to check for inconsistencies between Clerk and MongoDB user roles
 */

import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "./db";
import User from "../models/User";
import { logger } from "./error-logger";

/**
 * Verify role consistency between Clerk and MongoDB for a specific user
 * @param {string} userId - Clerk user ID
 * @returns {Promise<Object>} Consistency check result
 */
export async function checkUserRoleConsistency(userId) {
  try {
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    const clerkRole = clerkUser.publicMetadata?.role;

    // Get user from MongoDB
    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId }).lean();

    if (!dbUser) {
      return {
        userId,
        consistent: false,
        error: "User not found in database",
        clerkRole,
        dbRole: null,
        email: clerkUser.emailAddresses?.[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      };
    }

    // Compare roles
    const isConsistent = clerkRole === dbUser.role;

    return {
      userId,
      consistent: isConsistent,
      clerkRole,
      dbRole: dbUser.role,
      email: dbUser.email || clerkUser.emailAddresses?.[0]?.emailAddress,
      firstName: dbUser.firstName || clerkUser.firstName,
      lastName: dbUser.lastName || clerkUser.lastName,
      dbId: dbUser._id.toString(),
    };
  } catch (error) {
    logger.error("Error checking user role consistency", {
      userId,
      error: error.message,
      stack: error.stack,
    });

    return {
      userId,
      consistent: false,
      error: error.message,
    };
  }
}

/**
 * Check and fix role consistency for all users or up to a limit
 * @param {Object} options - Options for the verification process
 * @param {number} options.limit - Maximum number of users to process (default: 100)
 * @param {boolean} options.autoFix - Automatically fix inconsistencies (default: false)
 * @param {boolean} options.fixDirection - Direction to fix ("toClerk" or "toDb"; default: "toClerk")
 * @returns {Promise<Object>} Results with consistency stats
 */
export async function verifyRoleConsistency(options = {}) {
  const {
    limit = 100,
    autoFix = false,
    fixDirection = "toClerk",
    onProgress = null,
  } = options;

  const result = {
    total: 0,
    consistent: 0,
    inconsistent: 0,
    errors: 0,
    fixed: 0,
    details: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Connect to database
    await connectDB();

    // Get users from database
    const dbUsers = await User.find({
      isDeleted: { $ne: true }, // Only active users
    })
      .limit(limit)
      .lean();

    result.total = dbUsers.length;

    // Process each user
    for (const dbUser of dbUsers) {
      try {
        // Update progress if callback provided
        if (onProgress) {
          onProgress({
            processed: result.consistent + result.inconsistent + result.errors,
            total: result.total,
          });
        }

        // Get user from Clerk
        const userId = dbUser.clerkId;
        const clerkUser = await clerkClient.users.getUser(userId);
        const clerkRole = clerkUser.publicMetadata?.role;
        const dbRole = dbUser.role;

        // Compare roles
        const isConsistent = clerkRole === dbRole;

        // Add to appropriate count
        if (isConsistent) {
          result.consistent++;
        } else {
          result.inconsistent++;

          // Record the inconsistency
          const userDetails = {
            userId,
            dbId: dbUser._id.toString(),
            email: dbUser.email || clerkUser.emailAddresses?.[0]?.emailAddress,
            name: `${dbUser.firstName || clerkUser.firstName || ""} ${dbUser.lastName || clerkUser.lastName || ""}`.trim(),
            clerkRole,
            dbRole,
            fixed: false,
          };

          // Auto-fix if enabled
          if (autoFix) {
            try {
              if (fixDirection === "toClerk") {
                // Update Clerk to match DB
                await clerkClient.users.updateUser(userId, {
                  publicMetadata: {
                    ...clerkUser.publicMetadata,
                    role: dbRole,
                    syncedAt: new Date().toISOString(),
                    syncSource: "verify-role-consistency",
                  },
                });
                userDetails.fixed = true;
                userDetails.fixDirection = "toClerk";
                result.fixed++;
              } else if (fixDirection === "toDb") {
                // Update DB to match Clerk
                await User.updateOne(
                  { _id: dbUser._id },
                  {
                    $set: {
                      role: clerkRole,
                      updatedAt: new Date(),
                      lastRoleSync: {
                        source: "verify-role-consistency",
                        timestamp: new Date(),
                      },
                    },
                  }
                );
                userDetails.fixed = true;
                userDetails.fixDirection = "toDb";
                result.fixed++;
              }
            } catch (fixError) {
              userDetails.fixError = fixError.message;
              logger.error("Error fixing role inconsistency", {
                userId,
                error: fixError.message,
                fixDirection,
              });
            }
          }

          result.details.push(userDetails);
        }
      } catch (userError) {
        result.errors++;
        result.details.push({
          userId: dbUser.clerkId,
          dbId: dbUser._id.toString(),
          email: dbUser.email,
          name: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim(),
          error: userError.message,
          dbRole: dbUser.role,
        });

        logger.error("Error processing user during consistency check", {
          userId: dbUser.clerkId,
          error: userError.message,
        });
      }
    }

    return result;
  } catch (error) {
    logger.error("Error verifying role consistency", {
      error: error.message,
      stack: error.stack,
    });

    throw error;
  } finally {
    // Close database connection
    await disconnectDB();
  }
}

/**
 * Fix a specific user's role inconsistency
 * @param {string} userId - Clerk user ID
 * @param {string} direction - Direction to fix ("toClerk" or "toDb")
 * @returns {Promise<Object>} Result of the fix operation
 */
export async function fixUserRoleInconsistency(userId, direction = "toClerk") {
  try {
    // Check current consistency
    const check = await checkUserRoleConsistency(userId);

    if (check.consistent) {
      return {
        success: true,
        userId,
        message: "User roles are already consistent",
        consistent: true,
        role: check.clerkRole,
      };
    }

    if (direction === "toClerk") {
      // Update Clerk to match DB
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          role: check.dbRole,
          syncedAt: new Date().toISOString(),
          syncSource: "manual-fix",
        },
      });

      logger.info("Fixed user role in Clerk", {
        userId,
        fromRole: check.clerkRole,
        toRole: check.dbRole,
      });

      return {
        success: true,
        userId,
        message: `Updated Clerk role from ${check.clerkRole || "undefined"} to ${check.dbRole}`,
        consistent: true,
        role: check.dbRole,
      };
    } else if (direction === "toDb") {
      // Update DB to match Clerk
      await connectDB();
      const result = await User.updateOne(
        { clerkId: userId },
        {
          $set: {
            role: check.clerkRole,
            updatedAt: new Date(),
            lastRoleSync: {
              source: "manual-fix",
              timestamp: new Date(),
            },
          },
        }
      );

      if (result.modifiedCount === 0) {
        return {
          success: false,
          userId,
          message: "Failed to update database or user not found",
          consistent: false,
        };
      }

      logger.info("Fixed user role in database", {
        userId,
        fromRole: check.dbRole,
        toRole: check.clerkRole,
      });

      return {
        success: true,
        userId,
        message: `Updated database role from ${check.dbRole || "undefined"} to ${check.clerkRole}`,
        consistent: true,
        role: check.clerkRole,
      };
    } else {
      return {
        success: false,
        userId,
        message: "Invalid direction. Use 'toClerk' or 'toDb'",
        consistent: false,
      };
    }
  } catch (error) {
    logger.error("Error fixing user role inconsistency", {
      userId,
      direction,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      userId,
      error: error.message,
      consistent: false,
    };
  }
}
