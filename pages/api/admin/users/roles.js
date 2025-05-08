import { withAuth } from "../../../../lib/withAuth";
import { connectToDatabase } from "../../../../lib/db";
import { apiResponse } from "../../../../lib/api-response";
import User from "../../../../models/User";

/**
 * API handler for fetching and managing user roles
 * GET: List all users with their roles
 * PUT: Update a user's role
 */
async function handler(req, res) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Handle GET request - retrieve users with their roles
    if (req.method === "GET") {
      const searchTerm = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build the query
      let query = {};
      if (searchTerm) {
        query = {
          $or: [
            { email: { $regex: searchTerm, $options: "i" } },
            { name: { $regex: searchTerm, $options: "i" } },
          ],
        };
      }

      // Fetch users with pagination
      const users = await User.find(query, {
        _id: 1,
        email: 1,
        name: 1,
        role: 1,
        createdAt: 1,
        isActive: 1,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const totalUsers = await User.countDocuments(query);

      return apiResponse(res, 200, {
        users,
        pagination: {
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
          page,
          limit,
        },
      });
    }

    // Handle PUT request - update a user's role
    if (req.method === "PUT") {
      const { userId, role } = req.body;

      if (!userId || !role) {
        return apiResponse(res, 400, null, "User ID and role are required");
      }

      // Validate role - must be one of the allowed roles
      const allowedRoles = ["user", "agent", "admin", "moderator"];
      if (!allowedRoles.includes(role)) {
        return apiResponse(res, 400, null, "Invalid role specified");
      }

      // Update user's role
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true, select: "email name role" }
      );

      if (!updatedUser) {
        return apiResponse(res, 404, null, "User not found");
      }

      return apiResponse(res, 200, { user: updatedUser });
    }

    // Handle unsupported HTTP methods
    return apiResponse(res, 405, null, "Method not allowed");
  } catch (error) {
    console.error("User roles API error:", error);
    return apiResponse(
      res,
      500,
      null,
      "Server error while managing user roles"
    );
  }
}

// Protect this API route - only admins can access
export default withAuth({
  handler,
  role: "admin",
  api: true,
});
