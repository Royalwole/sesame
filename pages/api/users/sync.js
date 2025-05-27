import { getSession } from "@clerk/nextjs/server";
import { resilientUserSync } from "../../../lib/resilient-sync";

/**
 * User sync API endpoint with robust error handling and retry logic
 * This endpoint synchronizes user data between Clerk and MongoDB
 */
export default async function handler(req, res) {
  const requestId = `sync_${Math.random().toString(36).substring(2, 10)}`;
  const syncId = req.headers["x-sync-id"] || `manual-${Date.now()}`;

  console.log(`[${requestId}] Starting user sync with syncId: ${syncId}`);

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
    } // Use our improved resilient sync function with retry logic
    const syncStart = Date.now();
    const traceId = `${requestId}-${syncId}`;

    console.log(
      `[${requestId}] Initiating resilient sync for user ${clerkId} with traceId: ${traceId}`
    );

    const syncResult = await resilientUserSync(clerkId, {
      maxRetries: 2,
      retryDelay: 1000,
      traceId: traceId,
    });

    const syncDuration = Date.now() - syncStart;
    console.log(
      `[${requestId}] Sync completed in ${syncDuration}ms with success=${syncResult.success}`
    );

    if (!syncResult.success) {
      console.error(
        `[${requestId}] Sync failed after ${syncResult.attempts} attempts: ${syncResult.error}`
      );

      // Return appropriate status code based on error type
      let statusCode = 500;
      let errorMessage = "Failed to sync user data after multiple attempts";

      if (syncResult.error.includes("User not found")) {
        statusCode = 404;
        errorMessage = "User not found";
      } else if (syncResult.error.includes("rate limit")) {
        statusCode = 429;
        errorMessage = "Too many requests, please try again later";
      } else if (syncResult.error.includes("Database connection failed")) {
        statusCode = 503;
        errorMessage = "Database service temporarily unavailable";
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error:
          process.env.NODE_ENV === "development"
            ? syncResult.error
            : "Synchronization error",
        metrics: syncResult.metrics,
        syncId,
        requestId,
        traceId,
        duration: syncDuration,
        attempts: syncResult.attempts,
      });
    }

    // Check if we have a user from the syncing process
    if (!syncResult.user) {
      throw new Error("User sync returned invalid data");
    } // Return success response with user data and performance metrics
    return res.status(200).json({
      success: true,
      message: "User synced successfully",
      user: syncResult.user.toJSON(),
      listingsUpdated: syncResult.listingsUpdated || 0,
      syncTime: new Date().toISOString(),
      attempts: syncResult.attempts,
      syncId,
      requestId,
      traceId,
      duration: syncDuration,
      performance: syncResult.metrics,
    });
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);

    return res.status(500).json({
      success: false,
      message: "Failed to sync user data",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
      syncId,
      requestId,
    });
  }
}
