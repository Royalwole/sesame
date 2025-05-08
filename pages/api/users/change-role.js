import { changeUserRole } from "../../../lib/role-sync";
import { requireAdmin } from "../../../middlewares/authMiddleware";
import { ROLES } from "../../../lib/role-management";

/**
 * API handler for changing user roles
 * Only accessible to admin users
 */
async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  // Extract parameters
  const { userId, role, approved = false } = req.body;

  // Validate required parameters
  if (!userId || !role) {
    return res.status(400).json({
      success: false,
      error: "User ID and role are required",
    });
  }

  // Validate role is a valid role type
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({
      success: false,
      error: `Invalid role: ${role}`,
    });
  }

  try {
    // Process the role change using our utility
    const result = await changeUserRole(userId, role, approved);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error changing role:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  }
}

// Only allow access to admins
export default requireAdmin(handler);
