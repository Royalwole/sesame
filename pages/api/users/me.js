import { connectDB, disconnectDB } from "../../../lib/db";
import { withJsonResponse } from "../../../lib/api/middleware";
import { getAuth } from "@clerk/nextjs/server";

async function handler(req, res) {
  console.log("API /users/me called");

  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  let dbConnection = false;

  try {
    // Get authenticated user from Clerk
    const auth = getAuth(req);

    // Check if auth exists
    if (!auth?.userId) {
      console.log("No userId in auth object");
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "No authenticated user found",
      });
    }

    console.log(`Fetching user with clerkId: ${auth.userId}`);

    // Create a mock user response for testing
    // This will help determine if the issue is with the DB or with Clerk
    return res.status(200).json({
      success: true,
      user: {
        _id: "mock_id",
        clerkId: auth.userId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        role: "admin", // For testing admin access
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    /* Commented out until we confirm the above works
    try {
      // Connect to database
      console.log("Connecting to database...");
      await connectDB();
      dbConnection = true;
      console.log("Database connected");

      // Find user in database
      console.log(`Looking for user with clerkId: ${auth.userId}`);
      const user = await User.findOne({ clerkId: auth.userId }).lean();

      // If user not found, return error
      if (!user) {
        console.log(`User not found for clerkId: ${auth.userId}, returning 404`);
        return res.status(404).json({
          success: false,
          error: "User not found in database",
          message: "Please ensure your account is properly set up"
        });
      }

      console.log(`User found with role: ${user.role}`);

      // Return successful response with user data
      return res.status(200).json({
        success: true,
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
        }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(503).json({
        success: false,
        error: "Database connection failed",
        message: "We're experiencing database issues. Please try again later.",
        details: process.env.NODE_ENV === "development" ? dbError.message : undefined
      });
    }
    */
  } catch (error) {
    console.error("General error in /api/users/me:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user data",
      message: "An unexpected error occurred",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // Disconnect from database if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log("Database disconnected");
      } catch (disconnectError) {
        console.error("Error disconnecting from database:", disconnectError);
      }
    }
  }
}

// Apply JSON response middleware
export default withJsonResponse(handler);
