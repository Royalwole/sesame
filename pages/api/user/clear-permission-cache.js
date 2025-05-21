import { clearUserPermissionCache } from "../../../lib/permissions-manager";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  try {
    // Only allow POST method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Get the authenticated user
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Clear the permission cache for this user
    clearUserPermissionCache(userId);

    // Return success
    return res
      .status(200)
      .json({ success: true, message: "Permission cache cleared" });
  } catch (error) {
    console.error("Error clearing permission cache:", error);
    return res.status(500).json({ error: "Failed to clear permission cache" });
  }
}
