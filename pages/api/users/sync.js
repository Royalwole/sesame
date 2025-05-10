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
    // First get Clerk authentication information
    const auth = getAuth(req);

    // If no auth user ID, return unauthorized immediately (fail fast)
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
    console.log(`[${requestId}] Authenticated user: ${clerkId}`);

    // Try to connect to the database with a timeout
    try {
      console.log(`[${requestId}] Connecting to database...`);
      await connectDB();
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

    try {
      // Retrieve the user from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkId);

      if (!clerkUser) {
        console.error(`[${requestId}] User not found in Clerk`);
        return res.status(404).json({
          success: false,
          error: "Not found",
          message: "User not found in authentication service",
          requestId,
        });
      }

      console.log(`[${requestId}] Retrieved user from Clerk:`, {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      });

      // Extract user data from Clerk
      const primaryEmailObj = clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      );

      const email =
        primaryEmailObj?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        `user-${clerkId.substring(0, 8)}@placeholder.com`;

      // Attempt to find the user in our database
      let user = await User.findOne({ clerkId });

      if (!user) {
        console.log(
          `[${requestId}] User not found in database, creating new record`
        );

        // Create a new user with basic data
        try {
          user = new User({
            clerkId,
            firstName: clerkUser.firstName || "User",
            lastName: clerkUser.lastName || "",
            email,
            profileImage: clerkUser.imageUrl || "",
            role: clerkUser.publicMetadata?.role || "user",
            approved:
              clerkUser.publicMetadata?.role === "agent"
                ? clerkUser.publicMetadata?.approved === true
                : true,
          });

          await user.save();
          console.log(`[${requestId}] Created new user: ${user._id}`);
        } catch (createError) {
          console.error(`[${requestId}] Error creating user:`, createError);

          // Return error response
          return res.status(500).json({
            success: false,
            error: "Database error",
            message: "Failed to create user record",
            requestId,
          });
        }
      } else {
        // User exists - update fields if needed
        let needsUpdate = false;

        // Update name if changed
        if (clerkUser.firstName && user.firstName !== clerkUser.firstName) {
          user.firstName = clerkUser.firstName;
          needsUpdate = true;
        }

        if (clerkUser.lastName && user.lastName !== clerkUser.lastName) {
          user.lastName = clerkUser.lastName;
          needsUpdate = true;
        }

        // Update email if it changed
        if (email && user.email !== email) {
          user.email = email;
          needsUpdate = true;
        }

        // Update profile image if it changed
        if (clerkUser.imageUrl && user.profileImage !== clerkUser.imageUrl) {
          user.profileImage = clerkUser.imageUrl;
          needsUpdate = true;
        }

        // Save changes if needed
        if (needsUpdate) {
          try {
            await user.save();
            console.log(`[${requestId}] Updated user data from Clerk`);
          } catch (updateError) {
            console.error(`[${requestId}] Error updating user:`, updateError);
          }
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
          bio: user.bio || "",
          phone: user.phone || "",
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (clerkError) {
      console.error(`[${requestId}] Error with Clerk API:`, clerkError);
      return res.status(500).json({
        success: false,
        error: "Service error",
        message: "Failed to retrieve or process authentication data",
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
    // Always disconnect from DB if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log(`[${requestId}] Database connection closed`);
      } catch (closeError) {
        console.error(`[${requestId}] Error closing database:`, closeError);
      }
    }
  }
}
