import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only endpoint" });
  }

  let dbConnection = false;

  try {
    // Get auth directly from Clerk
    const auth = getAuth(req);

    if (!auth?.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const clerkId = auth.userId;

    await connectDB();
    dbConnection = true;

    // Find user in database
    const user = await User.findOne({ clerkId }).lean();

    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    // Return detailed user role information for debugging
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        approved: user.approved,
        roleDetails: {
          isAgent: user.role === "agent" || user.role === "agent_pending",
          isApprovedAgent: user.role === "agent" && user.approved,
          isPendingAgent: user.role === "agent_pending",
          isAdmin: user.role === "admin",
        },
      },
      message: "User agent status retrieved successfully",
    });
  } catch (error) {
    console.error("Error in check-agent-status API:", error);
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
