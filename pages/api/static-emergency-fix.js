// Static emergency fix API endpoint that redirects back to the dashboard
import { clerkClient, getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.redirect("/auth/sign-in?redirect_url=/static-fix");
    }

    // Get the user from Clerk
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      // If user not found, redirect to sign-in
      return res.redirect("/auth/sign-in?error=user-not-found");
    }

    // Update the user's metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        role: "agent",
        approved: true,
      },
    });

    // Always redirect back to the dashboard with parameters to prevent loops
    return res.redirect(
      "/dashboard/agent?fixed=true&breakLoop=true&t=" + Date.now()
    );
  } catch (error) {
    console.error("[Static Emergency Fix] Error:", error);

    // Even on error, redirect to a safe page with error information
    return res.redirect(
      `/static-fix?error=${encodeURIComponent(error.message)}`
    );
  }
}
