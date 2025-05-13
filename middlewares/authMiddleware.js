import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../lib/db";
import User from "../models/User";
import { ROLES, hasAnyRole } from "../lib/role-management";
import { getUserRole, getApprovalStatus } from "../lib/clerk-client";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "../lib/permissions-manager";

// Constants for consistent response messages
const AUTH_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  USER_NOT_FOUND: "User not found",
  FORBIDDEN: "Permission denied",
  SERVER_ERROR: "Server error",
  ADMIN_REQUIRED: "Admin access required",
  AGENT_REQUIRED: "Agent role required",
  PERMISSION_REQUIRED: "Required permission not granted",
};

/**
 * Basic authentication middleware - checks if user is logged in
 * Enhanced with better error handling and request augmentation
 */
export function requireAuth(handler) {
  return async (req, res) => {
    try {
      // Get auth data from Clerk
      const auth = getAuth(req);
      const { userId } = auth;

      // No authenticated user
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: AUTH_MESSAGES.UNAUTHORIZED,
        });
      }

      // Add auth data to the request object for convenience in handlers
      req.auth = auth;

      // Also add direct access to userId for convenience
      req.userId = userId;

      // Ensure sessionClaims is available for fallback user data
      req.sessionClaims = auth.sessionClaims || {};

      // User is authenticated, continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("Error in requireAuth middleware:", error);

      // Even in case of auth error, return a clean 401 rather than 500
      // This prevents cascading failures in the auth flow
      return res.status(401).json({
        success: false,
        error: AUTH_MESSAGES.UNAUTHORIZED,
        message: "Authentication error occurred",
      });
    }
  };
}

/**
 * Middleware to require user data from database - useful for routes
 * that need user profile data (not just authentication)
 */
export function requireUser(handler) {
  return requireAuth(async (req, res) => {
    try {
      // Get auth data from previous middleware
      const { userId } = getAuth(req);

      // Connect to the database
      await connectDB();

      // Find the user in our database
      const user = await User.findOne({ clerkId: userId });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: AUTH_MESSAGES.USER_NOT_FOUND,
        });
      }

      // Add user to the request object for the next handler
      req.user = user;
      req.userId = userId;

      // Continue to the handler
      return handler(req, res);
    } catch (error) {
      console.error("Error in requireUser middleware:", error);
      return res.status(500).json({
        success: false,
        error: AUTH_MESSAGES.SERVER_ERROR,
        message: error.message,
      });
    }
  });
}

/**
 * Enhanced middleware that attaches the Clerk user object
 * and uses Clerk as the source of truth for roles
 */
export function requireClerkUser(handler) {
  return requireAuth(async (req, res) => {
    try {
      // Get auth data from previous middleware
      const auth = getAuth(req);
      const { userId } = auth;

      // Get the clerk user
      const clerkUser = auth.user;
      if (!clerkUser) {
        return res.status(404).json({
          success: false,
          error: AUTH_MESSAGES.USER_NOT_FOUND,
        });
      }

      // Add Clerk user to the request
      req.clerkUser = clerkUser;
      req.userId = userId;

      // Also attach role info directly from Clerk for convenience
      req.userRole = getUserRole(clerkUser);
      req.isApproved = getApprovalStatus(clerkUser);

      // Also fetch database user if available (but don't require it)
      try {
        await connectDB();
        const dbUser = await User.findOne({ clerkId: userId });
        if (dbUser) {
          req.user = dbUser;
        }
      } catch (dbError) {
        console.warn("Could not fetch database user:", dbError.message);
        // Continue anyway - we're using Clerk as source of truth
      }

      // Continue to the handler
      return handler(req, res);
    } catch (error) {
      console.error("Error in requireClerkUser middleware:", error);
      return res.status(500).json({
        success: false,
        error: AUTH_MESSAGES.SERVER_ERROR,
        message: error.message,
      });
    }
  });
}

/**
 * Middleware to check if user is an agent (or pending agent)
 */
export function requireAgentAuth(handler) {
  return requireClerkUser(async (req, res) => {
    const { clerkUser, userRole } = req;

    // Check if user has agent role (approved or pending)
    if (userRole !== ROLES.AGENT && userRole !== ROLES.AGENT_PENDING) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.AGENT_REQUIRED,
      });
    }

    // Continue to handler
    return handler(req, res);
  });
}

/**
 * Middleware to check if user is an approved agent only (not pending)
 */
export function requireApprovedAgentAuth(handler) {
  return requireClerkUser(async (req, res) => {
    const { clerkUser, userRole, isApproved } = req;

    // Must be an agent AND approved
    if (userRole !== ROLES.AGENT || !isApproved) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.AGENT_REQUIRED,
        message: "Only approved agents can access this resource",
      });
    }

    // Continue to handler
    return handler(req, res);
  });
}

/**
 * Middleware to check if user is an admin
 */
export function requireAdmin(handler) {
  return requireClerkUser(async (req, res) => {
    const { clerkUser, userRole } = req;

    // Check if user is admin or super_admin
    if (userRole !== ROLES.ADMIN && userRole !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.ADMIN_REQUIRED,
      });
    }

    // Continue to handler
    return handler(req, res);
  });
}

/**
 * Middleware to check for specific role(s)
 */
export function requireRole(roles) {
  return requireClerkUser(async (req, res) => {
    // Convert to array if single role provided
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const { userRole } = req;

    // Check if user has any of the required roles
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.FORBIDDEN,
        message: `Required role: ${requiredRoles.join(" or ")}`,
      });
    }

    // Continue to handler
    return handler(req, res);
  });
}

/**
 * Middleware to require a specific permission
 * Uses Clerk's metadata to check for permissions
 *
 * @param {String} permission - The permission string to check for
 * @returns {Function} - Middleware function
 */
export function requirePermission(permission) {
  if (!permission) {
    throw new Error("Permission parameter is required");
  }

  return requireClerkUser(async (req, res) => {
    const { clerkUser } = req;

    // Check if user has this permission
    if (!hasPermission(clerkUser, permission)) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.PERMISSION_REQUIRED,
        message: `Required permission: ${permission}`,
      });
    }

    // Continue to handler
    return handler(req, res);
  });
}

/**
 * Middleware to require all specified permissions
 *
 * @param {Array<String>} permissions - Array of permissions required
 * @returns {Function} - Middleware function
 */
export function requireAllPermissions(permissions) {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    throw new Error("Valid permissions array is required");
  }

  return requireClerkUser(async (req, res) => {
    const { clerkUser } = req;

    // Check if user has all specified permissions
    if (!hasAllPermissions(clerkUser, permissions)) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.PERMISSION_REQUIRED,
        message: `Required permissions: ${permissions.join(", ")}`,
      });
    }

    // Continue to handler
    return handler(req, res);
  });
}

/**
 * Middleware to require any of the specified permissions
 *
 * @param {Array<String>} permissions - Array of possible permissions
 * @returns {Function} - Middleware function
 */
export function requireAnyPermission(permissions) {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    throw new Error("Valid permissions array is required");
  }

  return requireClerkUser(async (req, res) => {
    const { clerkUser } = req;

    // Check if user has any of the specified permissions
    if (!hasAnyPermission(clerkUser, permissions)) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.PERMISSION_REQUIRED,
        message: `Required at least one of these permissions: ${permissions.join(", ")}`,
      });
    }

    // Continue to handler
    return handler(req, res);
  });
}
