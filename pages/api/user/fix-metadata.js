import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { clearUserPermissionCache } from "../../../lib/permissions-manager";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Get the authenticated user
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get the role and approved status from the request body
    const { role, approved } = req.body;

    // Get the current user to preserve any other metadata
    const user = await clerkClient.users.getUser(userId);

    // Update the user's metadata, preserving any existing permissions or other metadata
    const updatedUser = await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata, // Keep existing metadata
        role: role || "agent", // Default to agent role if not specified
        approved: approved === undefined ? true : approved, // Default to approved if not specified
      },
    });

    // Clear the permission cache
    clearUserPermissionCache(userId);

    // Return success
    return res.status(200).json({
      success: true,
      message: "User metadata updated successfully",
      user: {
        id: updatedUser.id,
        role: updatedUser.publicMetadata.role,
        approved: updatedUser.publicMetadata.approved,
      },
    });
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return res.status(500).json({ error: "Failed to update user metadata" });
  }
}
