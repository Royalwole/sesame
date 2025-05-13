import { withAuth } from "../../../../lib/withAuth";
import { validatePermission } from "../../../../lib/permissions-manager";
import {
  PERMISSIONS,
  DOMAINS,
  DEFAULT_ROLE_PERMISSIONS,
} from "../../../../lib/permissions-manager";
import { apiResponse } from "../../../../lib/api-response";

/**
 * API endpoint for listing all available permissions in a format suitable for admin interfaces
 *
 * GET /api/admin/permissions/available
 *
 * Protected - requires admin access with ADMIN:MANAGE_PERMISSIONS permission
 *
 * Returns:
 * - List of all permissions organized by domain with metadata
 * - Each permission includes id, name, description, and domain
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return apiResponse(res, 405, {
      error: "Method not allowed",
    });
  }

  try {
    const { user } = req;

    // Check if user has permission to manage permissions
    if (!validatePermission("ADMIN:MANAGE_PERMISSIONS", user)) {
      return apiResponse(res, 403, {
        error: "You don't have permission to access permission data",
      });
    }

    // Transform the permissions object into a flat array with metadata
    const permissionsList = [];

    Object.entries(PERMISSIONS).forEach(([domainKey, domainPermissions]) => {
      Object.entries(domainPermissions).forEach(
        ([permissionName, permissionId]) => {
          // Create a user-friendly name and description
          const name = permissionName
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ");

          const action = permissionId.split(":")[1];
          let description = `Permission to ${action.replace(/_/g, " ")}`;

          // Add domain-specific context to the description
          const domain = domainKey.charAt(0) + domainKey.slice(1).toLowerCase();
          if (action.includes("own")) {
            description += ` your own ${domain.toLowerCase()} resources`;
          } else if (action.includes("all") || action.includes("any")) {
            description += ` all ${domain.toLowerCase()} resources`;
          } else {
            description += ` in the ${domain} system`;
          }

          permissionsList.push({
            id: permissionId,
            name: `${domain}: ${name}`,
            description,
            domain: domainKey,
            action: permissionName,
          });
        }
      );
    });

    // Group permissions by domain for easier UI rendering
    const permissionsByDomain = Object.keys(DOMAINS).reduce((acc, domain) => {
      acc[domain] = permissionsList.filter((p) => p.domain === domain);
      return acc;
    }, {});

    // Calculate which roles have which permissions
    const rolePermissions = {};
    Object.entries(DEFAULT_ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      rolePermissions[role] = permissions.map((p) => ({
        id: p,
        name: permissionsList.find((item) => item.id === p)?.name || p,
      }));
    });

    return apiResponse(res, 200, {
      success: true,
      totalCount: permissionsList.length,
      permissions: permissionsList,
      permissionsByDomain,
      domains: Object.keys(DOMAINS).map((key) => ({
        id: key,
        name: key.charAt(0) + key.slice(1).toLowerCase(),
      })),
      rolePermissions,
    });
  } catch (error) {
    console.error("Error generating permissions list:", error);
    return apiResponse(res, 500, {
      error: error.message || "Failed to generate permissions list",
    });
  }
}

export default withAuth(handler);
