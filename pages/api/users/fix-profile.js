import { getAuth } from "@clerk/nextjs/server";
import { fixUserProfile } from "../../../lib/fix-user-profile";

/**
 * API endpoint to fix a user's profile in MongoDB
 * This creates a user record if one doesn't exist
 *
 * GET /api/users/fix-profile
 */
export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    // Get auth from Clerk
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - Authentication required",
      });
    }

    // Fix the user profile
    const user = await fixUserProfile(auth.userId);

    // Return success
    return res.status(200).json({
      success: true,
      message: "User profile fixed successfully",
      user: {
        _id: user._id,
        clerkId: user.clerkId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fixing user profile:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fix user profile",
      message: error.message,
    });
  }
}
