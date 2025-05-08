import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { ROLES } from "../../../lib/role-management";
import { requireAdmin } from "../../../middlewares/authMiddleware";

/**
 * Debug endpoint to check user role information across systems
 * Only accessible by admins for troubleshooting role inconsistencies
 */
async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let dbConnection = false;
  let targetUserId = req.query.userId;

  // If no userId provided, use the requesting admin's ID
  if (!targetUserId) {
    const auth = getAuth(req);
    targetUserId = auth.userId;
  }

  try {
    // Connect to database
    await connectDB();
    dbConnection = true;

    // Fetch user data from Clerk
    const clerkUser = await clerkClient.users.getUser(targetUserId);

    // Find user in database
    const dbUser = await User.findOne({ clerkId: targetUserId }).lean();

    // Check if user exists in both systems
    const clerkExists = !!clerkUser;
    const dbExists = !!dbUser;

    // Compare role information
    const clerkRole = clerkUser?.publicMetadata?.role || "none";
    const dbRole = dbUser?.role || "none";
    const rolesMatch = clerkRole === dbRole;

    // Compare approval state
    const clerkApproved = clerkUser?.publicMetadata?.approved === true;
    const dbApproved = dbUser?.approved === true;
    const approvalMatch = clerkApproved === dbApproved;

    // Get all available information
    const roleInfo = {
      userId: targetUserId,
      clerk: {
        exists: clerkExists,
        role: clerkRole,
        approved: clerkApproved,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
        firstName: clerkUser?.firstName || null,
        lastName: clerkUser?.lastName || null,
        metadata: clerkUser?.publicMetadata || {},
      },
      database: {
        exists: dbExists,
        role: dbRole,
        approved: dbApproved,
        email: dbUser?.email || null,
        firstName: dbUser?.firstName || null,
        lastName: dbUser?.lastName || null,
      },
      roleMatch: rolesMatch,
      approvalMatch: approvalMatch,
      isConsistent: rolesMatch && approvalMatch,
      possibleFixActions:
        !rolesMatch || !approvalMatch
          ? [
              {
                name: "Sync DB to Clerk",
                endpoint: "/api/users/sync-to-clerk?userId=" + targetUserId,
              },
              {
                name: "Sync Clerk to DB",
                endpoint: "/api/users/sync-from-clerk?userId=" + targetUserId,
              },
            ]
          : [],
    };

    return res.status(200).json({
      success: true,
      roleInfo,
    });
  } catch (error) {
    console.error("Role debug error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    // Close database connection
    if (dbConnection) {
      await disconnectDB();
    }
  }
}

// Only allow access to admins
export default requireAdmin(handler);
