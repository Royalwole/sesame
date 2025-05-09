import { connectDB, disconnectDB } from "../../../lib/db";
import { requireAuth } from "../../../middlewares/authMiddleware";
import Favorite from "../../../models/Favorite";
import Inspection from "../../../models/Inspection";

/**
 * API handler to fetch all relevant user dashboard data
 * Retrieves favorites and inspections for the current user
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();
    const userId = req.user.id; // User ID from the auth middleware

    // Fetch user's favorite listings
    const favorites = await Favorite.getUserFavourites(userId, {
      limit: 10, // Limit to 10 most recent favorites
      populate: true,
    });

    // Fetch user's upcoming inspections
    const inspections = await Inspection.find({
      user: userId,
      date: { $gte: new Date() }, // Only future inspections
    })
      .sort({ date: 1 }) // Sort by date ascending (soonest first)
      .limit(5) // Limit to 5 upcoming inspections
      .populate("listing", "title images address city state price")
      .populate("agent", "name email phone photo");

    await disconnectDB();

    return res.status(200).json({
      success: true,
      data: {
        favorites,
        inspections,
      },
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    await disconnectDB();

    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

export default requireAuth(handler);
