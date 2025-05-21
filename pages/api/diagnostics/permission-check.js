import { clerkClient, getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  try {
    // Get user from auth
    const auth = getAuth(req);
    const { userId } = auth;

    if (!userId) {
      return res.status(401).json({
        error: "Not authenticated",
        fix: "/auth/sign-in",
      });
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found in Clerk",
        userId,
      });
    }

    // Extract the current role and approval status from metadata
    const currentRole = user.publicMetadata?.role || "user";
    const isApproved = user.publicMetadata?.approved === true;

    // Check what dashboard the user should have access to
    let suggestedDashboard = "/dashboard/user";
    let canAccessAgentDashboard = false;

    if (
      (currentRole === "admin" || currentRole === "super_admin") &&
      isApproved
    ) {
      suggestedDashboard = "/dashboard/admin";
    } else if (currentRole === "agent" && isApproved) {
      suggestedDashboard = "/dashboard/agent";
      canAccessAgentDashboard = true;
    } else if (currentRole === "agent_pending") {
      suggestedDashboard = "/dashboard/pending";
    }

    // Check for permission issues
    const needsRoleUpdate = currentRole !== "agent";
    const needsApprovalUpdate = !isApproved;

    // Return comprehensive diagnostic information
    return res.status(200).json({
      status: "success",
      user: {
        id: userId,
        role: currentRole,
        approved: isApproved,
      },
      access: {
        canAccessAgentDashboard,
        suggestedDashboard,
      },
      fixes: {
        needsRoleUpdate,
        needsApprovalUpdate,
        fixUrl: "/fix-dashboard",
        emergencyFixUrl: "/emergency-fix",
        ultraSimpleFixUrl: "/ultra-fix",
      },
      technicalDetails: {
        metadata: user.publicMetadata,
        email: user.emailAddresses?.[0]?.emailAddress,
      },
    });
  } catch (error) {
    console.error("[Permission Diagnostics] Error:", error);
    return res.status(500).json({
      error: "Server error during permission diagnostics",
      message: error.message,
    });
  }
}
