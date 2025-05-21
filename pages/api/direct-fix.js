// Direct fix API endpoint for ultra-simple form - handles POST requests and redirects
import { clerkClient, getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  try {
    // Only allow POST requests (from form submission)
    if (req.method !== "POST") {
      return res.redirect("/ultra-fix?error=Method+not+allowed");
    }

    // Get the authenticated user
    const { userId } = getAuth(req);

    if (!userId) {
      return res.redirect("/auth/sign-in?redirect_url=/ultra-fix");
    }

    console.log("[DIRECT FIX] Applying fix for user:", userId);

    // Get the user from Clerk
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return res.redirect("/ultra-fix?error=User+not+found");
    }

    // Update the user's metadata to set role as agent and approved as true
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        role: "agent",
        approved: true,
      },
    });

    console.log("[DIRECT FIX] Successfully updated user metadata for:", userId);

    // Try to clear permission cache if possible
    try {
      const { clearUserPermissionCache } = await import(
        "../../../lib/permissions-manager"
      );
      clearUserPermissionCache(userId);
      console.log("[DIRECT FIX] Successfully cleared permission cache");
    } catch (cacheError) {
      console.error(
        "[DIRECT FIX] Error clearing permission cache:",
        cacheError
      );
      // Continue even if this fails
    }

    // Redirect to the agent dashboard with parameters to prevent loops
    return res.redirect(
      "/dashboard/agent?fixed=true&breakLoop=true&direct=true&t=" + Date.now()
    );
  } catch (error) {
    console.error("[DIRECT FIX] Error:", error);
    // Even on error, redirect to a safe page with error information
    return res.redirect(
      `/ultra-fix?error=${encodeURIComponent(error.message)}`
    );
  }
}
