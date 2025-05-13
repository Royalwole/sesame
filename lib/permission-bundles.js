/**
 * Permission Bundles
 *
 * Defines and manages named collections of permissions (bundles) that can be
 * granted together. Bundles simplify permission management by grouping
 * related permissions that are commonly assigned together.
 */

import { PERMISSIONS } from "./permissions-manager";
import { connectDB } from "./db";
import { logger } from "./error-logger";

// Collection name for permission bundles
const COLLECTION_NAME = "permissionBundles";

/**
 * Get all permission bundles
 * @returns {Promise<Array>} Array of permission bundle objects
 */
export async function getAllBundles() {
  try {
    const db = await connectDB();
    const bundles = await db.collection(COLLECTION_NAME).find({}).toArray();
    return bundles;
  } catch (error) {
    logger.error("Error fetching permission bundles", { error });
    throw error;
  }
}

/**
 * Get a permission bundle by ID
 * @param {String} id Bundle ID
 * @returns {Promise<Object>} The bundle object
 */
export async function getBundle(id) {
  try {
    const db = await connectDB();
    return await db.collection(COLLECTION_NAME).findOne({ _id: id });
  } catch (error) {
    logger.error("Error fetching permission bundle", { id, error });
    throw error;
  }
}

/**
 * Create a new permission bundle
 * @param {Object} bundle Bundle object with name, description, and permissions
 * @returns {Promise<Object>} The created bundle
 */
