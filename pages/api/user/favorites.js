import { connectDB, disconnectDB } from "../../../lib/db";
import { requireAuth } from "../../../middlewares/authMiddleware";

/**
 * API handler to fetch user's favorite listings
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
    // Log auth info for debugging
    console.log("Favorites API - Auth:", req.auth);

    // Connect to database first
    await connectDB();
    dbConnection = true;

    // Return empty favorites list (simplified version)
    // This prevents errors while you're debugging the real functionality
    return res.status(200).json({
      success: true,
      data: {
        favorites: [],
      },
    });
  } catch (error) {
    console.error("Favorites fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching user favorites",
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

// Use basic auth middleware
export default requireAuth(handler);
