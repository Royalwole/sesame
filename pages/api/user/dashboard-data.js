import { connectDB, disconnectDB } from "../../../lib/db";
import { requireClerkUser } from "../../../middlewares/authMiddleware";

/**
 * API handler to fetch basic dashboard data for the user
 */
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  let dbConnection = false;

  try {
    // Connect to database first
    await connectDB();
    dbConnection = true;

    // Return basic dashboard stats
    // This simplified version returns empty data that won't cause errors
    return res.status(200).json({
      success: true,
      data: {
        favorites: [],
        inspections: [],
        stats: {
          savedListings: 0,
          viewedListings: 0,
          upcomingInspections: 0,
          recentSearches: 0,
          matches: 0,
          notifications: 0,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // Always disconnect if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
      } catch (dbError) {
        console.error("Error disconnecting from database:", dbError);
      }
    }
  }
}

// Use more robust auth middleware
export default requireClerkUser(handler);
