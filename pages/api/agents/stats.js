import { withAuth } from "../../../lib/withAuth";
import { connectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();

    // Get the agent's ID from the authenticated user
    const agentId = req.user._id;

    // Get aggregate stats for all listings
    const aggregateStats = await Listing.aggregate([
      { $match: { agent: agentId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalInquiries: { $sum: "$inquiries" },
        },
      },
    ]);

    // Process the stats
    const stats = {
      activeListings: 0,
      pendingListings: 0,
      totalViews: 0,
      totalInquiries: 0,
    };

    aggregateStats.forEach((stat) => {
      if (stat._id === "active") {
        stats.activeListings = stat.count;
      } else if (stat._id === "pending") {
        stats.pendingListings = stat.count;
      }
      stats.totalViews += stat.totalViews || 0;
      stats.totalInquiries += stat.totalInquiries || 0;
    });

    // Return processed stats
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch agent statistics",
    });
  }
}

// Export with auth middleware that requires agent role
export default withAuth({
  handler,
  role: "agent",
});
