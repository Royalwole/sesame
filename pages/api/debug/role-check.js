import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";

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

    // Try to connect to database
    try {
      await connectDB();
      dbConnection = true;

      // Find user in database
      const user = await User.findOne({ clerkId: userId }).lean();

      if (!user) {
        return res.status(200).json({
          success: true,
          isAuthenticated: true,
          userFound: false,
          clerkId: userId,
          message: "User not found in database",
        });
      }

      // Return all role info
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        userFound: true,
        user: {
          _id: user._id,
          clerkId: user.clerkId,
          role: user.role,
          isAdmin: user.role === "admin",
          isAgent: user.role === "agent",
          isPendingAgent: user.role === "agent_pending",
        },
        recommendedDashboard:
          user.role === "admin"
            ? "/dashboard/admin"
            : user.role === "agent"
              ? "/dashboard/agent"
              : "/dashboard",
      });
    } catch (dbError) {
      console.error("Database error in role check:", dbError);
      return res.status(200).json({
        success: false,
        error: "Database error",
        message: dbError.message,
        isAuthenticated: true,
        clerkId: userId,
      });
    }
  } catch (error) {
    console.error("Role check error:", error);
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
