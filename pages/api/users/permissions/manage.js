import { withAuth } from "../../../../lib/withAuth";
import {
  validatePermission,
  PERMISSIONS,
} from "../../../../lib/permissions-manager";
import { db } from "../../../../lib/db";
import { apiResponse } from "../../../../lib/api-response";
import { ObjectId } from "mongodb";
import {
  getBundle,
  applyBundleToUser,
} from "../../../../lib/permission-bundles";

/**
 * API endpoint for managing user permissions
 *
 * Actions:
 * - grant: Add a permission to a user
 * - revoke: Remove a permission from a user
 * - reset: Reset user permissions to their role defaults
 * - check: Check if a user has specific permissions
 * - apply_bundle: Apply a permission bundle to a user
 * - revoke_bundle: Revoke all permissions from a bundle
 */
async function handler(req, res) {
  try {
    // Only allow POST requests for modifying permissions
    if (req.method !== "POST") {
      return apiResponse(res, 405, { error: "Method not allowed" });
    }

    const { user: adminUser } = req;

    // Check if the admin user has permission to manage user permissions
    if (!validatePermission("ADMIN:MANAGE_PERMISSIONS", adminUser)) {
      return apiResponse(res, 403, {
        error: "You do not have permission to manage user permissions",
      });
    }

    const {
      userId,
      action,
      permission,
      temporary,
      reason,
      expiration,
      bundleId,
    } = req.body;

    if (!userId || !action) {
      return apiResponse(res, 400, {
        error: "Missing required fields: userId and action",
      });
    }

    // Validate user ID
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (e) {
      return apiResponse(res, 400, { error: "Invalid user ID format" });
    }

    // Get the user from the database
    const usersCollection = db.collection("users");
    const targetUser = await usersCollection.findOne({ _id: userObjectId });

    if (!targetUser) {
      return apiResponse(res, 404, { error: "User not found" });
    }

    // Initialize permissions array if it doesn't exist
    const currentPermissions = targetUser.permissions || [];
    let updatedPermissions = [...currentPermissions];

    const logPermissionChange = async (action, details) => {
      // Log permission changes for audit trail
      await db.collection("permissionLogs").insertOne({
        userId: userObjectId,
        adminId: adminUser.id,
        action,
        details,
        timestamp: new Date(),
        adminEmail: adminUser.emailAddresses?.[0]?.emailAddress || "unknown",
        userEmail: targetUser.email || "unknown",
        environmentInfo: {
          userAgent: req.headers["user-agent"],
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          source: "api",
        },
      });
    };

    switch (action) {
      case "grant":
        if (!permission) {
          return apiResponse(res, 400, {
            error: "Missing required field: permission",
          });
        }

        if (!reason) {
          return apiResponse(res, 400, {
            error: "You must provide a reason for granting this permission",
          });
        }

        // Validate permission exists in the PERMISSIONS object
        let validPermission = false;
        for (const domain of Object.values(PERMISSIONS)) {
          if (Object.values(domain).includes(permission)) {
            validPermission = true;
            break;
          }
        }

        if (!validPermission) {
          return apiResponse(res, 400, {
            error: `Invalid permission: ${permission}`,
          });
        }

        // Check if the user already has this permission
        if (currentPermissions.includes(permission)) {
          return apiResponse(res, 400, {
            error: "User already has this permission",
          });
        }

        // Add the permission
        updatedPermissions.push(permission);

        // Add metadata for temporary permissions
        let permissionMetadata = targetUser.permissionMetadata || {};

        if (temporary && expiration) {
          permissionMetadata[permission] = {
            temporary: true,
            expiration: new Date(expiration),
            reason,
            grantedBy: adminUser.id,
            grantedAt: new Date(),
          };
        } else {
          permissionMetadata[permission] = {
            temporary: false,
            reason,
            grantedBy: adminUser.id,
            grantedAt: new Date(),
          };
        }

        // Update the user with new permissions and metadata
        await usersCollection.updateOne(
          { _id: userObjectId },
          {
            $set: {
              permissions: updatedPermissions,
              permissionMetadata,
            },
          }
        );

        // Log the permission change
        await logPermissionChange("grant", {
          permission,
          temporary,
          expiration: temporary ? expiration : null,
          reason,
        });

        return apiResponse(res, 200, {
          success: true,
          message: `Permission ${permission} granted successfully`,
          permissions: updatedPermissions,
        });

      case "revoke":
        if (!permission) {
          return apiResponse(res, 400, {
            error: "Missing required field: permission",
          });
        }

        // Check if the user has this permission
        if (!currentPermissions.includes(permission)) {
          return apiResponse(res, 400, {
            error: "User does not have this permission",
          });
        }

        // Remove the permission
        updatedPermissions = updatedPermissions.filter((p) => p !== permission);

        // Update permission metadata
        let updatedMetadata = targetUser.permissionMetadata || {};
        if (updatedMetadata[permission]) {
          // Mark as revoked but keep the history
          updatedMetadata[permission].revoked = true;
          updatedMetadata[permission].revokedBy = adminUser.id;
          updatedMetadata[permission].revokedAt = new Date();
        }

        // Update the user
        await usersCollection.updateOne(
          { _id: userObjectId },
          {
            $set: {
              permissions: updatedPermissions,
              permissionMetadata: updatedMetadata,
            },
          }
        );

        // Log the permission change
        await logPermissionChange("revoke", { permission });

        return apiResponse(res, 200, {
          success: true,
          message: `Permission ${permission} revoked successfully`,
          permissions: updatedPermissions,
        });

      case "reset":
        // Reset to default permissions based on user's role
        const userRole = targetUser.role || "user";

        // Get default permissions for this role from your role management system
        // This should be replaced with your actual implementation
        const defaultPermissionsForRole =
          await getDefaultPermissionsForRole(userRole);

        // Update the user
        await usersCollection.updateOne(
          { _id: userObjectId },
          {
            $set: {
              permissions: defaultPermissionsForRole,
              permissionMetadata: {}, // Clear permission metadata
            },
          }
        );

        // Log the permission change
        await logPermissionChange("reset", { role: userRole });

        return apiResponse(res, 200, {
          success: true,
          message: `Permissions reset to defaults for role: ${userRole}`,
          permissions: defaultPermissionsForRole,
        });

      case "check":
        const { permissions } = req.body;

        if (!permissions || !Array.isArray(permissions)) {
          return apiResponse(res, 400, { error: "Invalid permissions array" });
        }

        const hasPermissions = permissions.every((p) =>
          currentPermissions.includes(p)
        );

        return apiResponse(res, 200, {
          success: true,
          hasPermissions,
          missingPermissions: permissions.filter(
            (p) => !currentPermissions.includes(p)
          ),
        });

      case "apply_bundle":
        if (!bundleId) {
          return apiResponse(res, 400, {
            error: "Missing required field: bundleId",
          });
        }

        if (!reason) {
          return apiResponse(res, 400, {
            error:
              "You must provide a reason for applying this permission bundle",
          });
        }

        try {
          // Apply the bundle using our utility function
          const result = await applyBundleToUser(userObjectId, bundleId, {
            temporary,
            expiresAt: expiration,
            reason,
            grantedBy: adminUser.id,
          });

          // Log the bundle application
          await logPermissionChange("apply_bundle", {
            bundleId,
            bundleName: result.bundle.name,
            permissions: result.grantedPermissions,
            temporary,
            expiration: temporary ? expiration : null,
            reason,
          });

          return apiResponse(res, 200, {
            success: true,
            message: `Permission bundle "${result.bundle.name}" applied successfully`,
            permissions: result.grantedPermissions,
          });
        } catch (error) {
          return apiResponse(res, 400, {
            error: `Failed to apply bundle: ${error.message}`,
          });
        }

      case "revoke_bundle":
        if (!bundleId) {
          return apiResponse(res, 400, {
            error: "Missing required field: bundleId",
          });
        }

        try {
          // Get the bundle
          const bundle = await getBundle(bundleId);
          if (!bundle) {
            return apiResponse(res, 404, {
              error: "Permission bundle not found",
            });
          }

          // Filter out all permissions from this bundle
          const permissionMetadata = targetUser.permissionMetadata || {};
          const permissionsToRemove = [];

          // Find permissions that were granted from this bundle
          for (const [perm, metadata] of Object.entries(permissionMetadata)) {
            if (
              metadata.source === "bundle" &&
              metadata.bundleId.toString() === bundleId.toString()
            ) {
              permissionsToRemove.push(perm);
            }
          }

          if (permissionsToRemove.length === 0) {
            return apiResponse(res, 400, {
              error: "No permissions from this bundle found on user",
            });
          }

          // Update metadata to mark permissions as revoked
          const updatedMetadata = { ...permissionMetadata };
          permissionsToRemove.forEach((perm) => {
            if (updatedMetadata[perm]) {
              updatedMetadata[perm].revoked = true;
              updatedMetadata[perm].revokedBy = adminUser.id;
              updatedMetadata[perm].revokedAt = new Date();
              updatedMetadata[perm].revocationReason =
                reason || "Bundle revoked";
            }
          });

          // Remove the permissions
          updatedPermissions = updatedPermissions.filter(
            (perm) => !permissionsToRemove.includes(perm)
          );

          // Update the user
          await usersCollection.updateOne(
            { _id: userObjectId },
            {
              $set: {
                permissions: updatedPermissions,
                permissionMetadata: updatedMetadata,
              },
            }
          );

          // Log the bundle revocation
          await logPermissionChange("revoke_bundle", {
            bundleId,
            bundleName: bundle.name,
            permissions: permissionsToRemove,
            reason,
          });

          return apiResponse(res, 200, {
            success: true,
            message: `All permissions from bundle "${bundle.name}" revoked successfully`,
            revokedPermissions: permissionsToRemove,
          });
        } catch (error) {
          return apiResponse(res, 400, {
            error: `Failed to revoke bundle permissions: ${error.message}`,
          });
        }

      default:
        return apiResponse(res, 400, {
          error:
            "Invalid action. Must be grant, revoke, reset, check, apply_bundle, or revoke_bundle",
        });
    }
  } catch (error) {
    console.error("Error managing user permissions:", error);
    return apiResponse(res, 500, {
      error: "Failed to manage user permissions",
    });
  }
}

// Helper function to get default permissions for a role
async function getDefaultPermissionsForRole(role) {
  // This is a placeholder - implement according to your role system
  const rolePermissionsMap = {
    admin: [
      "ADMIN:VIEW_DASHBOARD",
      "ADMIN:MANAGE_USERS",
      "ADMIN:MANAGE_ROLES",
      "ADMIN:MANAGE_PERMISSIONS",
      "LISTINGS:CREATE",
      "LISTINGS:EDIT",
      "LISTINGS:DELETE",
      "LISTINGS:VIEW_ALL",
    ],
    agent: ["LISTINGS:CREATE", "LISTINGS:EDIT", "LISTINGS:VIEW_OWN"],
    user: ["LISTINGS:VIEW_PUBLIC"],
  };

  return rolePermissionsMap[role] || [];
}

export default withAuth(handler);
