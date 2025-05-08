/**
 * Role Management System
 *
 * Centralizes all role-related logic, permissions, and utilities
 * for consistent role identification and management across the application.
 */

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
 * @returns {Boolean} - Whether the transition is allowed
 */
export function canChangeRole(currentRole, newRole) {
  // Invalid roles check
  if (!currentRole || !newRole) return false;
  if (
    !Object.values(ROLES).includes(currentRole) ||
    !Object.values(ROLES).includes(newRole)
  ) {
    return false;
  }

  // No change needed
  if (currentRole === newRole) return true;

  // Special rules for agent transitions
  if (currentRole === ROLES.AGENT_PENDING && newRole === ROLES.AGENT) {
    return true; // Approving a pending agent
  }

  if (currentRole === ROLES.AGENT && newRole === ROLES.AGENT_PENDING) {
    return true; // Reverting an agent to pending
  }

  // Allow transitions between basic roles (user/agent/admin)
  if (
    [ROLES.USER, ROLES.AGENT, ROLES.ADMIN].includes(currentRole) &&
    [ROLES.USER, ROLES.AGENT, ROLES.ADMIN].includes(newRole)
  ) {
    return true;
  }

  // Allow promoting user to pending agent
  if (currentRole === ROLES.USER && newRole === ROLES.AGENT_PENDING) {
    return true;
  }

  // Super admin restrictions
  if (newRole === ROLES.SUPER_ADMIN) {
    return false; // Super admin creation restricted (implement special logic if needed)
  }

  // Default to false for safety
  return false;
}

/**
 * Get the appropriate dashboard URL for a user based on their role
 * @param {Object} user - User object
 * @returns {String} - Dashboard URL
 */
export function getDashboardByRole(user) {
  if (isAdmin(user)) {
    return "/dashboard/admin";
  } else if (isApprovedAgent(user)) {
    return "/dashboard/agent";
  } else if (isPendingAgent(user)) {
    return "/dashboard/pending";
  } else {
    return "/dashboard";
  }
}

/**
 * Convert a role to a display name
 * @param {String} role - Role from ROLES object
 * @returns {String} - Human-readable role name
 */
export function getRoleDisplayName(role) {
  switch (role) {
    case ROLES.ADMIN:
      return "Administrator";
    case ROLES.SUPER_ADMIN:
      return "Super Administrator";
    case ROLES.AGENT:
      return "Real Estate Agent";
    case ROLES.AGENT_PENDING:
      return "Pending Agent";
    case ROLES.SUPPORT:
      return "Support Staff";
    case ROLES.USER:
      return "User";
    default:
      return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown";
  }
}

/**
 * Get all available roles for user assignment
 * @param {Object} adminUser - The admin user requesting the roles
 * @returns {Array} - Array of available role objects with id and name
 */
export function getAssignableRoles(adminUser) {
  // Validate that the requesting user is an admin
  if (!isAdmin(adminUser)) {
    return [];
  }

  const isSuperAdmin = getRole(adminUser) === ROLES.SUPER_ADMIN;

  // Basic roles any admin can assign
  const roles = [
    { id: ROLES.USER, name: getRoleDisplayName(ROLES.USER) },
    { id: ROLES.AGENT_PENDING, name: getRoleDisplayName(ROLES.AGENT_PENDING) },
    { id: ROLES.AGENT, name: getRoleDisplayName(ROLES.AGENT) },
  ];

  // Regular admins can assign other regular admins
  roles.push({ id: ROLES.ADMIN, name: getRoleDisplayName(ROLES.ADMIN) });

  // Only super admins can assign special roles
  if (isSuperAdmin) {
    roles.push({
      id: ROLES.SUPER_ADMIN,
      name: getRoleDisplayName(ROLES.SUPER_ADMIN),
    });
    roles.push({
      id: ROLES.SUPPORT,
      name: getRoleDisplayName(ROLES.SUPPORT),
    });
  }

  return roles;
}
