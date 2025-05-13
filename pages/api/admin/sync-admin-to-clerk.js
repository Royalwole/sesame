import { clerkClient } from "@clerk/nextjs/server";

/**
 * API endpoint to sync admin role to Clerk metadata
 */
export default async function handler(req, res) {
  try {
    // The user ID to update in Clerk
    const userId = "user_2wuACriUGELTQHqoqTgu3wvd7ee";

    console.log(`Attempting to update Clerk metadata for user: ${userId}`);

    try {
      // Update user metadata in Clerk
      const updatedUser = await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          role: "admin",
          approved: true,
        },
      });

      console.log("Clerk metadata updated successfully");

      return res.status(200).json({
        success: true,
        message: `User ${userId} metadata updated in Clerk`,
        metadata: {
          role: "admin",
          approved: true,
        },
      });
    } catch (clerkError) {
      console.error("Error updating Clerk metadata:", clerkError);
      return res.status(500).json({
        success: false,
        error: "Failed to update Clerk metadata",
        details: clerkError.message,
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  }
}
