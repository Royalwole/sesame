import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const publicPaths = [
  "/",
  "/auth/sign-in*",
  "/auth/sign-up*",
  "/auth/[[...clerk]]*",
  "/listings*",
  "/contact",
  "/about",
  "/api/public*",
  // Add api routes to public paths to prevent middleware from interfering with API responses
  "/_next*",
  "/favicon*",
];

// Helper function to check if a path is public
function isPublicPath(path) {
  return publicPaths.some((publicPath) => {
    if (publicPath.endsWith("*")) {
      const prefix = publicPath.slice(0, -1);
      return path.startsWith(prefix);
    }
    return path === publicPath;
  });
}

// Safely create a URL with fallbacks
function safeCreateURL(path, base) {
  try {
    // If base is provided and valid, use it
    if (base) {
      return new URL(path, base);
    }

    // Otherwise create an absolute URL
    return new URL(
      `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}${path}`
    );
  } catch (e) {
    console.error("[Middleware] Error creating URL:", e);
    // Fallback to a basic URL
    return new URL(`http://localhost:3000${path}`);
  }
}

// Helper to validate allowed referers
function isAllowedReferer(referer) {
  try {
    const refererUrl = new URL(referer);
    const allowedHosts = [
      "localhost",
      "topdial.ng",
      "www.topdial.ng",
      // Add your allowed domains here
    ];

    return allowedHosts.some(
      (host) =>
        refererUrl.hostname === host ||
        refererUrl.hostname.endsWith(`.${host}`)
    );
  } catch (error) {
    return false;
  }
}

// Create custom auth checking function
function customMiddleware(auth, req) {
  // Get base url for redirects
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  // Safely access req.nextUrl and pathname with fallbacks
  let path = "/";
  let fullUrl = baseUrl;

  try {
    // Try to get the path from nextUrl
    if (req?.nextUrl?.pathname) {
      path = req.nextUrl.pathname;
      fullUrl = req.nextUrl.href || baseUrl;
    } else if (req?.url) {
      // Fallback to req.url if available
      const urlObj = new URL(req.url);
      path = urlObj.pathname;
      fullUrl = req.url;
    }
  } catch (e) {
    console.error("[Middleware] Error parsing URL:", e);
    // Keep defaults if there's an error
  }

  // Ensure auth is properly defined with defaults if missing
  const safeAuth = auth || { userId: null };

  // IMPORTANT: Add prevention for redirect loops and exclude specific API routes
  // Check if the path is an excluded API path
  const isExcludedApiPath =
    path.startsWith("/api/clerk") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/trpc");

  // Check if coming from a sign-in redirect
  const isFromSignIn = req.nextUrl?.searchParams?.get("from") === "signin";

  // Extract the current URL for logging
  const currentUrl = req.nextUrl?.href || req.url || "/";

  console.log(
    `[Middleware] Checking path: ${path} | isPublic: ${isPublicPath(
      path
    )} | userId: ${safeAuth?.userId} | url: ${currentUrl}`
  );

  // CRITICAL FIX: Special handling for Clerk auth pages & redirect loop prevention
  // Always allow access to auth pages & excluded API routes without redirecting
  if (
    path.startsWith("/auth/") ||
    path.includes("/auth/[[...clerk]]") ||
    path === "/auth" ||
    isExcludedApiPath ||
    isFromSignIn // Don't redirect again if we just came from sign-in
  ) {
    console.log("[Middleware] Allowing direct access to path:", path);
    return NextResponse.next();
  }

  // Add CSRF protection for mutation operations
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const csrfToken = req.headers.get("x-csrf-token");
    const referer = req.headers.get("referer");

    // Verify CSRF token for authenticated requests modifying data
    // This is a basic implementation - you'd typically use a proper CSRF library
    if (safeAuth?.userId && (!csrfToken || csrfToken !== process.env.CSRF_SECRET)) {
      console.error("[Middleware] CSRF token validation failed");

      // Only apply CSRF protection to API routes that modify data
      if (path.startsWith("/api/") && !path.includes("/api/public/")) {
        console.log("[Middleware] Blocked request due to CSRF protection");
        return NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        );
      }
    }

    // Check referer for cross-site requests
    if (referer && !isAllowedReferer(referer)) {
      console.log("[Middleware] Blocked request with invalid referer");
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }
  }

  // If the user is not signed in and the path is not public, redirect to sign-in
  if (!safeAuth.userId && !isPublicPath(path)) {
    // Don't redirect to sign-in if we're coming from there already (prevent loop)
    if (path.includes("/sign-in") || isFromSignIn) {
      console.log("[Middleware] Avoiding redirect loop for:", path);
      return NextResponse.next();
    }

    console.log(
      "[Middleware] Redirecting unauthenticated user from",
      path,
      "to sign-in"
    );

    try {
      // Create sign-in URL safely with loop prevention
      const signInUrl = safeCreateURL("/auth/sign-in", fullUrl);
      signInUrl.searchParams.set("redirect_url", fullUrl);
      signInUrl.searchParams.set("from", "signin"); // Add marker to prevent loops
      return NextResponse.redirect(signInUrl);
    } catch (e) {
      console.error("[Middleware] Error redirecting to sign-in:", e);
      // Fallback to a basic redirect
      return NextResponse.redirect(new URL("/auth/sign-in", baseUrl));
    }
  }

  // Handle /dashboard root path - redirect to appropriate dashboard based on role
  if (safeAuth.userId && path === "/dashboard") {
    const userRole = safeAuth.sessionClaims?.metadata?.role;
    let dashboardPath = "/dashboard";

    if (userRole === "agent" || userRole === "agent_pending") {
      dashboardPath = "/dashboard/agent";
    } else if (userRole === "admin") {
      dashboardPath = "/dashboard/admin";
    }

    // Only redirect if we need to go to a different dashboard
    if (dashboardPath !== "/dashboard") {
      try {
        const dashboardUrl = safeCreateURL(dashboardPath, fullUrl);
        return NextResponse.redirect(dashboardUrl);
      } catch (e) {
        console.error(
          "[Middleware] Error redirecting to specific dashboard:",
          e
        );
        return NextResponse.redirect(new URL(dashboardPath, baseUrl));
      }
    }
  }

  // All other requests continue normally
  return NextResponse.next();
}

// Export middleware properly using Clerk's requirements
export default clerkMiddleware((req) => {
  try {
    // Get auth from Clerk - could be undefined in some cases
    const auth = req.auth;

    // Handle the request with our custom middleware
    return customMiddleware(auth, req);
  } catch (error) {
    console.error("[Middleware] Error:", error);
    // On error, allow the request to proceed
    return NextResponse.next();
  }
});

// Only run middleware on matching routes with a simpler pattern
export const config = {
  matcher: [
    // Match explicit paths and avoid regex patterns that cause errors
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/listings/:path*",
    "/contact",
    "/about",
    "/auth/:path*",
    "/api/:path*",
  ],
};
