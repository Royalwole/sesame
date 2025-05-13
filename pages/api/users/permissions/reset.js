import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { hasPermission } from "../../../../lib/permissions-manager";
import { PERMISSIONS } from "../../../../lib/permissions-manager";

/**
 * API endpoint for resetting permissions to role defaults
 *
 * Request body:
 * {
 *   userId: string
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
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    // Get target user
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata || {};
    const role = currentMetadata.role || "user";

    // Reset permissions by setting the permissions array to empty
    // This will cause the system to use the role default permissions
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        permissions: [], // Empty array means use role defaults
        permissionsUpdatedAt: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      success: true,
      role,
      message: `Permissions reset to defaults for role: ${role}`,
    });
  } catch (error) {
    console.error("Error resetting permissions:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to reset permissions",
    });
  }
}
