import { withApiAuthRequired } from "@clerk/nextjs";
import User from "../../../models/User";
import { connectDB } from "../../../lib/db"; // Fix import to use named export
import { getRole, isAdmin } from "../../../lib/role-management";

/**
 * Admin API endpoint for looking up users
 * Searches by email, name, or ID
 */
async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    // Get current user and validate admin role
    const adminUser = req.user;
    if (!adminUser || !isAdmin(adminUser)) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized: Admin access required",
      });
    }

    // Get query parameter
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    await connectDB();

    // Search for user by email, name, ID, or clerkId
    const user = await User.findOne({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { clerkId: query },
        { _id: query.match(/^[0-9a-fA-F]{24}$/) ? query : null },
      ],
    })
      .select("name email role clerkId approved createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("User lookup API error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Export with Clerk authentication
export default withApiAuthRequired(handler);
