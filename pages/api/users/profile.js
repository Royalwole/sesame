import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs"; // Changed from @clerk/nextjs/server to @clerk/nextjs
import { sanitizeString } from "../../../lib/validation";
import { withDatabase } from "../../../lib/api/withDatabase";

async function handler(req, res) {
  // Only allow GET and PUT methods
  if (!["GET", "PUT"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Get authenticated user from Clerk
    const auth = getAuth(req);
    if (!auth?.userId) {
      console.error("No auth.userId available");
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    console.log(`Profile API: Authenticated userId = ${auth.userId}`);
    console.log(`Profile API: Request method = ${req.method}`);

    if (req.method === "PUT") {
      console.log("Profile API: PUT request body:", JSON.stringify(req.body));
    }

    // Find the user in the database with improved error handling
    let user = await User.findOne({ clerkId: auth.userId });

    // If user not found by clerkId, try finding by email as fallback
    if (!user && auth.sessionClaims?.email) {
      console.log("User not found by clerkId, trying email lookup");
      user = await User.findOne({ email: auth.sessionClaims.email });

      // If found by email but clerkId doesn't match, update it
      if (user && user.clerkId !== auth.userId) {
        console.log("Updating user clerkId to match authentication");
        user.clerkId = auth.userId;
        await user.save();
      }
    }

    // If still no user found, create a new user record
    if (!user) {
      try {
        // Get more comprehensive user data from Clerk
        const clerkUser = await clerkClient.users.getUser(auth.userId);

        // Primary email
        const primaryEmailObj = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        );
        const primaryEmail =
          primaryEmailObj?.emailAddress ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          auth.sessionClaims?.email;

        if (!primaryEmail) {
          return res.status(400).json({
            success: false,
            error: "Unable to create user profile: email required",
          });
        }

        console.log("Creating new user profile with data from Clerk");
        user = new User({
          clerkId: auth.userId,
          email: primaryEmail,
          firstName: clerkUser.firstName || auth.sessionClaims?.firstName || "",
          lastName: clerkUser.lastName || auth.sessionClaims?.lastName || "",
          profileImage: clerkUser.imageUrl || "",
          role: clerkUser.publicMetadata?.role || "user", // Use role from Clerk metadata
        });

        await user.save();
        console.log("Created new user profile:", user._id);
      } catch (createError) {
        console.error("Error creating user profile:", createError);
        return res.status(500).json({
          success: false,
          error: "Failed to create user profile",
          details: createError.message,
        });
      }
    }

    // Handle GET request - Return user profile data
    if (req.method === "GET") {
      // Return user data (excluding sensitive fields)
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          clerkId: user.clerkId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          bio: user.bio,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }

    // Handle PUT request - Update user profile
    if (req.method === "PUT") {
      // Validate request body
      const { firstName, lastName, phone, bio } = req.body;

      if (!firstName || firstName.trim() === "") {
        return res.status(400).json({
          success: false,
          error: "First name is required",
        });
      }

      // Update user in database (only fields that can be updated)
      user.firstName = sanitizeString(firstName);
      user.lastName = sanitizeString(lastName || "");
      user.phone = sanitizeString(phone || "");
      user.bio = sanitizeString(bio || "");

      // Save changes
      await user.save();

      // Return updated user
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          bio: user.bio,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

// Use database middleware for connection handling
export default withDatabase(handler);
