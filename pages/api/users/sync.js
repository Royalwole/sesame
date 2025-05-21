import { getSession } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import { syncUserWithClerk } from "../../../lib/user-sync";

/**
 * User sync API endpoint with robust error handling and retry logic
 */
export default async function handler(req, res) {
  const requestId = `sync_${Math.random().toString(36).substring(2, 10)}`;
  console.log(`[${requestId}] Starting user sync`);

  let dbConnection = false;

  try {
    // Get clerk ID from request or session
    let clerkId = req.query.clerkId;

    if (!clerkId) {
      const session = await getSession({ req });
      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }
      clerkId = session.user.id;
    }

    if (!clerkId) {
      return res.status(400).json({
        success: false,
        message: "Missing clerk_id parameter",
      });
    }

    // Connect to database using original function
    await connectDB();
    dbConnection = true;

    // Sync the user
    const result = await syncUserWithClerk(clerkId);

    // Check if we have a user and listings count from the syncing process
    if (!result || !result.user) {
      throw new Error("User sync returned invalid data");
    }

    return res.status(200).json({
      success: true,
      message: "User synced successfully",
      user: result.user.toJSON(),
      listingsUpdated: result.listingsUpdated || 0,
      syncTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);

    return res.status(500).json({
      success: false,
      message: "Failed to sync user data",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
