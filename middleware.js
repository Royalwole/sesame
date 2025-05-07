// Middleware Configuration
import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Configuration for public routes and authentication
const AUTH_CONFIG = {
  // Routes that are publicly accessible
  publicPaths: [
    "/", // Home page
    "/about", // About page
    "/contact", // Contact page
    "/listings", // Public listings
    "/images/", // Public images
    "/api/public/", // Public API endpoints
    "/api/webhooks/", // Webhooks
    "/api/debug/", // Debug endpoints
    "/debug/", // Debug pages
    "/_next", // Next.js assets
    "/favicon", // Favicons
    "/api/health", // Health check endpoint
    "/static/", // Static assets
    "/fonts/", // Font assets
    "/icons/", // Icon assets
    "/clerk", // Clerk related paths
  ],

  // Sign-in path for redirects
  signInUrl: "/auth/sign-in",
};

/**
 * Determines if a route is public and doesn't require authentication
 */
function isPublicRoute(path) {
  return AUTH_CONFIG.publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(publicPath)
  );
}

/**
 * Determines if this is an auth-related path
 */
function isAuthPath(path) {
  return path.startsWith("/auth/");
}

/**
 * Determines if this is a Clerk-related path
 */
function isClerkPath(path) {
  return path.includes("/@clerk") || path.includes("/__clerk");
}

/**
 * Handles authentication and protection of routes using Clerk middleware
 * with added error handling to prevent middleware crashes
 */
export default function middleware(request) {
  try {
    // Get the current path
    const { pathname } = request.nextUrl;

    // Check if this is a public route (no auth needed)
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Check if this is an auth-related path
    if (isAuthPath(pathname) || isClerkPath(pathname)) {
      return NextResponse.next();
    }

    // Use getAuth instead of relying on the middleware param
    const auth = getAuth(request);
    const userId = auth.userId;

    // Skip redirects for API routes to prevent redirect loops
    const isApiRoute = pathname.startsWith("/api/");

    // For protected routes, check if user is authenticated
    if (!userId && !isApiRoute) {
      // Create sign in URL with redirect back to the current page
      const signInUrl = new URL(AUTH_CONFIG.signInUrl, request.url);

      // Only add redirect for page routes, not for API routes
      if (!pathname.startsWith("/api/")) {
        // Use just the pathname to avoid encoding issues with full URLs
        signInUrl.searchParams.set("redirect_url", pathname);
      }

      return NextResponse.redirect(signInUrl);
    }

    // User is authenticated or this is an API route, allow the request
    return NextResponse.next();
  } catch (error) {
    // If anything fails in the middleware, log the error and allow the request through
    console.error("[Middleware Error]", error);

    // Return a next response to prevent the middleware from crashing
    return NextResponse.next();
  }
}

// We still need Clerk to protect our routes, but we handle auth logic ourselves
export const config = {
  matcher: [
    // Match all except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Include API routes
    "/api/:path*",
  ],
};
