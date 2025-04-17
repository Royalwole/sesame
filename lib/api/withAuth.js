import { getAuth } from "@clerk/nextjs/server";
import { withJsonResponse } from "./middleware";

/**
 * Higher-order function to protect API routes with Clerk authentication
 * @param {Function} handler - The API route handler to protect
 * @param {Object} options - Configuration options
 * @returns {Function} Protected API handler
 */
export function withClerkAuth(handler, options = {}) {
  return withJsonResponse(async (req, res) => {
    try {
      // Get authentication info
      const auth = getAuth(req);

      // Check if user is authenticated
      if (!auth?.userId) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      // Add auth to req object for use in handler
      req.auth = auth;

      // Continue to the handler
      return handler(req, res);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        success: false,
        error: "Authentication error",
        message: "Failed to verify authentication",
      });
    }
  });
}
