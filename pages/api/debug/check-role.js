import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { ROLES } from "../../../lib/role-management";

/**
 * Debug endpoint to check a user's role data in both Clerk and MongoDB
 * This helps diagnose role assignment issues
 */
export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let dbConnection = false;

  try {
    // Get authentication info from Clerk
    const auth = getAuth(req);
    const userId = auth?.userId;

    // Not authenticated
    if (!userId) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        message: "Not authenticated",
      });
    }

    // Get Clerk user data
    const clerkUser = await clerkClient.users.getUser(userId);

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Find user in database
    const dbUser = await User.findOne({ clerkId: userId }).lean();

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
      userId: userId,
      clerk: {
        exists: !!clerkUser,
        role: clerkRole,
        approved: clerkApproved,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
        firstName: clerkUser?.firstName || null,
        lastName: clerkUser?.lastName || null,
        metadata: clerkUser?.publicMetadata || {},
        emailVerified:
          clerkUser?.emailAddresses?.[0]?.verification?.status === "verified",
      },
      database: {
        exists: !!dbUser,
        role: dbRole,
        approved: dbApproved,
        email: dbUser?.email || null,
        firstName: dbUser?.firstName || null,
        lastName: dbUser?.lastName || null,
      },
      roleMatch: rolesMatch,
      approvalMatch: approvalMatch,
      isConsistent: rolesMatch && approvalMatch,
      recommendedDashboard:
        dbRole === ROLES.ADMIN
          ? "/dashboard/admin"
          : dbRole === ROLES.AGENT || dbRole === ROLES.AGENT_PENDING
            ? "/dashboard/agent"
            : "/dashboard/user",
    };

    return res.status(200).json({
      success: true,
      roleInfo,
    });
  } catch (error) {
    console.error("Error checking role:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
