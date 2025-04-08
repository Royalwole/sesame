import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "./db";
import User from "../models/User";

// Get the authenticated user with error handling
export async function getAuthenticatedUser(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return { authenticated: false, userId: null };
    }

    return {
      authenticated: true,
      userId,
    };
  } catch (_) {
    console.log("Error fetching user. User may not exist.");
    return { authenticated: false, userId: null, error };
  }
}

// Higher-order function for protecting API routes
export function withApiAuth(handler) {
  return async (req, res) => {
    try {
      const { authenticated, userId, error } = await getAuthenticatedUser(req);

      if (!authenticated) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "You must be signed in to access this resource",
        });
      }

      // Add auth info to request
      req.auth = { userId };

      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error("API auth middleware error:", error);
      return res.status(500).json({
        error: "Authentication error",
        message: error.message,
      });
    }
  };
}
