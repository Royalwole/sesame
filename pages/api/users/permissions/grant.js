import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { hasPermission } from "../../../../lib/permissions-manager";
import { PERMISSIONS } from "../../../../lib/permissions-manager";

/**
 * API endpoint for granting permissions to a user
 *
 * Request body:
 * {
 *   userId: string,
 *   permissions: string[]
 * }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get the authenticated user
    const { userId: adminUserId } = getAuth(req);

    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Get the admin user to check permissions
    const adminUser = await clerkClient.users.getUser(adminUserId);

    // Verify the admin has permission to change user roles
    if (!hasPermission(adminUser, PERMISSIONS.USERS.CHANGE_ROLE)) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to manage user permissions",
      });
    }

    // Get request body
    const { userId, permissions } = req.body;

    if (!userId || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: "User ID and permissions array are required",
      });
    }

    // Get target user
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata || {};
    const currentPermissions = currentMetadata.permissions || [];

    // Merge permissions (avoiding duplicates)
    const updatedPermissions = [
      ...new Set([...currentPermissions, ...permissions]),
    ];

    // Update user permissions in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        permissions: updatedPermissions,
        permissionsUpdatedAt: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      success: true,
      permissions: updatedPermissions,
      added: permissions.filter((p) => !currentPermissions.includes(p)),
    });
  } catch (error) {
    console.error("Error granting permissions:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to grant permissions",
    });
  }
}
