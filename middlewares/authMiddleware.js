import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../lib/db";
import User from "../models/User";
import {
  ROLES,
  isAdmin,
  isAnyAgent,
  isApprovedAgent,
  isPendingAgent,
  hasAnyRole,
} from "../lib/role-management";

// Constants for consistent response messages
const AUTH_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  USER_NOT_FOUND: "User not found",
  FORBIDDEN: "Permission denied",
  SERVER_ERROR: "Server error",
  ADMIN_REQUIRED: "Admin access required",
  AGENT_REQUIRED: "Agent role required",
};

/**
 * Basic authentication middleware - checks if user is logged in
 */
export function requireAuth(handler) {
  return async (req, res) => {
    try {
      // Get auth from Clerk
      const auth = getAuth(req);

      // Check for userId (authenticated user)
      if (!auth?.userId) {
        return res.status(401).json({
          success: false,
          error: AUTH_MESSAGES.UNAUTHORIZED,
        });
      }

      // Add auth info to request object
      req.auth = { userId: auth.userId };

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        success: false,
        error: AUTH_MESSAGES.SERVER_ERROR,
        message: error.message,
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
    let dbConnection = false;

    try {
      // Connect to database
      await connectDB();
      dbConnection = true;

      // Get user from database
      const user = await User.findOne({ clerkId: req.auth.userId }).lean();

      // Check if user exists in database
      if (!user) {
        return res.status(404).json({
          success: false,
          error: AUTH_MESSAGES.USER_NOT_FOUND,
        });
      }

      // Add user to request
      req.user = user;
      req.auth.user = user;

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("User middleware error:", error);
      return res.status(500).json({
        success: false,
        error: AUTH_MESSAGES.SERVER_ERROR,
        message: error.message,
      });
    } finally {
      // Always close DB connection
      if (dbConnection) {
        await disconnectDB();
      }
    }
  });
}

/**
 * Middleware to check if user is an agent (or pending agent)
 */
export function requireAgentAuth(handler) {
  return requireUser(async (req, res) => {
    // Check if user has agent role using the centralized role management
    if (!isAnyAgent(req.user)) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.FORBIDDEN,
        message: AUTH_MESSAGES.AGENT_REQUIRED,
      });
    }

    // Add agent-specific properties
    req.isApprovedAgent = isApprovedAgent(req.user);
    req.isPendingAgent = isPendingAgent(req.user);

    // Continue to handler
    return handler(req, res);
  });
}

/**
 * Middleware to check if user is an approved agent only (not pending)
 */
export function requireApprovedAgentAuth(handler) {
  return requireUser(async (req, res) => {
    // Check if user is an approved agent
    if (!isApprovedAgent(req.user)) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.FORBIDDEN,
        message: "Approved agent access required",
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
  return requireUser(async (req, res) => {
    // Check if user has admin role using the centralized role management
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        error: AUTH_MESSAGES.FORBIDDEN,
        message: AUTH_MESSAGES.ADMIN_REQUIRED,
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
  return requireUser(async (req, res) => {
    // Convert to array if single role provided
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user has any of the required roles using the centralized role management
    if (!hasAnyRole(req.user, requiredRoles)) {
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
