import { connectDB, disconnectDB } from "../../../lib/db";
import { requireAdmin } from "../../../middlewares/authMiddleware";
import User from "../../../models/User";
import Listing from "../../../models/Listing";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get active agents count (approved agents)
    const activeAgents = await User.countDocuments({
      role: "agent",
      approved: true,
    });

    // Get active listings count
    const activeListings = await Listing.countDocuments({
      status: "published",
    });

    // Get pending reviews (listings pending approval)
    const pendingReviews = await Listing.countDocuments({
      status: "pending",
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeAgents,
        activeListings,
        pendingReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({
      error: "Failed to fetch admin statistics",
      message: error.message,
    });
  } finally {
    await disconnectDB();
  }
}

export default requireAdmin(handler);
