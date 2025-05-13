import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import {
  hasPermission,
  PERMISSIONS,
  DOMAINS,
  DEFAULT_ROLE_PERMISSIONS,
} from "../../../../lib/permissions-manager";

/**
 * API endpoint for listing all available permissions
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get the authenticated user
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Get the user to check permissions
    const user = await clerkClient.users.getUser(userId);

    // Verify the user has permission to view the admin dashboard
    if (!hasPermission(user, PERMISSIONS.ADMIN.ACCESS_DASHBOARD)) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to access this resource",
      });
    }

    // Return all permissions organized by domain
    return res.status(200).json({
      success: true,
      domains: DOMAINS,
      permissions: PERMISSIONS,
      defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
    });
  } catch (error) {
    console.error("Error fetching permissions list:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch permissions list",
    });
  }
}
