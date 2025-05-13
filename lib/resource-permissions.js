/**
 * Resource-Based Permission System
 *
 * This system extends the RBAC system to support resource-level permissions,
 * allowing fine-grained access control based on specific resources.
 */

import { hasPermission } from "./permissions-manager";
import { connectDB } from "./db";
import { logger } from "./error-logger";
import { ObjectId } from "mongodb";

// Collection name for resource permissions
const COLLECTION_NAME = "resourcePermissions";

/**
 * Grant a permission to a user for a specific resource
 *
 * @param {String} userId - User's MongoDB ID
 * @param {String} clerkId - User's Clerk ID
 * @param {String} permission - Permission to grant
 * @param {String} resourceType - Type of resource (listing, inspection, etc.)
 * @param {String} resourceId - ID of the specific resource
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the operation
 */
export async function grantResourcePermission(
  userId,
  clerkId,
  permission,
  resourceType,
  resourceId,
  options = {}
) {
  const {
    reason = "Resource permission granted",
    grantedBy = "system",
    expiresAt = null,
  } = options;

  try {
    const db = await connectDB();

    // Create a unique identifier for this resource permission
    const permissionRecord = {
      userId: typeof userId === "string" ? new ObjectId(userId) : userId,
      clerkId,
      permission,
      resourceType,
      resourceId: resourceId.toString(),
      grantedAt: new Date(),
      grantedBy,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: true,
    };

    // Check if this permission already exists
    const existing = await db.collection(COLLECTION_NAME).findOne({
      userId: permissionRecord.userId,
      permission,
      resourceType,
      resourceId: resourceId.toString(),
      active: true,
    });

    if (existing) {
      // Update the existing permission if needed
      if (
        expiresAt ||
        existing.grantedBy !== grantedBy ||
        existing.reason !== reason
      ) {
        await db.collection(COLLECTION_NAME).updateOne(
          { _id: existing._id },
          {
            $set: {
              expiresAt: expiresAt ? new Date(expiresAt) : existing.expiresAt,
              grantedBy: grantedBy || existing.grantedBy,
              reason: reason || existing.reason,
              updatedAt: new Date(),
            },
          }
        );
      }

      return {
        success: true,
        updated: true,
        message: "Resource permission already exists and was updated",
        permissionId: existing._id,
      };
    }

    // Insert new permission
    const result = await db
      .collection(COLLECTION_NAME)
      .insertOne(permissionRecord);

    // Log the operation
    logger.info("Resource permission granted", {
      userId,
      clerkId,
      permission,
      resourceType,
      resourceId,
      grantedBy,
    });

    return {
      success: true,
      created: true,
      message: "Resource permission granted successfully",
      permissionId: result.insertedId,
    };
  } catch (error) {
    logger.error("Error granting resource permission", {
      userId,
      permission,
      resourceType,
      resourceId,
      error,
    });
    throw error;
  }
}

/**
 * Revoke a resource permission from a user
 *
 * @param {String} userId - User's MongoDB ID
 * @param {String} permission - Permission to revoke
 * @param {String} resourceType - Type of resource
 * @param {String} resourceId - ID of the specific resource
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the operation
 */
export async function revokeResourcePermission(
  userId,
  permission,
  resourceType,
  resourceId,
  options = {}
) {
  const { reason = "Resource permission revoked", revokedBy = "system" } =
    options;

  try {
    const db = await connectDB();

    // Find the permission to revoke
    const userIdObj =
      typeof userId === "string" ? new ObjectId(userId) : userId;

    const result = await db.collection(COLLECTION_NAME).updateMany(
      {
        userId: userIdObj,
        permission,
        resourceType,
        resourceId: resourceId.toString(),
        active: true,
      },
      {
        $set: {
          active: false,
          revokedAt: new Date(),
          revokedBy,
          revocationReason: reason,
        },
      }
    );

    // Log the operation
    logger.info("Resource permission revoked", {
      userId,
      permission,
      resourceType,
      resourceId,
      revokedBy,
      count: result.modifiedCount,
    });

    return {
      success: true,
      revokedCount: result.modifiedCount,
      message: result.modifiedCount
        ? "Resource permission(s) revoked successfully"
        : "No matching active resource permissions found",
    };
  } catch (error) {
    logger.error("Error revoking resource permission", {
      userId,
      permission,
      resourceType,
      resourceId,
      error,
    });
    throw error;
  }
}

