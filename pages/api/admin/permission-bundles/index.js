import { withAuth } from "../../../../lib/withAuth";
import { validatePermission } from "../../../../lib/permissions-manager";
import { apiResponse } from "../../../../lib/api-response";
import {
  getAllBundles,
  createBundle,
  initializeDefaultBundles,
} from "../../../../lib/permission-bundles";
import { ObjectId } from "mongodb";

/**
 * API endpoint for managing permission bundles
 *
 * GET: Retrieve all permission bundles
 * POST: Create a new permission bundle
 */
async function handler(req, res) {
  try {
    const { user } = req;

    // Check admin permission
    if (!validatePermission("ADMIN:MANAGE_PERMISSIONS", user)) {
      return apiResponse(res, 403, {
        error: "You do not have permission to manage permission bundles",
      });
    }

    // Handle GET request - retrieve all bundles
    if (req.method === "GET") {
      const bundles = await getAllBundles();
      return apiResponse(res, 200, {
        success: true,
        bundles,
      });
    }

    // Handle POST request - create a new bundle
    if (req.method === "POST") {
      const { name, description, permissions } = req.body;

      // Validate required fields
      if (!name || !Array.isArray(permissions)) {
        return apiResponse(res, 400, {
          error: "Name and permissions array are required",
        });
      }

      try {
        const newBundle = await createBundle({
          name,
          description: description || "",
          permissions,
        });

        return apiResponse(res, 201, {
          success: true,
          message: "Permission bundle created successfully",
          bundle: newBundle,
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

    // Handle PUT request - initialize default bundles
    if (req.method === "PUT" && req.query.action === "init-defaults") {
      const count = await initializeDefaultBundles();
      return apiResponse(res, 200, {
        success: true,
        message: `Initialized ${count} default permission bundles`,
        count,
      });
    }

    // Method not allowed
    return apiResponse(res, 405, {
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error handling permission bundles request:", error);
    return apiResponse(res, 500, {
      error: "An error occurred while processing your request",
    });
  }
}

export default withAuth(handler);
