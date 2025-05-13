import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { apiResponse } from "../../../lib/api-response";

/**
 * API handler to fetch all users for admin management
 */
export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return apiResponse(res, 405, { error: "Method not allowed" });
  }

  // Track database connection
  let dbConnection = false;

  try {
    // Get authenticated user from Clerk
    const auth = getAuth(req);

    if (!auth?.userId) {
      return apiResponse(res, 401, { error: "Unauthorized" });
    }

    // Connect to database
    try {
      await connectDB();
      dbConnection = true;
    } catch (connectionError) {
      console.error(
        "Admin users API: Database connection error:",
        connectionError
      );
      return apiResponse(res, 503, {
        error: "Database connection failed",
        message: "Unable to connect to the database. Please try again later.",
      });
    }

    // Get the admin user first to verify they have admin role
    const adminUser = await User.findOne({ clerkId: auth.userId });

    if (!adminUser || adminUser.role !== "admin") {
      return apiResponse(res, 403, {
        error: "Access forbidden. Admin privileges required.",
      });
    }

    // Fetch all users
    const users = await User.find(
      {},
      {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        role: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

    return apiResponse(
      res,
      200,
      {
        users,
        count: users.length,
      },
      "Users retrieved successfully"
    );
  } catch (error) {
    console.error("Admin users API error:", error);
    return apiResponse(res, 500, {
      error: "Internal server error",
      message: error.message,
    });
  } finally {
    // Always disconnect from database if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
      } catch (disconnectError) {
        console.error("Error disconnecting from database:", disconnectError);
      }
    }
  }
}
