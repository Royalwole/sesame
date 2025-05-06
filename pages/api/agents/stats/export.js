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
    const { startDate, endDate } = req.query;

    // Parse dates or use defaults
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
    const end = endDate ? new Date(endDate) : new Date();

    // Get detailed stats
    const stats = await Listing.aggregate([
      {
        $match: {
          agent: agentId,
          createdAt: { $gte: start, $lte: end },
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

    // Calculate summary statistics
    const summary = {
      totalViews: stats.reduce((sum, day) => sum + day.views, 0),
      totalInquiries: stats.reduce((sum, day) => sum + day.inquiries, 0),
      averageViewsPerDay: Math.round(
        stats.reduce((sum, day) => sum + day.views, 0) / stats.length
      ),
      averageInquiriesPerDay: Math.round(
        stats.reduce((sum, day) => sum + day.inquiries, 0) / stats.length
      ),
      peakViews: Math.max(...stats.map((day) => day.views)),
      peakInquiries: Math.max(...stats.map((day) => day.inquiries)),
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
    };

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=agent-stats-${summary.dateRange.start}-to-${summary.dateRange.end}.csv`
    );

    // Create CSV content
    const csvHeader =
      "Date,Views,Inquiries,Active Listings,Total Listings,Average Price\n";
    const csvRows = stats
      .map(
        (day) =>
          `${day.date},${day.views},${day.inquiries},${day.activeListings},${day.totalListings},${day.avgPrice}`
      )
      .join("\n");

    // Add summary section
    const csvSummary =
      `\n\nSummary Statistics\n` +
      `Total Views,${summary.totalViews}\n` +
      `Total Inquiries,${summary.totalInquiries}\n` +
      `Average Views/Day,${summary.averageViewsPerDay}\n` +
      `Average Inquiries/Day,${summary.averageInquiriesPerDay}\n` +
      `Peak Views,${summary.peakViews}\n` +
      `Peak Inquiries,${summary.peakInquiries}\n`;

    return res.send(csvHeader + csvRows + csvSummary);
  } catch (error) {
    console.error("Error exporting stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to export stats",
    });
  }
}

export default withAuth({
  handler,
  role: "agent",
});
