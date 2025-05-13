/**
 * Permissions Manager
 *
 * Defines and manages the RBAC (Role-Based Access Control) system
 * using Clerk metadata to store user permissions
 */

// Permission domains (functional areas of the application)
export const DOMAINS = {
  ADMIN: "ADMIN",
  USERS: "USERS",
  LISTINGS: "LISTINGS",
  MESSAGES: "MESSAGES",
  REPORTS: "REPORTS",
  SETTINGS: "SETTINGS",
  FINANCE: "FINANCE",
  INSPECTIONS: "INSPECTIONS",
  ANALYTICS: "ANALYTICS",
};

// All available permissions organized by domain
export const PERMISSIONS = {
  // Admin permissions
  ADMIN: {
    ACCESS_DASHBOARD: "admin:access_dashboard",
    VIEW_ANALYTICS: "admin:view_analytics",
    MANAGE_SYSTEM: "admin:manage_system",
    VIEW_LOGS: "admin:view_logs",
    IMPERSONATE_USER: "admin:impersonate_user",
    BULK_OPERATIONS: "admin:bulk_operations",
  },

  // User management permissions
  USERS: {
    VIEW_USERS: "users:view_users",
    CREATE_USER: "users:create_user",
    EDIT_USER: "users:edit_user",
    DELETE_USER: "users:delete_user",
    CHANGE_ROLE: "users:change_role",
    VIEW_USER_DETAILS: "users:view_user_details",
  },

  // Listings management permissions
  LISTINGS: {
    VIEW_OWN: "listings:view_own",
    VIEW_ALL: "listings:view_all",
    CREATE: "listings:create",
    EDIT_OWN: "listings:edit_own",
    EDIT_ANY: "listings:edit_any",
    DELETE_OWN: "listings:delete_own",
    DELETE_ANY: "listings:delete_any",
    PUBLISH: "listings:publish",
    FEATURE: "listings:feature",
    APPROVE: "listings:approve",
    FLAG: "listings:flag",
    VIEW_DRAFT: "listings:view_draft",
  },

  // Messages permissions
  MESSAGES: {
    SEND: "messages:send",
    RECEIVE: "messages:receive",
    VIEW_OWN: "messages:view_own",
    VIEW_ALL: "messages:view_all",
    DELETE_OWN: "messages:delete_own",
    DELETE_ANY: "messages:delete_any",
  },

  // Reports permissions
  REPORTS: {
    GENERATE: "reports:generate",
    EXPORT: "reports:export",
    VIEW_BASIC: "reports:view_basic",
    VIEW_ADVANCED: "reports:view_advanced",
  },

  // Settings permissions
  SETTINGS: {
    VIEW_OWN: "settings:view_own",
    VIEW_SYSTEM: "settings:view_system",
    EDIT_OWN: "settings:edit_own",
    EDIT_SYSTEM: "settings:edit_system",
  },

  // Financial permissions
  FINANCE: {
    VIEW_TRANSACTIONS: "finance:view_transactions",
    PROCESS_PAYMENTS: "finance:process_payments",
    ISSUE_REFUNDS: "finance:issue_refunds",
    VIEW_FINANCIAL_REPORTS: "finance:view_financial_reports",
  },

  // Inspections permissions
  INSPECTIONS: {
    CREATE: "inspections:create",
    VIEW_OWN: "inspections:view_own",
    VIEW_ALL: "inspections:view_all",
    EDIT_OWN: "inspections:edit_own",
    EDIT_ANY: "inspections:edit_any",
    DELETE_OWN: "inspections:delete_own",
    DELETE_ANY: "inspections:delete_any",
    SCHEDULE: "inspections:schedule",
  },

  // Analytics permissions
  ANALYTICS: {
    VIEW_BASIC: "analytics:view_basic",
    VIEW_ADVANCED: "analytics:view_advanced",
    EXPORT: "analytics:export",
    CONFIGURE: "analytics:configure",
  },
};

