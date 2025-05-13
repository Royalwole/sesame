/**
 * Role Management System
 *
 * Centralizes all role-related logic, permissions, and utilities
 * for consistent role identification and management across the application.
 */

// Import the client functions needed for dashboard routing
import { getUserRole, getApprovalStatus } from "./clerk-client";

// Define all possible user roles as constants
export const ROLES = {
  // Base roles
  USER: "user",
  ADMIN: "admin",

  // Agent roles
  AGENT: "agent",
  AGENT_PENDING: "agent_pending",

  // Special roles (if needed in the future)
  SUPER_ADMIN: "super_admin",
  SUPPORT: "support",
};

// Role hierarchy (higher index = higher privileges)
export const ROLE_HIERARCHY = [
  ROLES.USER,
  ROLES.AGENT_PENDING,
  ROLES.AGENT,
  ROLES.SUPPORT,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/**
 * Role transition matrix defines allowable role changes
 *
 * Format: { [fromRole]: { [toRole]: { allowed: boolean, requiredRole: string, reason: string } } }
 * - allowed: whether this transition is permitted
 * - requiredRole: minimum role required to make this transition (optional)
 * - reason: human-readable reason for this transition rule (optional)
 */
export const ROLE_TRANSITIONS = {
  [ROLES.USER]: {
    [ROLES.USER]: { allowed: true, reason: "No change" },
    [ROLES.AGENT_PENDING]: {
      allowed: true,
      requiredRole: ROLES.ADMIN,
      reason: "User applying to become an agent",
    },
    [ROLES.AGENT]: {
      allowed: false,
      reason: "Users must go through pending agent status first",
    },
    [ROLES.SUPPORT]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Promote user to support staff",
    },
    [ROLES.ADMIN]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Promote user to administrator",
    },
    [ROLES.SUPER_ADMIN]: {
      allowed: false,
      reason: "Super admins cannot be created through role transitions",
    },
  },
  [ROLES.AGENT_PENDING]: {
    [ROLES.USER]: {
      allowed: true,
      requiredRole: ROLES.ADMIN,
      reason: "Reject agent application",
    },
    [ROLES.AGENT_PENDING]: { allowed: true, reason: "No change" },
    [ROLES.AGENT]: {
      allowed: true,
      requiredRole: ROLES.ADMIN,
      reason: "Approve agent application",
    },
    [ROLES.SUPPORT]: {
      allowed: false,
      reason: "Pending agents must be approved first",
    },
    [ROLES.ADMIN]: {
      allowed: false,
      reason: "Pending agents must be approved first",
    },
    [ROLES.SUPER_ADMIN]: {
      allowed: false,
      reason: "Super admins cannot be created through role transitions",
    },
  },
  [ROLES.AGENT]: {
    [ROLES.USER]: {
      allowed: true,
      requiredRole: ROLES.ADMIN,
      reason: "Revoke agent status",
    },
    [ROLES.AGENT_PENDING]: {
      allowed: true,
      requiredRole: ROLES.ADMIN,
      reason: "Suspend agent for review",
    },
    [ROLES.AGENT]: { allowed: true, reason: "No change" },
    [ROLES.SUPPORT]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Promote agent to support staff",
    },
    [ROLES.ADMIN]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Promote agent to administrator",
    },
    [ROLES.SUPER_ADMIN]: {
      allowed: false,
      reason: "Super admins cannot be created through role transitions",
    },
  },
  [ROLES.SUPPORT]: {
    [ROLES.USER]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Demote support staff to user",
    },
    [ROLES.AGENT_PENDING]: {
      allowed: false,
      reason: "Support staff cannot be demoted to pending agent",
    },
    [ROLES.AGENT]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Convert support staff to agent",
    },
    [ROLES.SUPPORT]: { allowed: true, reason: "No change" },
    [ROLES.ADMIN]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Promote support staff to admin",
    },
    [ROLES.SUPER_ADMIN]: {
      allowed: false,
      reason: "Super admins cannot be created through role transitions",
    },
  },
  [ROLES.ADMIN]: {
    [ROLES.USER]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Demote admin to user",
    },
    [ROLES.AGENT_PENDING]: {
      allowed: false,
      reason: "Admins cannot be demoted to pending agent",
    },
    [ROLES.AGENT]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Convert admin to agent",
    },
    [ROLES.SUPPORT]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Convert admin to support staff",
    },
    [ROLES.ADMIN]: { allowed: true, reason: "No change" },
    [ROLES.SUPER_ADMIN]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Promote admin to super admin",
    },
  },
  [ROLES.SUPER_ADMIN]: {
    [ROLES.USER]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Demote super admin to user",
    },
    [ROLES.AGENT_PENDING]: {
      allowed: false,
      reason: "Super admins cannot be demoted to pending agent",
    },
    [ROLES.AGENT]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Convert super admin to agent",
    },
    [ROLES.SUPPORT]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Convert super admin to support staff",
    },
    [ROLES.ADMIN]: {
      allowed: true,
      requiredRole: ROLES.SUPER_ADMIN,
      reason: "Demote super admin to regular admin",
    },
    [ROLES.SUPER_ADMIN]: { allowed: true, reason: "No change" },
  },
};

