import { clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "./db";
import mongoose from "mongoose";
import User from "../models/User";
import Listing from "../models/Listing";

/**
 * Synchronizes a user's profile between Clerk and MongoDB
 */
export async function syncUserProfile(clerkId) {
  let dbConnection = false;

  try {
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId);

    if (!clerkUser) {
      throw new Error(`User not found in Clerk: ${clerkId}`);
    }

    // Connect to database using the existing function
    await connectDB();
    dbConnection = true;

    // Find user in database
    let user = await User.findOne({ clerkId });

    // Get primary email from Clerk user
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    // Extract profile data from Clerk
    const userData = {
      clerkId,
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      fullName:
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      profileImage: clerkUser.profileImageUrl,
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };

    if (user) {
      console.log(`[UserSync] Updating existing user: ${user._id}`);

      // Update existing user
      Object.assign(user, userData);
      await user.save();

      // Update all associated listings with latest user info
      await updateUserListings(user);
    } else {
      console.log(`[UserSync] Creating new user for clerkId: ${clerkId}`);

      // Create new user
      userData.createdAt = new Date();
      userData.role = "agent"; // Default role for new users

      user = new User(userData);
      await user.save();
    }

    return user;
  } catch (error) {
    console.error("[UserSync] Error syncing user profile:", error);
    throw error;
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}

/**
 * Update all listings with latest user profile data
 */
async function updateUserListings(user) {
  try {
    console.log(`[UserSync] Updating listings for agent: ${user._id}`);

    // Basic profile data to update in listings
    const profileData = {
      _id: user._id,
      name:
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      profileImage: user.profileImage,
    };

    // Update all listings created by this user
    const result = await Listing.updateMany(
      { agentId: user._id },
      {
        $set: {
          createdBy: profileData,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[UserSync] Updated ${result.modifiedCount} listings`);
    return result.modifiedCount;
  } catch (error) {
    console.error("[UserSync] Error updating user listings:", error);
    return 0;
  }
}

/**
 * Webhook handler for Clerk user events
 * @param {Object} event - Clerk webhook event
 */
export async function handleUserWebhook(event) {
  if (!event || !event.data)
    return { success: false, error: "Invalid event data" };

  const { id: clerkId } = event.data;

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const user = await syncUserProfile(clerkId);
      return {
        success: true,
        userId: user._id,
        action: event.type === "user.created" ? "created" : "updated",
      };
    }

    return { success: false, error: "Unsupported event type" };
  } catch (error) {
    console.error("[UserSync] Webhook error:", error);
    return { success: false, error: error.message };
  }
}
