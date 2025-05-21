// Simple emergency fix API endpoint with minimal dependencies
import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the authenticated user's ID
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("[SIMPLE FIX] Applying fix for user:", userId);

    // Get the current user data from Clerk
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prepare the updated metadata - preserve existing metadata and update role and approved
    const updatedMetadata = {
      ...user.publicMetadata, // Keep all existing metadata
      role: "agent", // Set role to agent
      approved: true, // Set approved to true
    };

    console.log("[SIMPLE FIX] Updating user metadata:", updatedMetadata);

    // Update the user in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata,
    });

    // Attempt to clear local permission cache if the function exists
    try {
      // Try to dynamically import the clearUserPermissionCache function
      const { clearUserPermissionCache } = await import(
        "../../../lib/permissions-manager"
      );

      if (typeof clearUserPermissionCache === "function") {
        clearUserPermissionCache(userId);
        console.log("[SIMPLE FIX] Successfully cleared permission cache");
      }
    } catch (cacheError) {
      // Just log the error and continue - don't fail the whole request
      console.error(
        "[SIMPLE FIX] Could not clear permission cache:",
        cacheError.message
      );
    }

    // Return success with details
    return res.status(200).json({
      success: true,
      message: "Your account has been updated successfully",
      updates: {
        role: "agent",
        approved: true,
      },
    });
  } catch (error) {
    console.error("[SIMPLE FIX] Error:", error);
    return res.status(500).json({
      error: "Failed to update user account",
      details: error.message,
    });
  }
}
