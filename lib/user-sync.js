import { clerkClient } from "@clerk/nextjs/server";
import User from "../models/User";
import Listing from "../models/Listing";

/**
 * Sync user from Clerk to MongoDB
 */
export async function syncUserWithClerk(clerkId) {
  try {
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId);

    if (!clerkUser) {
      throw new Error(`User not found in Clerk: ${clerkId}`);
    }

    // Find user in database
    let user = await User.findOne({ clerkId });

    // Extract profile data from Clerk
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    const userData = {
      clerkId,
      email: primaryEmail?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      fullName:
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      profileImage: clerkUser.profileImageUrl,
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };

    let listingsUpdated = 0;

    if (user) {
      // Update existing user
      Object.assign(user, userData);
      await user.save();

      // Update user's listings
      listingsUpdated = await updateListingsForUser(user._id);
    } else {
      // Create new user
      userData.createdAt = new Date();
      userData.role = "agent";

      user = new User(userData);
      await user.save();
    }

    return {
      user,
      listingsUpdated,
    };
  } catch (error) {
    console.error("[UserSync] Error:", error);
    throw error;
  }
}

/**
 * Update all listings for a user
 */
async function updateListingsForUser(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return 0;

    const profileData = {
      _id: user._id,
      name:
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      profileImage: user.profileImage,
    };

    const result = await Listing.updateMany(
      { agentId: user._id },
      {
        $set: {
          createdBy: profileData,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("[UpdateListings] Error:", error);
    return 0;
  }
}
