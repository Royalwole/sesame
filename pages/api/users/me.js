import { connectDB, disconnectDB } from "../../../lib/db";
import { withJsonResponse } from "../../../lib/api/middleware";
import { getAuth } from "@clerk/nextjs/server";
import User from "../../../models/User";

async function handler(req, res) {
  console.log("API /users/me called");
  const requestId = `req_${Date.now().toString(36)}`;
  console.log(`[${requestId}] Processing user data request`);

  // Only allow GET method
  if (req.method !== "GET") {
    console.log(`[${requestId}] Method not allowed: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      requestId,
    });
  }

  let dbConnection = false;

  try {
    // Get authenticated user from Clerk
    const auth = getAuth(req);

    // Check if auth exists
    if (!auth?.userId) {
      console.log(`[${requestId}] No userId in auth object`);
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "No authenticated user found",
        requestId,
      });
    }

    console.log(`[${requestId}] Fetching user with clerkId: ${auth.userId}`);

    try {
      // Connect to database
      console.log(`[${requestId}] Connecting to database...`);
      await connectDB();
      dbConnection = true;
      console.log(`[${requestId}] Database connected`);

      // Find user in database
      console.log(
        `[${requestId}] Looking for user with clerkId: ${auth.userId}`
      );
      const user = await User.findOne({ clerkId: auth.userId }).lean();

      // If user not found, return error
      if (!user) {
        console.log(
          `[${requestId}] User not found for clerkId: ${auth.userId}, returning 404`
        );
        return res.status(404).json({
          success: false,
          error: "User not found in database",
          message: "Please ensure your account is properly set up",
          requestId,
        });
      }

      console.log(`[${requestId}] User found with role: ${user.role}`);

      // Return successful response with user data
      return res.status(200).json({
        success: true,
        requestId,
        user: {
          _id: user._id,
          clerkId: user.clerkId,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          role: user.role || "user",
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          phone: user.phone || "",
          bio: user.bio || "",
          agentDetails: user.agentDetails || null,
        },
      });
    } catch (dbError) {
      console.error(`[${requestId}] Database error:`, dbError);
      return res.status(503).json({
        success: false,
        error: "Database connection failed",
        message: "We're experiencing database issues. Please try again later.",
        details:
          process.env.NODE_ENV === "development" ? dbError.message : undefined,
        requestId,
      });
    }
  } catch (error) {
    console.error(`[${requestId}] General error in /api/users/me:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user data",
      message: "An unexpected error occurred",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
      requestId,
    });
  } finally {
    // Disconnect from database if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log(`[${requestId}] Database disconnected`);
      } catch (disconnectError) {
        console.error(
          `[${requestId}] Error disconnecting from database:`,
          disconnectError
        );
      }
    }
  }
}

// Apply JSON response middleware
export default withJsonResponse(handler);