/**
 * Gets a user's role with fallback handling
 * @param {Object} user - User object from database or Clerk
 * @returns {String} - User role
 */
export function getRole(user) {
  if (!user) return ROLES.USER;

  // Handle database user object
  if (user.role) {
    return user.role;
  }

  // Handle Clerk user object
  if (user.publicMetadata?.role) {
    return user.publicMetadata.role;
  }

  // Default fallback
  return ROLES.USER;
}

/**
 * Checks if user has a specific role
 * @param {Object} user - User object
 * @param {String} role - Role to check
 * @returns {Boolean}
 */
export function hasRole(user, role) {
  return getRole(user) === role;
}

/**
 * Checks if user has any of the specified roles
 * @param {Object} user - User object
 * @param {Array} roles - Array of roles to check
 * @returns {Boolean}
 */
export function hasAnyRole(user, roles) {
  const userRole = getRole(user);
  return roles.includes(userRole);
}

/**
 * Checks if user is an admin
 * @param {Object} user - User object
 * @returns {Boolean}
 */
export function isAdmin(user) {
  const role = getRole(user);
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/**
 * Checks if user is an approved agent
 * @param {Object} user - User object
 * @returns {Boolean}
 */
export function isApprovedAgent(user) {
  if (!user) return false;

  // For database user objects
  if (user.role === ROLES.AGENT) {
    return user.approved === true;
  }

  // For Clerk user objects
  if (user.publicMetadata?.role === ROLES.AGENT) {
    return user.publicMetadata?.approved === true;
  }

  return false;
}

/**
 * Checks if user is a pending agent
 * @param {Object} user - User object
 * @returns {Boolean}
 */
export function isPendingAgent(user) {
  return hasRole(user, ROLES.AGENT_PENDING);
}

/**
 * Checks if user is any kind of agent (approved or pending)
 * @param {Object} user - User object
 * @returns {Boolean}
 */
export function isAnyAgent(user) {
  const role = getRole(user);
  return role === ROLES.AGENT || role === ROLES.AGENT_PENDING;
}

/**
 * Check if a user has equal or higher role privileges than another user
 * @param {Object} user - User trying to perform action
 * @param {Object} targetUser - User being acted upon
 * @returns {Boolean}
 */
export function hasEqualOrHigherPrivilege(user, targetUser) {
  const userRole = getRole(user);
  const targetRole = getRole(targetUser);

  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);

  // Higher index = higher privileges
  return userIndex >= targetIndex;
}