// Default permissions assigned to each role
const USER_PERMISSIONS = [
  PERMISSIONS.LISTINGS.VIEW_OWN,
  PERMISSIONS.LISTINGS.CREATE,
  PERMISSIONS.LISTINGS.EDIT_OWN,
  PERMISSIONS.LISTINGS.DELETE_OWN,
  PERMISSIONS.MESSAGES.SEND,
  PERMISSIONS.MESSAGES.RECEIVE,
  PERMISSIONS.MESSAGES.VIEW_OWN,
  PERMISSIONS.MESSAGES.DELETE_OWN,
  PERMISSIONS.SETTINGS.VIEW_OWN,
  PERMISSIONS.SETTINGS.EDIT_OWN,
  PERMISSIONS.INSPECTIONS.VIEW_OWN,
  PERMISSIONS.ANALYTICS.VIEW_BASIC,
];

const AGENT_PERMISSIONS = [
  // Agent inherits all user permissions
  ...USER_PERMISSIONS,
  // Additional agent-specific permissions
  PERMISSIONS.LISTINGS.PUBLISH,
  PERMISSIONS.LISTINGS.VIEW_DRAFT,
  PERMISSIONS.INSPECTIONS.CREATE,
  PERMISSIONS.INSPECTIONS.SCHEDULE,
  PERMISSIONS.INSPECTIONS.EDIT_OWN,
  PERMISSIONS.REPORTS.GENERATE,
  PERMISSIONS.REPORTS.VIEW_BASIC,
];

const MODERATOR_PERMISSIONS = [
  // Moderator includes agent permissions
  ...AGENT_PERMISSIONS,
  // Additional moderator permissions
  PERMISSIONS.LISTINGS.VIEW_ALL,
  PERMISSIONS.LISTINGS.EDIT_ANY,
  PERMISSIONS.LISTINGS.FLAG,
  PERMISSIONS.LISTINGS.APPROVE,
  PERMISSIONS.MESSAGES.VIEW_ALL,
  PERMISSIONS.INSPECTIONS.VIEW_ALL,
  PERMISSIONS.REPORTS.EXPORT,
  PERMISSIONS.REPORTS.VIEW_ADVANCED,
];

const ADMIN_PERMISSIONS = Object.values(PERMISSIONS).flatMap((domain) =>
  Object.values(domain)
);

