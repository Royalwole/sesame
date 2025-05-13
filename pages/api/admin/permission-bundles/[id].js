import { withAuth } from "../../../../lib/withAuth";
import { validatePermission } from "../../../../lib/permissions-manager";
import { apiResponse } from "../../../../lib/api-response";
import {
  getBundle,
  updateBundle,
  deleteBundle,
} from "../../../../lib/permission-bundles";

/**
 * API endpoint for managing a specific permission bundle
 *
 * GET: Retrieve a specific bundle
 * PUT: Update a bundle
 * DELETE: Delete a bundle
 */
async function handler(req, res) {
  try {
    const { user } = req;
    const { id } = req.query;

    if (!id) {
      return apiResponse(res, 400, {
        error: "Bundle ID is required",
      });
    }

    // Check admin permission
    if (!validatePermission("ADMIN:MANAGE_PERMISSIONS", user)) {
      return apiResponse(res, 403, {
        error: "You do not have permission to manage permission bundles",
      });
    }

    // Get the bundle to check if it exists
    const bundle = await getBundle(id);
    if (!bundle && req.method !== "POST") {
      return apiResponse(res, 404, {
        error: "Permission bundle not found",
      });
    }

    // Handle GET request - retrieve a specific bundle
    if (req.method === "GET") {
      return apiResponse(res, 200, {
        success: true,
        bundle,
      });
    }

    // Handle PUT request - update a bundle
    if (req.method === "PUT") {
      const { name, description, permissions } = req.body;
      const updates = {};

      // Only include fields that need to be updated
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (permissions !== undefined) updates.permissions = permissions;

      // Validate at least one field is provided
      if (Object.keys(updates).length === 0) {
        return apiResponse(res, 400, {
          error: "No update fields provided",
        });
      }

      try {
        const updatedBundle = await updateBundle(id, updates);

        return apiResponse(res, 200, {
          success: true,
          message: "Permission bundle updated successfully",
          bundle: updatedBundle,
        });
      } catch (error) {
        if (error.message.includes("Invalid permissions")) {
          return apiResponse(res, 400, {
            error: error.message,
          });
        }
        throw error;
      }
    }

    // Handle DELETE request - delete a bundle
    if (req.method === "DELETE") {
      const result = await deleteBundle(id);

      if (result) {
        return apiResponse(res, 200, {
          success: true,
          message: "Permission bundle deleted successfully",
        });
      } else {
        return apiResponse(res, 404, {
          error: "Bundle not found or could not be deleted",
        });
      }
    }

    // Method not allowed
    return apiResponse(res, 405, {
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error handling permission bundle request:", error);
    return apiResponse(res, 500, {
      error: "An error occurred while processing your request",
    });
  }
}

export default withAuth(handler);
