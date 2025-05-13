import { withAuth } from "../../../../lib/withAuth";
import { connectDB } from "../../../../lib/db";
import PermissionRequest from "../../../../models/PermissionRequest";
import User from "../../../../models/User";
import { PERMISSIONS } from "../../../../lib/permissions-manager";
import { hasPermission } from "../../../../lib/permissions-manager";

/**
 * API endpoint for users to request permissions
 *
 * POST - Create a new permission request
 * GET - Get a user's permission requests
 */
async function handler(req, res) {
  try {
    // Get authenticated user info
    const { user } = req;

    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    await connectDB();

    // Find user in our database
    const dbUser = await User.findOne({ clerkId: user.id });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: "User not found in database",
      });
    }

    switch (req.method) {
      case "POST":
        return handleCreateRequest(req, res, user, dbUser);

      case "GET":
        return handleGetRequests(req, res, user, dbUser);

      default:
        return res.status(405).json({
          success: false,
          error: "Method not allowed",
        });
    }
  } catch (error) {
    console.error("Error handling permission request:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Handle POST request to create a new permission request
 */
async function handleCreateRequest(req, res, user, dbUser) {
  const {
    permission,
    bundleId,
    justification,
    requestedDuration = "permanent",
    requestedExpiration,
    resourceId,
  } = req.body;

  // Validate required fields
  if ((!permission && !bundleId) || !justification) {
    return res.status(400).json({
      success: false,
      error: "Permission/bundle and justification are required",
    });
  }

  // Validate justification length
  if (justification.length < 10) {
    return res.status(400).json({
      success: false,
      error: "Justification must be at least 10 characters",
    });
  }

  // Validate permission exists if one is provided
  if (permission) {
    // Check if it's a valid permission in our system
    let validPermission = false;
    Object.values(PERMISSIONS).forEach((domain) => {
      if (Object.values(domain).includes(permission)) {
        validPermission = true;
      }
    });

    if (!validPermission) {
      return res.status(400).json({
        success: false,
        error: "Invalid permission requested",
      });
    }

    // Check if user already has this permission
    if (hasPermission(user, permission)) {
      return res.status(400).json({
        success: false,
        error: "You already have this permission",
      });
    }
  }

  // Validate expiration date for temporary requests
  if (requestedDuration === "temporary" && !requestedExpiration) {
    return res.status(400).json({
      success: false,
      error: "Expiration date is required for temporary permission requests",
    });
  }

  // Create the request
  try {
    const permissionRequest = new PermissionRequest({
      userId: dbUser._id,
      clerkId: user.id,
      permission: permission || null,
      bundleId: bundleId || null,
      justification,
      requestedDuration,
      requestedExpiration:
        requestedDuration === "temporary"
          ? new Date(requestedExpiration)
          : null,
      resourceId: resourceId || null,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          changedBy: user.id,
          changedAt: new Date(),
          notes: "Request submitted by user",
        },
      ],
    });

    await permissionRequest.save();

    // TODO: Send notification to administrators

    return res.status(201).json({
      success: true,
      message: "Permission request submitted successfully",
      request: {
        id: permissionRequest._id,
        permission: permissionRequest.permission,
        status: permissionRequest.status,
        createdAt: permissionRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating permission request:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create permission request",
    });
  }
}

/**
 * Handle GET request to retrieve user's permission requests
 */
async function handleGetRequests(req, res, user, dbUser) {
  const { status, page = "1", limit = "10" } = req.query;

  const filter = { userId: dbUser._id };

  // Filter by status if provided
  if (status) {
    filter.status = status;
  }

  // Pagination setup
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    // Get total count for pagination
    const total = await PermissionRequest.countDocuments(filter);

    // Get the requests
    const requests = await PermissionRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination details
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      requests,
      pagination: {
        total,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching permission requests:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch permission requests",
    });
  }
}

export default withAuth(handler);
