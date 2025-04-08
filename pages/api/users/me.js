import { connectDB, disconnectDB, getConnectionStatus } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  let dbConnection = false;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  console.log(`[UserAPI:${requestId}] Processing /api/users/me request`);

  try {
    // Get authenticated user from Clerk
    let auth;
    try {
      auth = getAuth(req);
      if (!auth?.userId) {
        console.log(`[UserAPI:${requestId}] No userId in auth object`);
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Extract user information for logging & debugging
      const userInfo = {
        userId: auth.userId,
        firstName: auth.firstName || auth.sessionClaims?.firstName,
        lastName: auth.lastName || auth.sessionClaims?.lastName,
        email: auth.sessionClaims?.email || auth.sessionClaims?.primaryEmail,
      };

      console.log(`[UserAPI:${requestId}] Authenticated user:`, userInfo);
    } catch (authError) {
      console.error(`[UserAPI:${requestId}] Auth error:`, authError);
      return res.status(401).json({
        success: false,
        message: "Authentication error",
        error: authError.message,
      });
    }

    // Add circuit-breaker pattern for DB connection
    try {
      console.log(`[UserAPI:${requestId}] Attempting database connection...`);

      // Create a connection promise that races against a timeout
      const connectionPromise = connectDB();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 5000)
      );

      try {
        await Promise.race([connectionPromise, timeoutPromise]);
        dbConnection = true;
        console.log(`[UserAPI:${requestId}] Database connection successful`);
      } catch (connectionError) {
        console.error(
          `[UserAPI:${requestId}] Connection error:`,
          connectionError
        );

        // Return fallback user immediately if we can't connect to the database
        return res.status(200).json({
          success: true,
          user: createFallbackUser(auth.userId, auth),
          message: "Using temporary user data - database connection failed",
          isFallback: true,
          dbStatus: getConnectionStatus(),
        });
      }

      // Database connection is successful, try to find or create user
      try {
        // Add query timeout to prevent hanging
        const queryTimeout = 3000; // 3 seconds
        const queryTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), queryTimeout)
        );

        let user;
        try {
          // Use Promise.race to prevent hanging on slow query
          user = await Promise.race([
            User.findOne({ clerkId: auth.userId }).lean(),
            queryTimeoutPromise,
          ]);
        } catch (queryError) {
          console.error(`[UserAPI:${requestId}] Query error:`, queryError);
          throw queryError; // Pass to outer catch
        }

        // Create user if not found
        if (!user) {
          console.log(`[UserAPI:${requestId}] User not found, creating...`);

          // Extract user details with safe defaults
          const firstName =
            auth.firstName || auth.sessionClaims?.firstName || "New";
          const lastName =
            auth.lastName || auth.sessionClaims?.lastName || "User";
          const email =
            auth.sessionClaims?.email || auth.sessionClaims?.primaryEmail || "";

          try {
            const newUser = new User({
              clerkId: auth.userId,
              firstName,
              lastName,
              email,
              role: "user", // Default role for safety
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLogin: new Date(),
            });

            // Add timeout protection for save operation
            user = await Promise.race([newUser.save(), queryTimeoutPromise]);

            user = user.toObject();
            console.log(`[UserAPI:${requestId}] Created new user:`, user._id);
          } catch (createError) {
            console.error(
              `[UserAPI:${requestId}] Failed to create user:`,
              createError
            );
            throw createError; // Pass to outer catch
          }
        } else {
          // Update last login in the background (don't await)
          User.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          ).catch((e) => {
            console.error(
              `[UserAPI:${requestId}] Non-critical error updating lastLogin:`,
              e
            );
          });
        }

        // Return the user data
        return res.status(200).json({
          success: true,
          user: {
            ...user,
            _id: user._id.toString(),
          },
        });
      } catch (userOpError) {
        console.error(
          `[UserAPI:${requestId}] User operation error:`,
          userOpError
        );

        // Return fallback user on database operation error
        return res.status(200).json({
          success: true,
          user: createFallbackUser(auth.userId, auth),
          message: "Using temporary user data - database operation failed",
          isFallback: true,
        });
      }
    } catch (dbError) {
      console.error(`[UserAPI:${requestId}] Database error:`, dbError);

      // Return fallback user on database error
      return res.status(200).json({
        success: true,
        user: createFallbackUser(auth.userId, auth),
        message: "Using temporary user data - database error",
        isFallback: true,
      });
    }
  } catch (error) {
    console.error(`[UserAPI:${requestId}] Critical error:`, error);

    // Return fallback user even on critical errors if we have auth info
    if (auth?.userId) {
      return res.status(200).json({
        success: true,
        user: createFallbackUser(auth.userId, auth),
        message: "Using temporary user data - critical error",
        isFallback: true,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // Clean up database connection if needed
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log(`[UserAPI:${requestId}] Database disconnected`);
      } catch (disconnectError) {
        console.error(
          `[UserAPI:${requestId}] Disconnect error:`,
          disconnectError
        );
      }
    }
  }
}

// Helper function to create consistent fallback user
function createFallbackUser(clerkId, auth = {}) {
  return {
    _id: `temp-${clerkId?.substring(0, 8) || "unknown"}`,
    clerkId: clerkId || "unknown",
    firstName: auth.firstName || auth.sessionClaims?.firstName || "Guest",
    lastName: auth.lastName || auth.sessionClaims?.lastName || "User",
    email: auth.sessionClaims?.email || auth.sessionClaims?.primaryEmail || "",
    role: "user",
    isFallback: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