/**
 * Check if a user has permission for a specific resource
 *
 * @param {Object|String} user - User object or Clerk ID
 * @param {String} permission - Permission to check
 * @param {String} resourceType - Type of resource
 * @param {String} resourceId - ID of the specific resource
 * @returns {Promise<Boolean>} Whether user has the resource permission
 */
export async function hasResourcePermission(
  user,
  permission,
  resourceType,
  resourceId
) {
  try {
    // First, check if user has global permission (which grants access to all resources)
    if (hasPermission(user, permission)) {
      return true;
    }

    // Extract clerk ID from user
    const clerkId = typeof user === "string" ? user : user.id;

    if (!clerkId) {
      logger.warn("Invalid user object passed to hasResourcePermission", {
        user,
      });
      return false;
    }

    const db = await connectDB();

    // Look for a specific resource permission
    const resourcePermission = await db.collection(COLLECTION_NAME).findOne({
      clerkId,
      permission,
      resourceType,
      resourceId: resourceId.toString(),
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    return !!resourcePermission;
  } catch (error) {
    logger.error("Error checking resource permission", {
      user,
      permission,
      resourceType,
      resourceId,
      error,
    });
    return false;
  }
}

/**
 * Get all resources a user has a specific permission for
 *
 * @param {Object|String} user - User object or Clerk ID
 * @param {String} permission - Permission to check
 * @param {String} resourceType - Type of resource
 * @returns {Promise<Array<String>>} Array of resource IDs
 */
export async function getResourcesWithPermission(
  user,
  permission,
  resourceType
) {
  try {
    // Extract clerk ID from user
    const clerkId = typeof user === "string" ? user : user.id;

    if (!clerkId) {
      logger.warn("Invalid user object passed to getResourcesWithPermission", {
        user,
      });
      return [];
    }

    const db = await connectDB();

    // If user has global permission, we need to fetch all resources of this type
    if (hasPermission(user, permission)) {
      // The implementation here depends on your data structure
      // This is just a placeholder - you would need to customize this
      // to return all resources of the given type
      logger.info("User has global permission", { clerkId, permission });
      return "ALL_RESOURCES";
    }

    // Look for specific resource permissions
    const resourcePermissions = await db
      .collection(COLLECTION_NAME)
      .find({
        clerkId,
        permission,
        resourceType,
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .toArray();

    // Extract resource IDs
    return resourcePermissions.map((rp) => rp.resourceId);
  } catch (error) {
    logger.error("Error fetching resources with permission", {
      user,
      permission,
      resourceType,
      error,
    });
    return [];
  }
}

/**
 * Find all users that have a specific permission for a resource
 *
 * @param {String} permission - The permission to check for
 * @param {String} resourceType - Type of resource
 * @param {String} resourceId - ID of the specific resource
 * @returns {Promise<Array>} Array of user IDs with permission
 */
export async function getUsersWithResourcePermission(
  permission,
  resourceType,
  resourceId
) {
  try {
    const db = await connectDB();

    // Find all active permissions for this resource
    const resourcePermissions = await db
      .collection(COLLECTION_NAME)
      .find({
        permission,
        resourceType,
        resourceId: resourceId.toString(),
        active: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .toArray();

    // Extract unique user IDs
    return [...new Set(resourcePermissions.map((rp) => rp.clerkId))];
  } catch (error) {
    logger.error("Error fetching users with resource permission", {
      permission,
      resourceType,
      resourceId,
      error,
    });
    return [];
  }
}

/**
 * Process expired resource permissions
 * Should be run periodically as a scheduled task
 *
 * @returns {Promise<Object>} Processing results
 */
export async function processExpiredResourcePermissions() {
  const results = {
    processed: 0,
    expired: 0,
    errors: 0,
  };

  try {
    const db = await connectDB();
    const now = new Date();

    // Find expired but still active permissions
    const expiredPermissions = await db
      .collection(COLLECTION_NAME)
      .find({
        active: true,
        expiresAt: { $lt: now },
      })
      .toArray();

    results.processed = expiredPermissions.length;

    // Revoke each expired permission
    for (const permission of expiredPermissions) {
      try {
        await db.collection(COLLECTION_NAME).updateOne(
          { _id: permission._id },
          {
            $set: {
              active: false,
              revokedAt: now,
              revokedBy: "system",
              revocationReason: "Automatic expiration",
            },
          }
        );

        results.expired++;
      } catch (error) {
        results.errors++;
        logger.error("Error processing expired resource permission", {
          permissionId: permission._id,
          error,
        });
      }
    }

    logger.info("Processed expired resource permissions", results);
    return results;
  } catch (error) {
    logger.error("Error processing expired resource permissions", { error });
    throw error;
  }
}
