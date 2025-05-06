import { withAuth } from "../../../../lib/withAuth";
import { connectDB } from "../../../../lib/db";
import Listing from "../../../../models/Listing";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();
    const agentId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    const offset = parseInt(req.query.offset) || 0;

    // Calculate date ranges
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Get daily stats
    const stats = await Listing.aggregate([
      {
        $match: {
          agent: agentId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          views: { $sum: "$views" },
          inquiries: { $sum: "$inquiries" },
          activeListings: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          totalListings: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
          views: 1,
          inquiries: 1,
          activeListings: 1,
          totalListings: 1,
          avgPrice: { $round: ["$avgPrice", 2] },
        },
      },
    ]);

    // Fill in missing days with zero values
    const filledStats = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const existingStat = stats.find((stat) => stat.date === dateStr);

      filledStats.push(
        existingStat || {
          date: dateStr,
          views: 0,
          inquiries: 0,
          activeListings: 0,
          totalListings: 0,
          avgPrice: 0,
        }
      );

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      data: filledStats,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching historical stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch historical stats",
    });
  }
}

export default withAuth({
  handler,
  role: "agent",
});
