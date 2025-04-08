// Import only what's needed
import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../lib/db";
import User from "../models/User";
import { isAgent } from "../lib/user-utils";

/**
 * Middleware to validate user authentication for API routes
 */
export function requireAuth(handler) {
  return async (req, res) => {
    try {
      // Add debug logging for all headers (sanitized)
      const sanitizedHeaders = Object.keys(req.headers).reduce((acc, key) => {
        acc[key] =
          key.toLowerCase().includes("auth") ||
          key.toLowerCase().includes("cookie")
            ? "[REDACTED]"
            : req.headers[key];
        return acc;
      }, {});

      console.log(`Auth middleware for ${req.url}:`, {
        headers: sanitizedHeaders,
        method: req.method,
      });

      // Get auth information directly from Clerk
      const auth = getAuth(req);

      if (!auth) {
        console.error("Auth object is null or undefined");
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication missing",
        });
      }

      // Log authentication status
      console.log("Auth status for request:", {
        hasAuth: !!auth,
        hasUserId: !!auth?.userId,
        userId: auth?.userId || "Not found",
      });

      // Check if user is authenticated
      if (!auth?.userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User ID missing",
        });
      }

      // Add userId to request auth object
      req.auth = { userId: auth.userId };

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        error: "Authentication error",
        message: error.message || "An error occurred during authentication",
      });
    }
  };
}

/**
 * Middleware to verify agent permissions
 */
export function requireAgentAuth(handler) {
  return async (req, res) => {
    let dbConnection = false;

    try {
      // Get auth details
      const auth = getAuth(req);

      if (!auth?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Connect to DB
      await connectDB();
      dbConnection = true;

      // Check if user is an agent in our database
      const user = await User.findOne({ clerkId: auth.userId }).lean();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Allow both regular and pending agents
      if (!isAgent(user)) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Agent role required",
        });
      }

      // Add user to request for downstream handlers
      req.user = user;
      req.auth = { userId: auth.userId, user };
      req.isApprovedAgent = user.role === "agent" && user.approved;

      // Execute the handler
      return handler(req, res);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        error: "Server error",
        message: "Failed to verify agent status",
      });
    } finally {
      if (dbConnection) {
        await disconnectDB();
      }
    }
  };
}

/**
 * Middleware to validate admin role
 */
export function requireAdmin(handler) {
  return async (req, res) => {
    let dbConnection = false;
    try {
      // First check authentication
      const auth = getAuth(req);
      if (!auth?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Connect to DB
      await connectDB();
      dbConnection = true;

      // Check admin role in database
      const user = await User.findOne({ clerkId: auth.userId }).lean();

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          error: "Forbidden",
          message: "Admin access required",
        });
      }

      req.auth = { userId: auth.userId, user };
      return handler(req, res);
    } catch (error) {
      console.error("Admin auth middleware error:", error);
      return res.status(500).json({ error: "Authentication error" });
    } finally {
      if (dbConnection) {
        await disconnectDB();
      }
    }
  };
}