/**
 * Check if a role transition is valid
 * @param {String} currentRole - Current role
 * @param {String} newRole - Target role
 * @param {Object} [options] - Additional options
 * @param {Object} [options.adminUser] - The user attempting to make the change
 * @param {Boolean} [options.logRejection=false] - Whether to log rejected transitions
 * @returns {Object} - Result with allowed status and reason
 */
export function canChangeRole(currentRole, newRole, options = {}) {
  const { adminUser, logRejection = false } = options;
  const logger = console; // Could be replaced with your logging system

  // Return object with status and reason
  const result = {
    allowed: false,
    reason: "Unknown transition",
    requiredRole: null,
  };

  // Validate roles exist
  if (!currentRole || !newRole) {
    result.reason =
      "Invalid roles: both source and target roles must be specified";
    if (logRejection) logger.warn(`Role transition rejected: ${result.reason}`);
    return result;
  }

  // Validate roles are valid
  if (
    !Object.values(ROLES).includes(currentRole) ||
    !Object.values(ROLES).includes(newRole)
  ) {
    result.reason = `Invalid roles: ${currentRole} → ${newRole} (not defined in ROLES)`;
    if (logRejection) logger.warn(`Role transition rejected: ${result.reason}`);
    return result;
  }

  // No change needed
  if (currentRole === newRole) {
    result.allowed = true;
    result.reason = "No change required";
    return result;
  }

  // Look up transition in matrix
  const transition = ROLE_TRANSITIONS[currentRole]?.[newRole];
  if (!transition) {
    result.reason = `Transition not defined in matrix: ${currentRole} → ${newRole}`;
    if (logRejection) logger.warn(`Role transition rejected: ${result.reason}`);
    return result;
  }

  // Check if transition is allowed
  result.allowed = transition.allowed;
  result.reason = transition.reason || "No reason specified";
  result.requiredRole = transition.requiredRole;

  // If transition is allowed but requires a specific role
  if (result.allowed && result.requiredRole && adminUser) {
    const adminRole = getRole(adminUser);
    const adminRoleIndex = ROLE_HIERARCHY.indexOf(adminRole);
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(result.requiredRole);

    // Check if admin has sufficient privileges
    if (adminRoleIndex < requiredRoleIndex) {
      result.allowed = false;
      result.reason = `Insufficient privileges: requires ${getRoleDisplayName(result.requiredRole)} or higher`;
      if (logRejection) {
        logger.warn(`Role transition rejected: ${result.reason}`, {
          transition: `${currentRole} → ${newRole}`,
          attemptedBy: adminUser?.id || "unknown",
          adminRole: adminRole,
          requiredRole: result.requiredRole,
        });
      }
    }
  }

  // Log rejected transitions if requested
  if (!result.allowed && logRejection) {
    logger.warn(`Role transition rejected: ${result.reason}`, {
      transition: `${currentRole} → ${newRole}`,
      attemptedBy: adminUser?.id || "unknown",
    });
  }

  return result;
}

// Legacy function to maintain backward compatibility
export function canChangeRoleSimple(currentRole, newRole) {
  return canChangeRole(currentRole, newRole).allowed;
}

/**
 * Get the appropriate dashboard URL for a user based on their role
 * @param {Object} user - Clerk user object with metadata
 * @returns {string} - The dashboard path
 */
export function getDashboardByRole(user) {
  if (!user) return "/dashboard/user";

  try {
    // Direct access to metadata for stable role detection
    const role = user.publicMetadata?.role || "user";
    const approved = user.publicMetadata?.approved === true;

    console.log("Dashboard routing - Role:", role, "Approved:", approved);

    // Very explicit role checking to avoid any loops
    if ((role === "admin" || role === "super_admin") && approved) {
      return "/dashboard/admin";
    } else if (role === "agent" && approved) {
      return "/dashboard/agent";
    } else if (role === "agent_pending") {
      return "/dashboard/pending";
    } else {
      return "/dashboard/user";
    }
  } catch (error) {
    console.error("Error in getDashboardByRole:", error);
    return "/dashboard/user";
  }
}
