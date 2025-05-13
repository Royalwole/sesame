import { connectDB, disconnectDB, checkDBConnection } from "../../../lib/db";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import User from "../../../models/User";
import { apiResponse } from "../../../lib/api-response";

async function handler(req, res) {
  console.log("API /users/me called");
  const requestId = `req_${Date.now().toString(36)}`;
  console.log(`[${requestId}] Processing user data request`);

  // Only allow GET method
  if (req.method !== "GET") {
    console.log(`[${requestId}] Method not allowed: ${req.method}`);
    return apiResponse(res, 405, {
      error: "Method not allowed",
      requestId,
    });
  }

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // Get authenticated user from Clerk
      const auth = getAuth(req);

      // Check if auth exists
      if (!auth?.userId) {
        console.log(`[${requestId}] No userId in auth object`);
        return apiResponse(res, 401, {
          error: "Unauthorized",
          message: "No authenticated user found",
          requestId,
        });
      }

      console.log(`[${requestId}] Fetching user with clerkId: ${auth.userId}`);

      // Check database connection first with increased timeout
      const dbStatus = await checkDBConnection();
      if (!dbStatus.isConnected) {
        console.log(
          `[${requestId}] Database connection check failed, retrying...`
        );
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retryCount++;
        continue;
      }

      // No need to explicitly connect if checkDBConnection succeeded
      console.log(`[${requestId}] Database connected`);

      // Find user in database
      console.log(
        `[${requestId}] Looking for user with clerkId: ${auth.userId}`
      );
      let user = await User.findOne({ clerkId: auth.userId }).lean();

      // If user not found, create a new user
      if (!user) {
        console.log(`[${requestId}] User not found, creating new user record`);

        // Get user data from Clerk
        const clerkUser = await clerkClient.users.getUser(auth.userId);

        // Create new user with data from Clerk
        const newUser = new User({
          clerkId: auth.userId,
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          profileImage: clerkUser.imageUrl || "",
          role: "user", // Default role
          approved: true, // Regular users are approved by default
        });

        await newUser.save();
        user = newUser.toObject();
        console.log(`[${requestId}] Created new user with ID: ${user._id}`);
      }

      console.log(`[${requestId}] User found/created with role: ${user.role}`);

      // Return successful response with user data
      return apiResponse(
        res,
        200,
        {
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
        },
        "User data retrieved successfully"
      );
    } catch (error) {
      console.error(
        `[${requestId}] Error in /api/users/me (attempt ${retryCount + 1}):`,
        error
      );

      // If we haven't reached max retries, wait and try again
      if (retryCount < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
        console.log(`[${requestId}] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retryCount++;
        continue;
      }

      // If we've exhausted retries, return error with more specific message
      return apiResponse(res, 503, {
        error: "Service temporarily unavailable",
        message:
          "Database connection issue. Please try again in a few moments.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        requestId,
      });
    }
  }
}

export default handler;
