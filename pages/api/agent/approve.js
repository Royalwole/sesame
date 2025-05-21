import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { clearUserPermissionCache } from "../../../lib/permissions-manager";

export default async function handler(req, res) {
  try {
    // Only allow POST method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Check authentication
    const { userId: adminUserId } = getAuth(req);

    if (!adminUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get the current user to check if they have admin role
    const adminUser = await clerkClient.users.getUser(adminUserId);
    const isAdmin =
      adminUser.publicMetadata?.role === "admin" ||
      adminUser.publicMetadata?.role === "super_admin";

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Not authorized to approve agents" });
    }

    // Get parameters from request body
    const { userId, email } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ error: "User ID or email is required" });
    }

    let targetUser;

    // Find user by ID
    if (userId) {
      targetUser = await clerkClient.users.getUser(userId);
    }
    // Find user by email
    else if (email) {
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (users.length === 0) {
        return res
          .status(404)
          .json({ error: "User not found with this email" });
      }

      targetUser = users[0];
    }

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is an agent
    const userRole = targetUser.publicMetadata?.role || "user";
    const isPendingAgent = userRole === "agent_pending";
    const isAgent = userRole === "agent";

    if (!isAgent && !isPendingAgent) {
      return res.status(400).json({
        error: "User is not an agent. Current role: " + userRole,
      });
    }

    // Update user metadata - keep existing metadata and update role and approved status
    const updatedUserData = {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role: "agent", // Ensure role is agent
        approved: true, // Set approved to true
      },
    };

    // Update the user
    await clerkClient.users.updateUser(targetUser.id, updatedUserData);

    // Clear permission cache
    clearUserPermissionCache(targetUser.id);

    let roleChanged = false;
    if (isPendingAgent) {
      roleChanged = true;
    }

    return res.status(200).json({
      success: true,
      message: roleChanged
        ? "User role updated from pending to approved agent"
        : "Agent has been approved successfully",
      userId: targetUser.id,
      email: targetUser.emailAddresses[0]?.emailAddress,
    });
  } catch (error) {
    console.error("Error approving agent:", error);
    return res.status(500).json({ error: "Failed to approve agent" });
  }
}
