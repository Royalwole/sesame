import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";

// Utility API endpoint to clear any server-side caches for listings
export default async function handler(req, res) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      error: "Development only endpoint",
    });
  }

  let dbConnection = false;

  try {
    const auth = getAuth(req);

    // Check for admin access in development
    if (auth?.userId) {
      // Connect to DB to verify admin status
      await connectDB();
      dbConnection = true;

      const user = await User.findOne({ clerkId: auth.userId }).lean();
      if (!user || user.role !== "admin") {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admins can purge caches",
        });
      }
    }

    // In a real-world scenario, you would clear Redis caches or other caching layers here
    // For our case, we're just simulating a cache purge with a log
    console.log(
      `[Cache Purge] Manual cache purge requested at ${new Date().toISOString()}`
    );

    // Set headers to clear client-side caches
    res.setHeader("Clear-Site-Data", '"cache", "storage"');

    return res.status(200).json({
      success: true,
      message: "Cache purged successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cache Purge] Error:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
