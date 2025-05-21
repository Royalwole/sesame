import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";

// Special API endpoint to fix user account issues that cause redirect loops
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Get the authenticated user
    const auth = getAuth(req);
    const { userId } = auth;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log("[EMERGENCY FIX] Applying emergency fix for user:", userId);

    // 1. Get the user from Clerk
    const user = await clerkClient.users.getUser(userId);

    // 2. Create updated metadata - ensure role is 'agent' and approved is true
    const updatedMetadata = {
      ...user.publicMetadata, // Keep existing metadata
      role: "agent", // Set role to agent
      approved: true, // Set approved to true
    };

    console.log("[EMERGENCY FIX] Setting user metadata:", updatedMetadata);

    // 3. Update the user in Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata,
    });

    // 4. Attempt to clear server-side caches
    try {
      // Try to import and use clearUserPermissionCache
      const { clearUserPermissionCache } = await import(
        "../../../lib/permissions-manager"
      );
      clearUserPermissionCache(userId);
      console.log("[EMERGENCY FIX] Successfully cleared permission cache");
    } catch (cacheError) {
      console.error(
        "[EMERGENCY FIX] Error clearing permission cache:",
        cacheError
      );
      // Continue even if this fails
    }

    // Return success with details
    return res.status(200).json({
      success: true,
      message:
        "Your account has been updated with agent role and approved status",
      user: {
        id: userId,
        role: "agent",
        approved: true,
      },
    });
  } catch (error) {
    console.error("[EMERGENCY FIX] Error updating user metadata:", error);
    return res.status(500).json({
      error: "Failed to update user metadata",
      message: error.message,
    });
  }
}
