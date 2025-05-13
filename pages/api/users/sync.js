import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { getUser, createFallbackUserData } from "../../../lib/clerk-api";
import { ROLES } from "../../../lib/role-management";

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
      // Retrieve the user from Clerk using our utility
      const clerkUser = await getUser(clerkId);

      // If Clerk API fails, use fallback data
      if (!clerkUser) {
        console.warn(
          `[${requestId}] Could not retrieve user from Clerk, using fallback data`
        );

        // Use fallback data so we can still operate
        const fallbackData = createFallbackUserData(clerkId);

        // Attempt to find the user in our database
        let user = await User.findOne({ clerkId });

        if (!user) {
          console.log(`[${requestId}] Creating fallback user in database`);
          user = new User({
            clerkId,
            firstName: fallbackData.firstName || "User",
            lastName: fallbackData.lastName || "",
            email: `user-${clerkId.substring(0, 8)}@placeholder.com`,
            role: "user",
            approved: true,
            isFallback: true,
          });
          await user.save();
        }

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
            isFallback: true,
          },
          message: "Using fallback user data (Clerk API unavailable)",
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

      // Extract role information from Clerk metadata
      const clerkRole = clerkUser.publicMetadata?.role || ROLES.USER;
      const clerkApproved = clerkUser.publicMetadata?.approved === true;
      console.log(
        `[${requestId}] Clerk role data: role=${clerkRole}, approved=${clerkApproved}`
      );

      // Attempt to find the user in our database
      let user = await User.findOne({ clerkId });

      if (!user) {
        console.log(
          `[${requestId}] User not found in database, creating new record with role: ${clerkRole}`
        );

        // Create a new user with basic data
        try {
          user = new User({
            clerkId,
            firstName: clerkUser.firstName || "User",
            lastName: clerkUser.lastName || "",
            email,
            profileImage: clerkUser.imageUrl || "",
            role: clerkRole,
            approved: clerkRole === ROLES.AGENT ? clerkApproved : true,
          });

          await user.save();
          console.log(
            `[${requestId}] Created new user: ${user._id} with role: ${user.role}`
          );
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

        // CRITICAL FIX: Always check and update role from Clerk during sync
        if (clerkRole && user.role !== clerkRole) {
          console.log(
            `[${requestId}] Updating role from ${user.role} to ${clerkRole}`
          );
          user.role = clerkRole;
          needsUpdate = true;
        }

        // Update approval status for agent roles
        if (clerkRole === ROLES.AGENT && user.approved !== clerkApproved) {
          console.log(
            `[${requestId}] Updating approval status from ${user.approved} to ${clerkApproved}`
          );
          user.approved = clerkApproved;
          needsUpdate = true;
        }

        // Save changes if needed
        if (needsUpdate) {
          try {
            await user.save();
            console.log(
              `[${requestId}] Updated user data from Clerk, role is now: ${user.role}`
            );
          } catch (updateError) {
            console.error(`[${requestId}] Error updating user:`, updateError);
          }
        } else {
          console.log(
            `[${requestId}] No updates needed, current role: ${user.role}`
          );
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
