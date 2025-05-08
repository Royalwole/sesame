import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";

export default async function handler(req, res) {
  // Track request for debugging
  const requestId = `sync_${Date.now().toString(36)}`;
  console.log(`[${requestId}] User sync request initiated`);

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      requestId,
    });
  }

  let dbConnection = false;

  try {
    // Connect to database with timeout handling
    console.log(`[${requestId}] Connecting to database`);
    try {
      await Promise.race([
        connectDB(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Database connection timeout")),
            5000
          )
        ),
      ]);
      dbConnection = true;
      console.log(`[${requestId}] Database connected successfully`);
    } catch (dbError) {
      console.error(`[${requestId}] Database connection error:`, dbError);
      return res.status(503).json({
        success: false,
        error: "Database unavailable",
        message: "Could not connect to database. Please try again later.",
        requestId,
      });
    }

    // Get auth directly from Clerk with enhanced error handling
    try {
      const auth = getAuth(req);

      if (!auth?.userId) {
        console.log(`[${requestId}] No userId in auth object`);
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
          requestId,
        });
      }

      const clerkId = auth.userId;
      console.log(`[${requestId}] Syncing user data for: ${clerkId}`);

      // Get user profile from Clerk
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);

        console.log(`[${requestId}] Clerk user retrieved:`, {
          id: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          emailAddress: clerkUser.emailAddresses[0]?.emailAddress,
        });

        // Check if user exists in our database
        let user = await User.findOne({ clerkId });

        // If user doesn't exist, create them
        if (!user) {
          console.log(
            `[${requestId}] User not found in database, creating new record`
          );

          try {
            // Extract primary email or use the first available one
            const primaryEmail =
              clerkUser.emailAddresses.find(
                (email) => email.id === clerkUser.primaryEmailAddressId
              )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

            // Create user with data from Clerk
            user = new User({
              clerkId,
              firstName: clerkUser.firstName || "",
              lastName: clerkUser.lastName || "",
              email: primaryEmail || "",
              profileImage: clerkUser.imageUrl || "",
              role: clerkUser.publicMetadata?.role || "user", // Use role from Clerk if available
              approved: true, // Regular users are approved by default
            });

            await user.save();
            console.log(`[${requestId}] Created new user: ${user._id}`);
          } catch (validationError) {
            console.error(`[${requestId}] Validation error:`, validationError);

            // Try with minimal fields as a fallback
            user = new User({
              clerkId,
              firstName: "User",
              lastName: clerkId.substring(0, 8),
              email:
                clerkUser.emailAddresses[0]?.emailAddress ||
                `user-${clerkId.substring(0, 6)}@example.com`,
            });

            await user.save();
            console.log(
              `[${requestId}] Created user with fallback data: ${user._id}`
            );
          }
        } else {
          // User exists, update their data if needed to keep in sync with Clerk
          let needsUpdate = false;

          // Update name if it changed in Clerk
          if (clerkUser.firstName && user.firstName !== clerkUser.firstName) {
            user.firstName = clerkUser.firstName;
            needsUpdate = true;
          }

          if (clerkUser.lastName && user.lastName !== clerkUser.lastName) {
            user.lastName = clerkUser.lastName;
            needsUpdate = true;
          }

          // Update email if it changed in Clerk
          const primaryEmail = clerkUser.emailAddresses.find(
            (email) => email.id === clerkUser.primaryEmailAddressId
          )?.emailAddress;

          if (primaryEmail && user.email !== primaryEmail) {
            user.email = primaryEmail;
            needsUpdate = true;
          }

          // Update profile image if it changed
          if (clerkUser.imageUrl && user.profileImage !== clerkUser.imageUrl) {
            user.profileImage = clerkUser.imageUrl;
            needsUpdate = true;
          }

          // Save changes if needed
          if (needsUpdate) {
            await user.save();
            console.log(`[${requestId}] Updated user data from Clerk`);
          }
        }

        // Return user data
        return res.status(200).json({
          success: true,
          requestId,
          user: {
            _id: user._id,
            clerkId: user.clerkId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            approved: user.approved,
            profileImage: user.profileImage,
            bio: user.bio,
            agentDetails: user.agentDetails,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
      } catch (clerkError) {
        console.error(`[${requestId}] Clerk API error:`, clerkError);
        return res.status(500).json({
          success: false,
          error: "Service error",
          message: "Could not retrieve user data from authentication service",
          requestId,
        });
      }
    } catch (authError) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Could not verify authentication credentials",
        requestId,
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Unexpected error:`, error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: "An unexpected error occurred",
      requestId,
    });
  } finally {
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log(`[${requestId}] Database connection closed`);
      } catch (error) {
        console.error(`[${requestId}] Error closing database:`, error);
      }
    }
  }
}
