import { connectDB, disconnectDB } from "../../../lib/db";
import { requireAuth } from "../../../middlewares/authMiddleware";

/**
 * API handler to fetch user's inspection appointments
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
    console.log("Inspections API - Auth:", req.auth);

    // Parse query parameters
    const limit = parseInt(req.query.limit) || 5;
    const futureOnly = req.query.futureOnly === "true";

    console.log(
      `Inspections API - Params: limit=${limit}, futureOnly=${futureOnly}`
    );

    // Connect to database first
    await connectDB();
    dbConnection = true;

    // Return empty inspections list (simplified version)
    // This prevents errors while you're debugging the real functionality
    return res.status(200).json({
      success: true,
      data: {
        inspections: [],
      },
    });
  } catch (error) {
    console.error("Inspections fetch error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching user inspections",
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
