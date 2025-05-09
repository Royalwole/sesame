// filepath: c:\Users\HomePC\Desktop\topdial\pages\api\users\sync-user.js
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { ROLES } from "../../../lib/role-management";

/**
 * User Sync API Endpoint
 *
 * This endpoint syncs a user's data between Clerk and MongoDB
 * It ensures that user info and roles are consistent between both systems
 *
 * GET /api/users/sync-user  - Synchronizes the current authenticated user
 * GET /api/users/sync-user?userId=xyz  - Syncs a specific user (admin only)
 */
export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "Only GET requests are allowed for this endpoint",
    });
  }

  // Track request for debugging
  const requestId = `sync_${Date.now().toString(36)}`;
  console.log(`[${requestId}] User sync request initiated`);

  // Get target user ID (from query param or current auth)
  const targetUserId = req.query.userId;
  const auth = getAuth(req);

  // If no auth, return unauthorized
  if (!auth?.userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication required",
      requestId,
    });
  }

  // If trying to sync another user, check admin permissions
  if (targetUserId && targetUserId !== auth.userId) {
    try {
      // Connect to database to check admin status
      await connectDB();
      const adminUser = await User.findOne({ clerkId: auth.userId });

      if (!adminUser || adminUser.role !== ROLES.ADMIN) {
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "Admin access required to sync other users",
          requestId,
        });
      }
    } catch (error) {
      console.error(`[${requestId}] Error checking admin permissions:`, error);
      return res.status(500).json({
        success: false,
        error: "Server error",
        message: "Failed to verify permissions",
        requestId,
      });
    }
  }

  // Set the user ID to sync (either target or current user)
  const userIdToSync = targetUserId || auth.userId;
  console.log(`[${requestId}] Syncing user data for: ${userIdToSync}`);

  let dbConnection = false;

  try {
    // Connect to database
    await connectDB();
    dbConnection = true;
    console.log(`[${requestId}] Database connected`);

    // Get Clerk user data
    const clerkUser = await clerkClient.users.getUser(userIdToSync);
    if (!clerkUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User not found in Clerk",
        requestId,
      });
    }

    console.log(`[${requestId}] Retrieved user from Clerk:`, {
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    // Extract primary email
    const primaryEmailObj = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );
    const primaryEmail =
      primaryEmailObj?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "";

    // Extract metadata
    const metadata = clerkUser.publicMetadata || {};
    const clerkRole = metadata.role || ROLES.USER;
    const clerkApproved = metadata.approved === true;

    // Check if user exists in database
    let dbUser = await User.findOne({ clerkId: userIdToSync });
    let isNewUser = false;

    // If user doesn't exist in database, create them
    if (!dbUser) {
      console.log(
        `[${requestId}] User not found in database, creating new record`
      );
      isNewUser = true;

      dbUser = new User({
        clerkId: userIdToSync,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        email: primaryEmail,
        profileImage: clerkUser.imageUrl || "",
        role: clerkRole,
        approved: clerkRole === ROLES.AGENT ? clerkApproved : true,
      });

      await dbUser.save();
      console.log(`[${requestId}] Created new user in database: ${dbUser._id}`);
    } else {
      console.log(
        `[${requestId}] Found existing user in database: ${dbUser._id}`
      );
    }

    // Track what needs to be updated
    const updates = {
      clerkUpdated: false,
      dbUpdated: false,
      roleChanged: false,
      dataChanged: false,
    };

    // If user exists, check for data to sync between systems
    if (!isNewUser) {
      // 1. First update basic information from Clerk to DB
      if (clerkUser.firstName && dbUser.firstName !== clerkUser.firstName) {
        dbUser.firstName = clerkUser.firstName;
        updates.dbUpdated = true;
        updates.dataChanged = true;
      }

      if (clerkUser.lastName && dbUser.lastName !== clerkUser.lastName) {
        dbUser.lastName = clerkUser.lastName;
        updates.dbUpdated = true;
        updates.dataChanged = true;
      }

      if (primaryEmail && dbUser.email !== primaryEmail) {
        dbUser.email = primaryEmail;
        updates.dbUpdated = true;
        updates.dataChanged = true;
      }

      if (clerkUser.imageUrl && dbUser.profileImage !== clerkUser.imageUrl) {
        dbUser.profileImage = clerkUser.imageUrl;
        updates.dbUpdated = true;
        updates.dataChanged = true;
      }

      // 2. Check role consistency and apply rules

      // Default role for users without role in Clerk
      if (!metadata.role) {
        await clerkClient.users.updateUser(userIdToSync, {
          publicMetadata: {
            ...metadata,
            role: dbUser.role || ROLES.USER,
            approved: dbUser.role === ROLES.AGENT ? dbUser.approved : true,
          },
        });
        updates.clerkUpdated = true;
      }
      // If both systems have different roles, prefer the one from Clerk
      else if (metadata.role && dbUser.role !== metadata.role) {
        dbUser.role = metadata.role;
        updates.dbUpdated = true;
        updates.roleChanged = true;
      }

      // For agents, check approval status
      if (dbUser.role === ROLES.AGENT) {
        const shouldBeApproved = metadata.approved === true;
        if (dbUser.approved !== shouldBeApproved) {
          dbUser.approved = shouldBeApproved;
          updates.dbUpdated = true;
          updates.roleChanged = true;
        }
      }

      // 3. Save changes if needed
      if (updates.dbUpdated) {
        await dbUser.save();
        console.log(`[${requestId}] Updated user data in database`);
      }
    }

    // Return the latest user data
    return res.status(200).json({
      success: true,
      requestId,
      isNewUser,
      updates,
      user: {
        _id: dbUser._id,
        clerkId: dbUser.clerkId,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        email: dbUser.email,
        role: dbUser.role,
        approved: dbUser.approved,
        profileImage: dbUser.profileImage,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Error in sync-user:`, error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: `An unexpected error occurred: ${error.message}`,
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
