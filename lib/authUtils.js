import { withClerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Use withClerkMiddleware for Pages Router API routes
export const withAuth = (handler) =>
  withClerkMiddleware((req, res) => {
    // Get auth information
    const auth = getAuth(req);

    // Add auth info to the request object for easier access in handlers
    req.auth = auth;

    // Continue to the handler
    return handler(req, res);
  });

// Helper to check if a route should be public
export const isPublicRoute = (path) => {
  const publicRoutes = [
    "/",
    "/about",
    "/contact",
    "/listings",
    "/auth",
    "/sign-in",
    "/sign-up",
    "/api/debug",
    "/api/public",
    "/api/listings",
  ];

  return publicRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
};

// Higher-order function to protect API routes
export const protectApiRoute = (handler) => async (req, res) => {
  const { userId } = getAuth(req);

  // If path should be public, skip authentication
  if (isPublicRoute(req.url)) {
    return handler(req, res);
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Add auth info to req
  req.auth = { userId };

  return handler(req, res);
};

// Admin middleware for api routes
export const requireAdmin = (handler) => async (req, res) => {
  // First check authentication
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Additional admin check logic here
  // For now, passing through since we'll implement this in the user service

  req.auth = { userId };
  return handler(req, res);
};
