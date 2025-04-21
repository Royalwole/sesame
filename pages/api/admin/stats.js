// API endpoint for admin dashboard statistics
import { withAuth } from "../../../lib/withAuth";
import User from "../../../models/User";
import Listing from "../../../models/Listing";
import connectDB from "../../../lib/db";

/**
 * Gets aggregated statistics for the admin dashboard
 */
async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    // Connect to database
    await connectDB();

    // Count total users
    const userCount = await User.countDocuments();

    // Count agents (both approved and pending)
    const agentCount = await User.countDocuments({
      $or: [{ role: "agent" }, { role: "agent_pending" }],
    });

    // Count active listings
    const listingCount = await Listing.countDocuments({ status: "published" });

    // Count pending review listings
    const pendingReviewCount = await Listing.countDocuments({
      status: "pending",
    });

    // Return the statistics
    return res.status(200).json({
      success: true,
      stats: {
        users: userCount,
        agents: agentCount,
        listings: listingCount,
        pendingReviews: pendingReviewCount,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin statistics",
    });
  }
}

// Export with auth middleware that requires admin role
export default withAuth({
  handler,
  role: "admin",
});
