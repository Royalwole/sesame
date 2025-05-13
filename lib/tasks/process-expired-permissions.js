/**
 * Permission Expiration Processor
 *
 * This script identifies and removes expired temporary permissions from users.
 * It should be run as a scheduled task (e.g., daily) to ensure permissions
 * are properly removed when they expire.
 */

import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../db";
import { logger } from "../error-logger";

const BATCH_SIZE = 100; // Process users in batches to avoid memory issues

/**
 * Processes expired permissions for all users
 * @returns {Promise<Object>} Processing results with stats
 */
export async function processExpiredPermissions() {
  const results = {
    processed: 0,
    expiredFound: 0,
    updated: 0,
    errors: 0,
    errorDetails: [],
    timestamp: new Date().toISOString(),
  };

  logger.info("Starting expired permissions processing job");

  try {
    // Connect to MongoDB for logging
    await connectDB();

    // Get the current date in ISO format
    const now = new Date().toISOString();
    let hasMore = true;
    let pageOffset = null;

    // Process users in batches
    while (hasMore) {
      try {
        // Get batch of users from Clerk
        const usersResponse = await clerkClient.users.getUserList({
          limit: BATCH_SIZE,
          offset: pageOffset,
          orderBy: "-created_at",
        });

        const users = usersResponse.data || [];

        // Update pagination tracking
        hasMore = users.length === BATCH_SIZE;
        pageOffset = users.length > 0 ? users[users.length - 1].id : null;

        // Process each user in the batch
        for (const user of users) {
          results.processed++;

          try {
            // Check if user has temporary permissions
            const temporaryPermissions =
              user.publicMetadata?.temporaryPermissions || {};
            const userPermissions = user.publicMetadata?.permissions || [];

            // Skip users with no temporary permissions
            if (Object.keys(temporaryPermissions).length === 0) continue;

            let hasExpiredPermissions = false;
            const permissionsToRemove = [];

            // Check each temporary permission
            for (const [permission, metadata] of Object.entries(
              temporaryPermissions
            )) {
              if (metadata.expiresAt && metadata.expiresAt < now) {
                // Permission has expired
                hasExpiredPermissions = true;
                permissionsToRemove.push(permission);
                results.expiredFound++;

                logger.info("Found expired permission", {
                  userId: user.id,
                  permission,
                  expiredAt: metadata.expiresAt,
                });
              }
            }

            // Update user if expired permissions were found
            if (hasExpiredPermissions) {
              // Update the temporaryPermissions object by removing expired entries
              const updatedTemporaryPermissions = { ...temporaryPermissions };
              permissionsToRemove.forEach((perm) => {
                delete updatedTemporaryPermissions[perm];
              });

              // Update the permissions list by removing expired permissions
              const updatedPermissions = userPermissions.filter(
                (perm) => !permissionsToRemove.includes(perm)
              );

              // Update the user in Clerk
              await clerkClient.users.updateUser(user.id, {
                publicMetadata: {
                  ...user.publicMetadata,
                  temporaryPermissions: updatedTemporaryPermissions,
                  permissions: updatedPermissions,
                  lastPermissionUpdate: {
                    timestamp: now,
                    source: "permission-expiration-processor",
                    removed: permissionsToRemove,
                  },
                },
              });

              results.updated++;

              logger.info("Removed expired permissions", {
                userId: user.id,
                removed: permissionsToRemove,
              });
            }
          } catch (userError) {
            results.errors++;
            const errorDetail = {
              userId: user.id,
              error: userError.message,
            };
            results.errorDetails.push(errorDetail);

            logger.error("Error processing user permissions", {
              userId: user.id,
              error: userError.message,
              stack: userError.stack,
            });
          }
        }

        // Log progress for each batch
        logger.info(
          `Processed ${results.processed} users, found ${results.expiredFound} expired permissions`
        );
      } catch (batchError) {
        logger.error("Error processing batch of users", {
          error: batchError.message,
          stack: batchError.stack,
        });

        results.errors++;
        results.errorDetails.push({
          batch: true,
          error: batchError.message,
        });

        // Break the loop on batch error
        hasMore = false;
      }
    }

    // Log completion
    logger.info("Completed expired permissions processing", {
      processed: results.processed,
      expiredFound: results.expiredFound,
      updated: results.updated,
      errors: results.errors,
    });

    return results;
  } catch (error) {
    logger.error("Fatal error in permission expiration processor", {
      error: error.message,
      stack: error.stack,
    });

    throw error;
  } finally {
    // Always disconnect from MongoDB
    await disconnectDB();
  }
}

// Allow direct execution from command line
if (require.main === module) {
  processExpiredPermissions()
    .then((results) => {
      console.log("Completed processing expired permissions:");
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error processing expired permissions:", error);
      process.exit(1);
    });
}