export async function createBundle(bundle) {
  const { name, description, permissions } = bundle;

  if (!name || !Array.isArray(permissions)) {
    throw new Error("Bundle requires a name and permissions array");
  }

  try {
    const db = await connectDB();

    // Validate all permissions exist
    const invalidPermissions = permissions.filter((p) => {
      // Check if permission exists in the PERMISSIONS object (flattened)
      return !Object.values(PERMISSIONS).some((domain) =>
        Object.values(domain).includes(p)
      );
    });

    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(", ")}`);
    }

    const newBundle = {
      name,
      description: description || "",
      permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(newBundle);
    return { ...newBundle, _id: result.insertedId };
  } catch (error) {
    logger.error("Error creating permission bundle", { bundle, error });
    throw error;
  }
}

/**
 * Update an existing permission bundle
 * @param {String} id Bundle ID
 * @param {Object} updates Updates to apply to the bundle
 * @returns {Promise<Object>} The updated bundle
 */
export async function updateBundle(id, updates) {
  try {
    const db = await connectDB();

    // If updating permissions, validate they exist
    if (updates.permissions) {
      const invalidPermissions = updates.permissions.filter((p) => {
        return !Object.values(PERMISSIONS).some((domain) =>
          Object.values(domain).includes(p)
        );
      });

      if (invalidPermissions.length > 0) {
        throw new Error(
          `Invalid permissions: ${invalidPermissions.join(", ")}`
        );
      }
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await db
      .collection(COLLECTION_NAME)
      .updateOne({ _id: id }, { $set: updateData });

    return await getBundle(id);
  } catch (error) {
    logger.error("Error updating permission bundle", { id, updates, error });
    throw error;
  }
}

/**
 * Delete a permission bundle
 * @param {String} id Bundle ID
 * @returns {Promise<Boolean>} True if deleted successfully
 */
export async function deleteBundle(id) {
  try {
    const db = await connectDB();
    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: id });
    return result.deletedCount === 1;
  } catch (error) {
    logger.error("Error deleting permission bundle", { id, error });
    throw error;
  }
}

/**
 * Apply a bundle's permissions to a user
 * @param {String} userId User ID to apply permissions to
 * @param {String} bundleId Bundle ID to apply
 * @param {Object} options Options like temporary status and expiration
 * @returns {Promise<Object>} Result with granted permissions
 */
export async function applyBundleToUser(userId, bundleId, options = {}) {
  const { temporary = false, expiresAt, reason = "Bundle applied" } = options;

  try {
    const db = await connectDB();

    // Get the bundle
    const bundle = await getBundle(bundleId);
    if (!bundle) {
      throw new Error(`Bundle with ID ${bundleId} not found`);
    }

    // Get the user
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Current permissions
    const currentPermissions = user.permissions || [];
    const permissionMetadata = user.permissionMetadata || {};

    // New permissions (avoid duplicates)
    const newPermissions = [
      ...new Set([...currentPermissions, ...bundle.permissions]),
    ];

    // Update metadata for each new permission
    const now = new Date();
    const updatedMetadata = { ...permissionMetadata };

    bundle.permissions.forEach((permission) => {
      updatedMetadata[permission] = {
        temporary,
        source: "bundle",
        bundleId,
        bundleName: bundle.name,
        reason,
        grantedAt: now,
        ...(temporary && expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
      };
    });

    // Update the user
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          permissions: newPermissions,
          permissionMetadata: updatedMetadata,
          updatedAt: now,
        },
      }
    );

    // Log the action
    await db.collection("permissionLogs").insertOne({
      userId,
      action: "bundle_applied",
      bundleId,
      bundleName: bundle.name,
      permissions: bundle.permissions,
      temporary,
      expiresAt: temporary && expiresAt ? new Date(expiresAt) : null,
      reason,
      timestamp: now,
    });

    return {
      success: true,
      bundle,
      grantedPermissions: bundle.permissions,
      user: { id: userId },
    };
  } catch (error) {
    logger.error("Error applying permission bundle to user", {
      userId,
      bundleId,
      options,
      error,
    });
    throw error;
  }
}

/**
 * Get predefined system bundles
 * @returns {Array} Array of default bundle definitions
 */
export function getDefaultBundles() {
  return [
    {
      name: "Basic User",
      description: "Default permissions for regular users",
      permissions: [
        PERMISSIONS.LISTINGS.VIEW_OWN,
        PERMISSIONS.MESSAGES.SEND,
        PERMISSIONS.MESSAGES.RECEIVE,
      ],
    },
    {
      name: "Listing Manager",
      description: "Permissions for managing listings",
      permissions: [
        PERMISSIONS.LISTINGS.VIEW_OWN,
        PERMISSIONS.LISTINGS.VIEW_ALL,
        PERMISSIONS.LISTINGS.CREATE,
        PERMISSIONS.LISTINGS.EDIT_OWN,
        PERMISSIONS.LISTINGS.DELETE_OWN,
      ],
    },
    {
      name: "Full Agent",
      description: "Comprehensive permissions for real estate agents",
      permissions: [
        PERMISSIONS.LISTINGS.VIEW_OWN,
        PERMISSIONS.LISTINGS.VIEW_ALL,
        PERMISSIONS.LISTINGS.CREATE,
        PERMISSIONS.LISTINGS.EDIT_OWN,
        PERMISSIONS.LISTINGS.DELETE_OWN,
        PERMISSIONS.LISTINGS.PUBLISH,
        PERMISSIONS.MESSAGES.SEND,
        PERMISSIONS.MESSAGES.RECEIVE,
        PERMISSIONS.MESSAGES.VIEW_OWN,
        PERMISSIONS.INSPECTIONS.CREATE,
        PERMISSIONS.INSPECTIONS.SCHEDULE,
      ],
    },
    {
      name: "Content Moderator",
      description: "Permissions for content moderation",
      permissions: [
        PERMISSIONS.LISTINGS.VIEW_ALL,
        PERMISSIONS.LISTINGS.APPROVE,
        PERMISSIONS.LISTINGS.FLAG,
        PERMISSIONS.MESSAGES.VIEW_ALL,
      ],
    },
  ];
}

/**
 * Initialize default bundles if they don't exist
 * @returns {Promise<Number>} Number of bundles created
 */
export async function initializeDefaultBundles() {
  try {
    const db = await connectDB();
    const bundles = getDefaultBundles();
    let created = 0;

    for (const bundle of bundles) {
      // Check if bundle with this name already exists
      const existing = await db.collection(COLLECTION_NAME).findOne({
        name: bundle.name,
      });

      if (!existing) {
        await createBundle(bundle);
        created++;
      }
    }

    logger.info(`Initialized ${created} default permission bundles`);
    return created;
  } catch (error) {
    logger.error("Error initializing default permission bundles", { error });
    throw error;
  }
}
