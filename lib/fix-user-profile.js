// User profile fix utility
import { connectDB, disconnectDB } from "./db";
import User from "../models/User";
import { getUser, createFallbackUserData } from "./clerk-api";

/**
 * Fix user profile by ensuring it exists in MongoDB
 * @param {string} clerkId - The Clerk user ID to fix
 * @returns {Promise<Object>} - The user object (existing or newly created)
 */
export async function fixUserProfile(clerkId) {
  if (!clerkId) {
    throw new Error("Clerk ID is required");
  }

  console.log(`Fixing user profile for Clerk ID: ${clerkId}`);

  try {
    // Connect to database
    await connectDB();

    // Check if user already exists
    let user = await User.findOne({ clerkId });

    // If user exists, return it
    if (user) {
      console.log(`User already exists in database: ${user._id}`);
      return user;
    }

    // User doesn't exist, fetch from Clerk and create
    console.log("User not found in database. Creating from Clerk data...");

    try {
      // Get user data from our reliable Clerk utility
      const clerkUser = await getUser(clerkId);

      if (!clerkUser) {
        console.warn(
          "Could not retrieve user from Clerk API, using fallback data"
        );
        // Create minimal user as fallback
        user = new User({
          clerkId,
          email: `user-${clerkId.substring(0, 8)}@placeholder.com`,
          firstName: "User",
          lastName: "",
          role: "user",
          approved: true,
          isFallback: true,
        });

        await user.save();
        console.log(`Created fallback user in database: ${user._id}`);

        return user;
      }

      // Get primary email
      const primaryEmailObj = clerkUser.emailAddresses?.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      );
      const email =
        primaryEmailObj?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        `user-${clerkId.substring(0, 8)}@placeholder.com`;

      // Create new user
      user = new User({
        clerkId,
        email,
        firstName: clerkUser.firstName || "User",
        lastName: clerkUser.lastName || "",
        role: clerkUser.publicMetadata?.role || "user",
        approved: true,
        profileImage: clerkUser.imageUrl || "",
      });

      // Save user to database
      await user.save();
      console.log(`Created new user in database: ${user._id}`);

      return user;
    } catch (clerkError) {
      console.error("Error handling Clerk user data:", clerkError);

      // Create minimal user as fallback
      user = new User({
        clerkId,
        email: `user-${clerkId.substring(0, 8)}@placeholder.com`,
        firstName: "User",
        lastName: "",
        role: "user",
        approved: true,
        isFallback: true,
      });

      await user.save();
      console.log(`Created fallback user in database after error: ${user._id}`);

      return user;
    }
  } catch (error) {
    console.error("Error fixing user profile:", error);
    throw error;
  } finally {
    await disconnectDB();
  }
}

export default fixUserProfile;
