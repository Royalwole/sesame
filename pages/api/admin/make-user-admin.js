import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { clerkClient } from "@clerk/nextjs/server";
import { ROLES } from "../../../lib/role-management";

/**
 * Custom API endpoint to make a specific user an admin
 * IMPORTANT: This endpoint should be restricted in production
 */
export default async function handler(req, res) {
  // Only allow in development or with proper authorization in production
  if (process.env.NODE_ENV !== "development") {
    // In production, you would implement proper authentication here
    return res.status(403).json({
      success: false,
      error: "This endpoint is restricted in production",
    });
  }

  try {
    const userId = "user_2wuACriUGELTQHqoqTgu3wvd7ee"; // Hardcoded for safety

    // Connect to database
    await connectDB();

    // Get user from Clerk first to fetch email and name
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(userId);
      console.log(`Retrieved Clerk user: ${userId}`);
    } catch (clerkError) {
      console.error("Error fetching Clerk user:", clerkError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch user from Clerk",
        details: clerkError.message,
      });
    }

    // Extract user info from Clerk
    const primaryEmailObj = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );
    const email =
      primaryEmailObj?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "noemail@example.com"; // Fallback

    const firstName = clerkUser.firstName || "User";
    const lastName = clerkUser.lastName || "";

    // Find user in database
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      // Create user if not exists in database
      dbUser = new User({
        clerkId: userId,
        role: ROLES.ADMIN,
        approved: true,
        firstName: firstName,
        lastName: lastName,
        email: email,
        profileImage: clerkUser.imageUrl || "",
      });
      await dbUser.save();
      console.log(`Created new user with admin role: ${userId}`);
    } else {
      // Update existing user
      console.log(
        `Found existing user: ${dbUser.email}, current role: ${dbUser.role}`
      );

      // Update role to admin and ensure other required fields are set
      dbUser.role = ROLES.ADMIN;
      dbUser.approved = true;

      // Only update these fields if they're empty
      if (!dbUser.firstName) dbUser.firstName = firstName;
      if (!dbUser.email) dbUser.email = email;

      await dbUser.save();
      console.log(`Updated user role to admin: ${userId}`);
    }

    // Update Clerk user metadata
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          role: ROLES.ADMIN,
          approved: true,
        },
      });
      console.log(`Updated Clerk metadata for user: ${userId}`);
    } catch (clerkError) {
      console.error("Error updating Clerk user:", clerkError);
      return res.status(500).json({
        success: false,
        error: "Database updated but Clerk update failed",
        details: clerkError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${userId} has been successfully made an admin`,
      user: {
        clerkId: dbUser.clerkId,
        firstName: dbUser.firstName,
        email: dbUser.email,
        role: dbUser.role,
        approved: dbUser.approved,
      },
    });
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  } finally {
    await disconnectDB();
  }
}
