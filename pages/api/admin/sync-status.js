import { requireAdmin } from "../../../middlewares/authMiddleware";
import { connectDB } from "../../../lib/db";
import User from "../../../models/User";

/**
 * API endpoint to retrieve information about the last synchronization between Clerk and MongoDB
 * This endpoint helps admins monitor the sync process and status
 *
 * GET /api/admin/sync-status - Get information about the last synchronization
 */
async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "Only GET requests are supported",
    });
  }

  try {
    await connectDB();

    // Find the most recently synced user to get the latest sync timestamp
    const lastSyncedUser = await User.findOne(
      { "clerkSyncInfo.lastSynced": { $exists: true } },
      { clerkSyncInfo: 1 }
    )
      .sort({ "clerkSyncInfo.lastSynced": -1 })
      .limit(1)
      .lean();

    // Get counts of users by role
    const usersByRole = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Get count of users with sync errors
    const syncErrorCount = await User.countDocuments({
      "clerkSyncInfo.syncStatus": "error",
      isDeleted: { $ne: true },
    });

    // Get user count by sync status
    const syncStats = await User.aggregate([
      {
        $match: {
          "clerkSyncInfo.syncStatus": { $exists: true },
          isDeleted: { $ne: true },
        },
      },
      { $group: { _id: "$clerkSyncInfo.syncStatus", count: { $sum: 1 } } },
    ]);

    // Get total number of users
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });

    // Get users synced in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentlySyncedCount = await User.countDocuments({
      "clerkSyncInfo.lastSynced": { $gte: oneDayAgo },
      isDeleted: { $ne: true },
    });

    // Format sync status data
    const syncStatusMap = syncStats.reduce((acc, stat) => {
      acc[stat._id || "unknown"] = stat.count;
      return acc;
    }, {});

    // Format role counts
    const roleCounts = usersByRole.reduce((acc, role) => {
      acc[role._id || "unknown"] = role.count;
      return acc;
    }, {});

    // Format the last sync information
    let lastSync = null;
    if (lastSyncedUser?.clerkSyncInfo?.lastSynced) {
      // Find the last batch sync (not individual user sync)
      const lastBatchSync = await User.findOne(
        {
          "clerkSyncInfo.syncHistory.source": "batch",
          isDeleted: { $ne: true },
        },
        { "clerkSyncInfo.syncHistory": 1 }
      )
        .sort({ "clerkSyncInfo.syncHistory.date": -1 })
        .limit(1)
        .lean();

      // Get counts from the last batch operation
      let createdUsers = 0;
      let updatedUsers = 0;
      let failedUsers = 0;

      if (lastBatchSync) {
        // Get the latest batch sync record
        const syncRecord = lastBatchSync.clerkSyncInfo?.syncHistory
          .filter((record) => record.source === "batch")
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (syncRecord) {
          try {
            const recordData = JSON.parse(syncRecord.data || "{}");
            createdUsers = recordData.created || 0;
            updatedUsers = recordData.updated || 0;
            failedUsers = recordData.failed || 0;
          } catch (e) {
            console.error("Error parsing sync record data:", e);
          }
        }
      }

      lastSync = {
        date: lastSyncedUser.clerkSyncInfo.lastSynced,
        status: lastSyncedUser.clerkSyncInfo.syncStatus,
        totalUsers,
        createdUsers,
        updatedUsers,
        failedUsers,
      };
    }

    // Return the results
    return res.status(200).json({
      success: true,
      lastSync,
      stats: {
        total: totalUsers,
        byRole: roleCounts,
        syncStatus: syncStatusMap,
        syncErrors: syncErrorCount,
        recentlySynced: recentlySyncedCount,
      },
    });
  } catch (error) {
    console.error("Error in sync-status endpoint:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Protect this endpoint - only admins can access it
export default requireAdmin(handler);
