import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { clerkClient } from "@clerk/nextjs/server";
import { ROLES } from "../../../lib/role-management";

/**
 * Custom API endpoint to make a specific user an admin by Clerk user ID
 * IMPORTANT: This endpoint should be restricted in production
 */
export default async function handler(req, res) {
  // Security restrictions
  if (process.env.NODE_ENV !== "development") {
    // In production, you would implement proper authentication here
    return res.status(403).json({
      success: false,
      error: "This endpoint is restricted in production",
    });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Allow both GET and POST for simplicity in development
  try {
    const userId = "user_2wuACriUGELTQHqoqTgu3wvd7ee"; // Hardcoded for safety

    // Connect to database
    await connectDB();

    // Find user in database
    let dbUser = await User.findOne({ clerkId: userId });
    const previousRole = dbUser?.role || "none";

    if (!dbUser) {
      // Create user if not exists in database
      try {
        // First get user from Clerk to get their email
        const clerkUser = await clerkClient.users.getUser(userId);

        // Extract email from Clerk user
        const primaryEmailObj = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        );
        const email =
          primaryEmailObj?.emailAddress ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          "user@example.com"; // Fallback

        dbUser = new User({
          clerkId: userId,
          role: ROLES.ADMIN,
          approved: true,
          firstName: clerkUser.firstName || "User",
          lastName: clerkUser.lastName || "",
          email: email,
          profileImage: clerkUser.imageUrl || "",
        });
        await dbUser.save();
        console.log(`Created new user with admin role: ${userId}`);
      } catch (clerkError) {
        console.error("Error creating user from Clerk data:", clerkError);
        return res.status(500).json({
          success: false,
          error: "Failed to create user",
          details: clerkError.message,
        });
      }
    } else {
      // Update existing user
      console.log(
        `Found existing user: ${dbUser.email}, current role: ${dbUser.role}`
      );

      // Update role to admin
      dbUser.role = ROLES.ADMIN;
      dbUser.approved = true;
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
      previousRole: previousRole,
      newRole: ROLES.ADMIN,
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
