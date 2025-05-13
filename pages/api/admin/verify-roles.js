import { verifyRoleConsistency } from "../../../lib/verify-role-consistency";
import { withAdminAuth } from "../../../lib/withAuth";

/**
 * API endpoint to verify and optionally fix role consistency between MongoDB and Clerk
 *
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<void>}
 */
async function verifyRolesHandler(req, res) {
  try {
    // Only allow GET and POST methods
    if (!["GET", "POST"].includes(req.method)) {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Check if this is a fix request (POST) or just a verification (GET)
    const shouldFix = req.method === "POST";

    // Run the verification
    const results = await verifyRoleConsistency({
      fix: shouldFix,
      verbose: true,
    });

    return res.status(200).json({
      success: true,
      message: shouldFix
        ? `Verification complete. Fixed ${results.fixed} of ${results.inconsistent} inconsistencies.`
        : `Verification complete. Found ${results.inconsistent} inconsistencies.`,
      results,
    });
  } catch (error) {
    console.error("Role verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify roles",
      error: error.message,
    });
  }
}

// Wrap with admin auth middleware to ensure only admins can access
export default withAdminAuth(verifyRolesHandler);