export const DEFAULT_ROLE_PERMISSIONS = {
  user: USER_PERMISSIONS,
  agent: AGENT_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

/**
 * Permission Cache System
 *
 * Caches user permissions to avoid recalculating them on every check
 * Uses user ID as key and caches both full permissions and individual checks
 */
class PermissionCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.permissionCache = new Map();
    this.domainCache = new Map();

    // Cache config
    this.maxAge = options.maxAge || 120_000; // 2 minutes default
    this.maxSize = options.maxSize || 500; // Maximum users to cache
    this.enabled = options.enabled !== false; // Enable by default

    // Stats for monitoring
    this.stats = {
      hits: 0,
      misses: 0,
      permissionHits: 0,
      permissionMisses: 0,
      evictions: 0,
    };
  }

  /**
   * Generate a cache key from user
   * @param {Object} user - User object
   * @returns {String} Cache key
   */
  getUserCacheKey(user) {
    if (!user) return null;

    // Use ID if available
    if (user.id) return `user:${user.id}`;
    if (user.clerkId) return `user:${user.clerkId}`;

    // Fallback to using email
    if (user.email) return `email:${user.email}`;
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      return `email:${user.emailAddresses[0].emailAddress}`;
    }

    // Cannot cache this user
    return null;
  }

  /**
   * Get user permissions from cache or calculate them
   * @param {Object} user - User object
   * @returns {Array} Array of permissions
   */
  getUserPermissions(user) {
    if (!this.enabled || !user) {
      return getUserPermissionsUncached(user);
    }

    const key = this.getUserCacheKey(user);
    if (!key) {
      return getUserPermissionsUncached(user);
    }

    // Try to get from cache
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      this.stats.hits++;
      return cached.permissions;
    }

    this.stats.misses++;

    // Calculate permissions
    const permissions = getUserPermissionsUncached(user);

    // Cache the result
    this.cache.set(key, {
      permissions,
      expiresAt: Date.now() + this.maxAge,
      timestamp: Date.now(),
    });

    // Enforce cache size limits
    this.enforceCacheSize();

    return permissions;
  }

  /**
   * Check if a user has a specific permission (with caching)
   * @param {Object} user - User object
   * @param {String} permission - Permission to check
   * @returns {Boolean} True if user has permission
   */
  hasPermission(user, permission) {
    if (!this.enabled || !user || !permission) {
      return hasPermissionUncached(user, permission);
    }

    const userKey = this.getUserCacheKey(user);
    if (!userKey) {
      return hasPermissionUncached(user, permission);
    }

    // Create a key for this specific permission check
    const permKey = `${userKey}:${permission}`;

    // Check if we have this specific result cached
    const cachedResult = this.permissionCache.get(permKey);
    if (cachedResult && Date.now() < cachedResult.expiresAt) {
      this.stats.permissionHits++;
      return cachedResult.result;
    }

    this.stats.permissionMisses++;

    // Calculate the result
    const userPermissions = this.getUserPermissions(user);
    const result = userPermissions.includes(permission);

    // Cache this specific permission check
    this.permissionCache.set(permKey, {
      result,
      expiresAt: Date.now() + this.maxAge,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Get domain permissions for a user (with caching)
   * @param {Object} user - User object
   * @param {String} domain - Permission domain
   * @returns {Object} Object with permissions for domain
   */
  getDomainPermissions(user, domain) {
    if (!this.enabled || !user || !domain) {
      return getDomainPermissionsUncached(user, domain);
    }

    const userKey = this.getUserCacheKey(user);
    if (!userKey) {
      return getDomainPermissionsUncached(user, domain);
    }

    // Create a key for this domain check
    const domainKey = `${userKey}:domain:${domain}`;

    // Check if we have this specific domain cached
    const cachedResult = this.domainCache.get(domainKey);
    if (cachedResult && Date.now() < cachedResult.expiresAt) {
      return cachedResult.result;
    }

    // Calculate the result
    const result = getDomainPermissionsUncached(user, domain);

    // Cache this domain result
    this.domainCache.set(domainKey, {
      result,
      expiresAt: Date.now() + this.maxAge,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Enforce cache size limits by removing oldest entries
   */
  enforceCacheSize() {
    if (this.cache.size > this.maxSize) {
      // Get entries sorted by timestamp (oldest first)
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      // Remove oldest 20% of entries
      const removeCount = Math.ceil(this.maxSize * 0.2);
      for (let i = 0; i < removeCount && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
        this.stats.evictions++;
      }
    }

    // Also clean up permission and domain caches periodically
    // to avoid them growing indefinitely
    if (this.permissionCache.size > this.maxSize * 20) {
      const now = Date.now();
      for (const [key, value] of this.permissionCache.entries()) {
        if (value.expiresAt < now) {
          this.permissionCache.delete(key);
        }
      }
    }

    if (this.domainCache.size > this.maxSize * 5) {
      const now = Date.now();
      for (const [key, value] of this.domainCache.entries()) {
        if (value.expiresAt < now) {
          this.domainCache.delete(key);
        }
      }
    }
  }

  /**
   * Clear the cache for a specific user
   * @param {Object|String} user - User object or user ID
   */
  clearUserCache(user) {
    if (!this.enabled) return;

    let key;
    if (typeof user === "string") {
      key = `user:${user}`;
    } else {
      key = this.getUserCacheKey(user);
    }

    if (!key) return;

    // Remove user permissions
    this.cache.delete(key);

    // Remove all related permission checks
    for (const permKey of this.permissionCache.keys()) {
      if (permKey.startsWith(key)) {
        this.permissionCache.delete(permKey);
      }
    }

    // Remove all related domain checks
    for (const domainKey of this.domainCache.keys()) {
      if (domainKey.startsWith(key)) {
        this.domainCache.delete(domainKey);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clearCache() {
    this.cache.clear();
    this.permissionCache.clear();
    this.domainCache.clear();

    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      permissionHits: 0,
      permissionMisses: 0,
      evictions: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalChecks = this.stats.hits + this.stats.misses;
    const hitRate = totalChecks > 0 ? (this.stats.hits / totalChecks) * 100 : 0;

    const totalPermChecks =
      this.stats.permissionHits + this.stats.permissionMisses;
    const permHitRate =
      totalPermChecks > 0
        ? (this.stats.permissionHits / totalPermChecks) * 100
        : 0;

    return {
      ...this.stats,
      totalChecks,
      hitRate: Math.round(hitRate * 100) / 100,
      permissionHitRate: Math.round(permHitRate * 100) / 100,
      cacheSize: this.cache.size,
      permissionCacheSize: this.permissionCache.size,
      domainCacheSize: this.domainCache.size,
    };
  }
}

// Create the cache instance
export const permissionCache = new PermissionCache({
  maxAge: process.env.PERMISSION_CACHE_MAX_AGE
    ? parseInt(process.env.PERMISSION_CACHE_MAX_AGE)
    : 120_000, // 2 minutes default
  maxSize: process.env.PERMISSION_CACHE_MAX_SIZE
    ? parseInt(process.env.PERMISSION_CACHE_MAX_SIZE)
    : 500, // 500 users default
  enabled: process.env.PERMISSION_CACHE_ENABLED !== "false",
});

// Uncached versions of the functions (used internally)
function getUserPermissionsUncached(user) {
  if (!user) return [];

  // Get user's role and explicit permissions from metadata
  const { role = "user", permissions = [] } = user.publicMetadata || {};

  // Merge role permissions with explicit permissions
  const rolePermissions =
    DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.user;

  // Return combined permissions (no duplicates)
  return [...new Set([...rolePermissions, ...permissions])];
}

function hasPermissionUncached(user, permission) {
  if (!user || !permission) return false;

  const userPermissions = getUserPermissionsUncached(user);
  return userPermissions.includes(permission);
}

function hasAllPermissionsUncached(user, permissions) {
  if (!user || !Array.isArray(permissions) || permissions.length === 0)
    return false;

  const userPermissions = getUserPermissionsUncached(user);
  return permissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

function hasAnyPermissionUncached(user, permissions) {
  if (!user || !Array.isArray(permissions) || permissions.length === 0)
    return false;

  const userPermissions = getUserPermissionsUncached(user);
  return permissions.some((permission) => userPermissions.includes(permission));
}

function getDomainPermissionsUncached(user, domain) {
  if (!user || !domain || !DOMAINS[domain]) return {};

  const userPermissions = getUserPermissionsUncached(user);
  const domainPermissions = PERMISSIONS[domain];

  if (!domainPermissions) return {};

  // Create an object with each permission name and whether the user has it
  const result = {};

  Object.entries(domainPermissions).forEach(([name, permission]) => {
    // Get the action part (after the colon)
    const action = permission.split(":")[1];
    // Store with the uppercase name as the key
    result[name] = userPermissions.includes(permission);
    // Also store with the action as the key for convenience
    if (action) {
      result[action] = userPermissions.includes(permission);
    }
  });

  return result;
}

/**
 * Gets all permissions for a user based on:
 * 1. Their role's default permissions
 * 2. Any explicitly granted permissions in their metadata
 *
 * @param {Object} user - Clerk user object
 * @returns {Array} Array of permission strings
 */
export function getUserPermissions(user) {
  return permissionCache.getUserPermissions(user);
}

/**
 * Checks if a user has a specific permission
 *
 * @param {Object} user - Clerk user object
 * @param {String} permission - Permission to check
 * @returns {Boolean} True if user has the permission
 */
export function hasPermission(user, permission) {
  return permissionCache.hasPermission(user, permission);
}

/**
 * Checks if a user has all of the specified permissions
 *
 * @param {Object} user - Clerk user object
 * @param {Array} permissions - Array of permissions to check
 * @returns {Boolean} True if user has all permissions
 */
export function hasAllPermissions(user, permissions) {
  if (!user || !Array.isArray(permissions) || permissions.length === 0)
    return false;

  // Use cache for individual permission checks
  return permissions.every((permission) =>
    permissionCache.hasPermission(user, permission)
  );
}

/**
 * Checks if a user has any of the specified permissions
 *
 * @param {Object} user - Clerk user object
 * @param {Array} permissions - Array of permissions to check
 * @returns {Boolean} True if user has at least one permission
 */
export function hasAnyPermission(user, permissions) {
  if (!user || !Array.isArray(permissions) || permissions.length === 0)
    return false;

  // Use cache for individual permission checks
  return permissions.some((permission) =>
    permissionCache.hasPermission(user, permission)
  );
}

/**
 * Gets permissions for a specific domain
 *
 * @param {Object} user - Clerk user object
 * @param {String} domain - Permission domain (e.g., "LISTINGS")
 * @returns {Object} Object with permission names as keys and boolean values
 */
export function getDomainPermissions(user, domain) {
  return permissionCache.getDomainPermissions(user, domain);
}

/**
 * Clear the permission cache for a specific user
 * Call this when a user's roles or permissions change
 *
 * @param {Object|String} user - User object or user ID
 */
export function clearUserPermissionCache(user) {
  permissionCache.clearUserCache(user);
}

/**
 * Get permission cache statistics
 * Useful for monitoring cache performance
 */
export function getPermissionCacheStats() {
  return permissionCache.getStats();
}

/**
 * Helper to add a temporary permission to a user
 *
 * @param {Object} user - Clerk user object
 * @param {String} permission - Permission to grant temporarily
 * @param {Number} durationMs - Duration in milliseconds
 * @returns {Object} Object with cleanup function to revoke permission
 */
export function addTemporaryPermission(user, permission, durationMs = 3600000) {
  if (!user || !permission) {
    return { success: false, error: "Invalid user or permission" };
  }

  // Store the original permissions
  const currentPermissions = [...(user.publicMetadata?.permissions || [])];

  // Add the new permission if it doesn't exist
  if (!currentPermissions.includes(permission)) {
    currentPermissions.push(permission);

    // Update user object (for in-memory changes)
    user.publicMetadata = {
      ...user.publicMetadata,
      permissions: currentPermissions,
      temporaryPermissions: {
        ...user.publicMetadata?.temporaryPermissions,
        [permission]: {
          grantedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + durationMs).toISOString(),
        },
      },
    };

    // Clear the cache for this user
    clearUserPermissionCache(user);

    // Create a cleanup function
    const cleanup = () => {
      // Remove the temporary permission
      const updatedPermissions = (
        user.publicMetadata?.permissions || []
      ).filter((p) => p !== permission);

      // Update the user object
      user.publicMetadata = {
        ...user.publicMetadata,
        permissions: updatedPermissions,
      };

      // Delete the temporary permission record
      if (user.publicMetadata?.temporaryPermissions) {
        const { [permission]: _, ...rest } =
          user.publicMetadata.temporaryPermissions;
        user.publicMetadata.temporaryPermissions = rest;
      }

      // Clear the cache
      clearUserPermissionCache(user);
    };

    // Schedule automatic cleanup
    const timeoutId = setTimeout(cleanup, durationMs);

    return {
      success: true,
      cleanup: () => {
        clearTimeout(timeoutId);
        cleanup();
      },
    };
  }

  return {
    success: false,
    error: "Permission already exists",
  };
}

/**
 * Middleware to check permissions for API routes or pages
 *
 * @param {String|Array} requiredPermissions - Permission(s) required to access the resource
 * @param {Object} options - Additional options
 * @returns {Function} Middleware function
 */
export function withPermissionCheck(requiredPermissions, options = {}) {
  const { anyPermission = false, redirectUrl = "/unauthorized" } = options;

  return async function permissionCheckMiddleware(req, res, next) {
    const user = req.auth?.user;

    if (!user) {
      if (res.redirect) {
        return res.redirect("/signin");
      }
      return res.status(401).json({ error: "Unauthorized" });
    }

    let hasAccess = false;

    if (Array.isArray(requiredPermissions)) {
      hasAccess = anyPermission
        ? hasAnyPermission(user, requiredPermissions)
        : hasAllPermissions(user, requiredPermissions);
    } else {
      hasAccess = hasPermission(user, requiredPermissions);
    }

    if (!hasAccess) {
      if (res.redirect) {
        return res.redirect(redirectUrl);
      }
      return res.status(403).json({ error: "Forbidden" });
    }

    if (next) {
      return next();
    }
  };
}
