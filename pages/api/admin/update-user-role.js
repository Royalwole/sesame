import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  try {
    // Only allow POST method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Check authentication
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get the current user to check if they have admin role
    const adminUser = await clerkClient.users.getUser(userId);
    const isAdmin =
      adminUser.publicMetadata?.role === "admin" ||
      adminUser.publicMetadata?.role === "super_admin";

    if (!isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get update parameters
    const { userId: targetUserId, role, approved } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: "User ID required" });
    }

    if (!role) {
      return res.status(400).json({ error: "Role required" });
    }

    // Valid roles
    const validRoles = ["user", "agent", "agent_pending", "moderator", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Update user metadata
    const updatedUser = await clerkClient.users.updateUser(targetUserId, {
      publicMetadata: {
        role,
        approved: approved === true,
        // Keep any existing metadata by spreading it here
        // This will preserve permissions and other metadata
        ...adminUser.publicMetadata,
      },
    });

    // Return success
    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.publicMetadata.role,
        approved: updatedUser.publicMetadata.approved,
      },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ error: "Failed to update user role" });
  }
}
