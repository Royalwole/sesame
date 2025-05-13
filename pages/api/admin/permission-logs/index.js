import { requireAdmin } from "../../../../middlewares/authMiddleware";
import { connectDB } from "../../../../lib/db";
import { ObjectId } from "mongodb";

/**
 * API endpoint for accessing permission audit logs
 *
 * GET - Get permission logs with filtering options
 *
 * Protected - requires admin access with appropriate permissions
 */
async function handler(req, res) {
  try {
    // Only allow GET method
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Connect to the database
    const db = await connectDB();

    // Parse query parameters
    const {
      userId,
      adminId,
      permission,
      action,
      from,
      to,
      bundleId,
      page = "1",
      limit = "20",
      sortBy = "timestamp",
      sortOrder = "desc",
    } = req.query;

    // Build query filter
    const filter = {};

    if (userId) {
      try {
        filter.userId = new ObjectId(userId);
      } catch {
        filter.userId = userId;
      }
    }

    if (adminId) {
      filter.adminId = adminId;
    }

    if (permission) {
      filter["details.permission"] = permission;
    }

    if (action) {
      filter.action = action;
    }

    if (bundleId) {
      filter["details.bundleId"] = bundleId;
    }

    // Date range filtering
    if (from || to) {
      filter.timestamp = {};

      if (from) {
        filter.timestamp.$gte = new Date(from);
      }

      if (to) {
        filter.timestamp.$lte = new Date(to);
      }
    }

    // Parse pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Sort direction
    const sort = {};
    sort[sortBy || "timestamp"] = sortOrder === "asc" ? 1 : -1;

    // Get total count for pagination
    const total = await db.collection("permissionLogs").countDocuments(filter);

    // Get logs
    const logs = await db
      .collection("permissionLogs")
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Add user and admin info to logs
    const populatedLogs = [];

    for (const log of logs) {
      try {
        // Get user info if available
        let userInfo = null;
        if (log.userId) {
          const user = await db
            .collection("users")
            .findOne(
              { _id: log.userId },
              { projection: { firstName: 1, lastName: 1, email: 1 } }
            );

          if (user) {
            userInfo = {
              id: log.userId,
              name:
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : "Unknown",
              email: user.email || "No email",
            };
          }
        }

        // Get admin info if available
        let adminInfo = null;
        if (log.adminId) {
          const admin = await db
            .collection("users")
            .findOne(
              { clerkId: log.adminId },
              { projection: { firstName: 1, lastName: 1, email: 1 } }
            );

          if (admin) {
            adminInfo = {
              id: log.adminId,
              name:
                admin.firstName && admin.lastName
                  ? `${admin.firstName} ${admin.lastName}`
                  : "Unknown",
              email: admin.email || "No email",
            };
          }
        }

        // Add to populated logs
        populatedLogs.push({
          ...log,
          user: userInfo,
          admin: adminInfo,
        });
      } catch (error) {
        console.error("Error populating log entry:", error);
        populatedLogs.push(log);
      }
    }

    // Return logs with pagination metadata
    return res.status(200).json({
      success: true,
      logs: populatedLogs,
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
    console.error("Error fetching permission logs:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

// Protect with admin middleware
export default requireAdmin(handler);
