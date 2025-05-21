import { clerkClient } from "@clerk/nextjs/server";
import ConnectionManager from "./connection-manager";
import User from "../models/User";
import Listing from "../models/Listing";

/**
 * User service for managing user data
 */
class UserService {
  /**
   * Sync user between Clerk and database
   */
  static async syncUser(clerkId) {
    try {
      // Get user from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkId);

      if (!clerkUser) {
        throw new Error(`User not found in Clerk: ${clerkId}`);
      }

      // Connect to database
      await ConnectionManager.connect();

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

      if (user) {
        console.log(`[UserService] Updating existing user: ${user._id}`);

        // Update existing user
        Object.assign(user, userData);
        await user.save();

        // Update listings with latest user info
        await this.updateUserListings(user);
      } else {
        console.log(`[UserService] Creating new user for clerkId: ${clerkId}`);

        // Create new user
        userData.createdAt = new Date();
        userData.role = "agent";

        user = new User(userData);
        await user.save();
      }

      return user;
    } catch (error) {
      console.error("[UserService] Error syncing user:", error);
      throw error;
    } finally {
      await ConnectionManager.disconnect();
    }
  }

  /**
   * Update all listings with latest user profile data
   */
  static async updateUserListings(user) {
    try {
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

      console.log(`[UserService] Updated ${result.modifiedCount} listings`);
      return result.modifiedCount;
    } catch (error) {
      console.error("[UserService] Error updating user listings:", error);
      return 0;
    }
  }
}

export default UserService;
