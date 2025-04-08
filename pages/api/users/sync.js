import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    try {
      // Get auth directly from Clerk
      const auth = getAuth(req);

      if (!auth?.userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      const clerkId = auth.userId;
      console.log("Syncing user data for:", clerkId);

      // Get user profile from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkId);

      console.log("Clerk user data:", {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddress: clerkUser.emailAddresses[0]?.emailAddress,
        hasImage: !!clerkUser.imageUrl,
      });

      // Find or create user in our database
      let user = await User.findOne({ clerkId });

      // If user doesn't exist in our database yet, create them
      if (!user) {
        console.log("User not found in database, creating new record");

        try {
          user = new User({
            clerkId,
            firstName: clerkUser.firstName || "",
            lastName: clerkUser.lastName || "",
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            profileImage: clerkUser.imageUrl || "",
            role: "user", // Default role
            approved: true, // Regular users are approved by default
          });

          await user.save();
          console.log("Created new user:", user._id);
        } catch (validationError) {
          console.error("Validation error creating user:", validationError);

          // Attempt to create a user with minimal required fields if validation fails
          user = new User({
            clerkId,
            firstName: "User", // Default values to pass validation
            lastName: clerkId.substring(0, 8), // Use part of the clerkId as a fallback
            email:
              clerkUser.emailAddresses[0]?.emailAddress ||
              "no-email@example.com",
          });

          await user.save();
          console.log("Created user with fallback data:", user._id);
        }
      }

      // Return user data
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          approved: user.approved,
          profileImage: user.profileImage,
          bio: user.bio,
          agentDetails: user.agentDetails,
        },
      });
    } catch (authError) {
      console.error("Authentication error:", authError);
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: authError.message,
      });
    }
  } catch (error) {
    console.error("Error in sync API:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    await disconnectDB();
  }
}
