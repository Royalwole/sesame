import { withAuth } from "../../../../lib/withAuth";
import { validatePermission } from "../../../../lib/permissions-manager";
import { apiResponse } from "../../../../lib/api-response";
import { db } from "../../../../lib/db";
import { ObjectId } from "mongodb";

/**
 * API endpoint for managing permission requests
 *
 * GET: Retrieve permission requests with filters
 * POST: Create a new permission request
 */
async function handler(req, res) {
  try {
    const { user } = req;

    // Check admin permissions for GET (review requests)
    if (
      req.method === "GET" &&
      !validatePermission("ADMIN:MANAGE_PERMISSIONS", user)
    ) {
      return apiResponse(res, 403, {
        error: "You do not have permission to view permission requests",
      });
    }

    // Handle GET request - retrieve permission requests with pagination and filters
    if (req.method === "GET") {
      const {
        status = "pending",
        page = 1,
        limit = 20,
        sort = "createdAt",
        direction = "desc",
        search,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filter = {};

      // Apply status filter (pending, approved, denied)
      if (status && ["pending", "approved", "denied", "all"].includes(status)) {
        if (status !== "all") {
          filter.status = status;
        }
      }

      // Apply search if provided
      if (search) {
        filter.$or = [
          { "user.name": { $regex: search, $options: "i" } },
          { "user.email": { $regex: search, $options: "i" } },
          { permission: { $regex: search, $options: "i" } },
          { justification: { $regex: search, $options: "i" } },
        ];
      }

      // Create sort configuration
      const sortConfig = {};
      if (sort) {
        sortConfig[sort] = direction === "asc" ? 1 : -1;
      } else {
        sortConfig.createdAt = -1; // Default sort by created date desc
      }

      // Get total count for pagination
      const total = await db
        .collection("permissionRequests")
        .countDocuments(filter);

      // Get the requests
      const requests = await db
        .collection("permissionRequests")
        .find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Build pagination info
      const totalPages = Math.ceil(total / parseInt(limit));
      const currentPage = parseInt(page);

      return apiResponse(res, 200, {
        success: true,
        requests,
        pagination: {
          total,
          totalPages,
          currentPage,
          limit: parseInt(limit),
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      });
    }

    // Handle POST request - create a permission request (for users to request permissions)
    if (req.method === "POST") {
      const {
        permission,
        bundleId,
        justification,
        resourceId,
        resourceType,
        requestedDuration = "permanent",
        requestedExpiration,
      } = req.body;

      // Validate required fields
      if (!permission && !bundleId) {
        return apiResponse(res, 400, {
          error: "Either permission or bundleId must be provided",
        });
      }

      if (!justification) {
        return apiResponse(res, 400, {
          error: "Justification is required",
        });
      }

      // Validate temporary duration has expiration date
      if (requestedDuration === "temporary" && !requestedExpiration) {
        return apiResponse(res, 400, {
          error:
            "Expiration date is required for temporary permission requests",
        });
      }

      // Create user reference
      const userRef = {
        id: user.id,
        name: user.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : user.name || user.username || "Unknown User",
        email: user.emailAddresses?.[0]?.emailAddress || user.email || "",
        role: user.publicMetadata?.role || "user",
      };

      // If bundleId is provided, validate it exists
      if (bundleId) {
        const bundle = await db.collection("permissionBundles").findOne({
          _id: new ObjectId(bundleId),
        });

        if (!bundle) {
          return apiResponse(res, 404, {
            error: "Permission bundle not found",
          });
        }
      }

      // Create the request
      const newRequest = {
        user: userRef,
        permission: permission || null,
        bundleId: bundleId ? new ObjectId(bundleId) : null,
        justification,
        resourceId: resourceId || null,
        resourceType: resourceType || null,
        requestedDuration,
        requestedExpiration:
          requestedDuration === "temporary"
            ? new Date(requestedExpiration)
            : null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db
        .collection("permissionRequests")
        .insertOne(newRequest);

      return apiResponse(res, 201, {
        success: true,
        message: "Permission request submitted successfully",
        requestId: result.insertedId,
      });
    }

    // Method not allowed
    return apiResponse(res, 405, {
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Error handling permission requests:", error);
    return apiResponse(res, 500, {
      error: "An error occurred while processing your request",
    });
  }
}

export default withAuth(handler);
