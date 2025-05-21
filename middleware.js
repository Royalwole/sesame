// Middleware Configuration
import { clerkMiddleware } from "@clerk/nextjs/server";
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
    "/faq", // FAQ page
    "/auth/agent-signup", // Agent signup path
    "/auth/admin-signup", // Admin signup path
    "/api/auth/set-role-agent", // API for setting agent role after signup
    "/api/auth/set-role-admin", // API for setting admin role after signup
  ],

  // Sign-in path for redirects
  signInUrl: "/auth/sign-in",

  // Loop detection configuration
  loopDetection: {
    maxRedirects: 2, // Reduced to be more aggressive at detecting loops
    cookieName: "td_redirect_count",
    timeout: 60, // Reset counter after 60 seconds
  },
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
 * Determines if this is a special signup path that needs unrestricted access
 */
function isSpecialSignupPath(path) {
  return (
    path.startsWith("/auth/agent-signup") ||
    path.startsWith("/auth/admin-signup")
  );
}

/**
 * Check for potential redirect loops and prevent them
 */
function detectRedirectLoop(request) {
  // Get cookie to track redirects
  const cookies = request.cookies;
  const redirectCountCookie = cookies.get(AUTH_CONFIG.loopDetection.cookieName);
  let redirectCount = redirectCountCookie
    ? parseInt(redirectCountCookie.value)
    : 0;

  // Check timestamp to potentially reset the counter
  const now = Date.now();
  const timestampCookie = cookies.get(
    `${AUTH_CONFIG.loopDetection.cookieName}_ts`
  );
  const timestamp = timestampCookie ? parseInt(timestampCookie.value) : now;

  // Reset counter if timeout has passed
  if (now - timestamp > AUTH_CONFIG.loopDetection.timeout * 1000) {
    redirectCount = 0;
  }

  // Get URL information
  const url = new URL(request.url);
  const pathname = url.pathname;

  // IMMEDIATE CHECK FOR PROBLEMATIC PATTERNS - Detect many forms of loops

  // 1. Check for multiple timestamps - classic sign of a loop
  const hasMultipleTimestamps = (url.search.match(/t=/g) || []).length > 1;

  // 2. Check for redirect counters
  const hasRedirectCounter = url.searchParams.has("rc");

  // 3. Check for sign-in to dashboard patterns (most common loop)
  const isSignIn = pathname === AUTH_CONFIG.signInUrl;
  const isDashboard = pathname.startsWith("/dashboard/");
  const hasRedirectUrl = url.searchParams.has("redirect_url");

  // 4. Check if the redirect_url parameter points back to the same type of page
  let redirectLoopDetected = false;
  if (isSignIn && hasRedirectUrl) {
    const redirectUrl = url.searchParams.get("redirect_url");
    try {
      // If we're at sign-in and redirect_url points to sign-in, that's a loop
      if (redirectUrl.includes("/auth/sign-in")) {
        redirectLoopDetected = true;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Short-circuit the loop detection if we see any problematic patterns
  if (
    hasMultipleTimestamps ||
    redirectLoopDetected ||
    (isSignIn && hasRedirectCounter) ||
    (isSignIn && url.searchParams.has("breakLoop"))
  ) {
    console.warn("[Middleware] Loop pattern detected in URL", {
      path: url.pathname,
      hasMultipleTimestamps,
      hasRedirectCounter,
      redirectLoopDetected,
      search: url.search,
    });
    return {
      inLoop: true,
      response: NextResponse.next(),
      redirectCount: redirectCount + 1,
    };
  }

  // Check if we're heading to sign-in page and increment counter
  const isRedirectingToSignIn = pathname === AUTH_CONFIG.signInUrl;
  if (isRedirectingToSignIn) {
    redirectCount++;
  }

  // More aggressive loop detection - reduce threshold to 2 redirects
  const inLoop = redirectCount >= AUTH_CONFIG.loopDetection.maxRedirects;

  // Prepare response to track redirects
  const response = NextResponse.next();

  // Update or set cookies
  response.cookies.set(
    AUTH_CONFIG.loopDetection.cookieName,
    redirectCount.toString(),
    {
      maxAge: AUTH_CONFIG.loopDetection.timeout, // seconds
      path: "/",
    }
  );

  response.cookies.set(
    `${AUTH_CONFIG.loopDetection.cookieName}_ts`,
    now.toString(),
    {
      maxAge: AUTH_CONFIG.loopDetection.timeout, // seconds
      path: "/",
    }
  );

  return { inLoop, response, redirectCount };
}

/**
 * Handles authentication and protection of routes using Clerk middleware
 * with added error handling to prevent middleware crashes
 */
export default clerkMiddleware((auth, request) => {
  try {
    // Get the current path - correctly access URL from the request
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CRITICAL: Check for circuit breaker parameter
    if (url.searchParams.get("noRedirect") === "true") {
      console.log(
        "[Middleware] Circuit breaker activated, skipping all redirects"
      );
      return NextResponse.next();
    }

    // Always pass through Clerk's own paths to prevent any interference
    if (pathname.includes("/@clerk") || pathname.includes("/__clerk")) {
      return NextResponse.next();
    }

    // Always pass through static assets
    if (
      pathname.startsWith("/_next/") ||
      pathname.includes(".ico") ||
      pathname.includes(".png") ||
      pathname.includes(".jpg") ||
      pathname.includes(".svg") ||
      pathname.includes(".css") ||
      pathname.includes(".js") ||
      pathname.startsWith("/fonts/") ||
      pathname.startsWith("/images/") ||
      pathname.startsWith("/icons/")
    ) {
      return NextResponse.next();
    }

    // Check if this is a public route (no auth needed)
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Check if this is an auth-related path or special signup path
    if (isAuthPath(pathname) || isSpecialSignupPath(pathname)) {
      return NextResponse.next();
    }

    // We already have auth from middleware params
    const userId = auth.userId;
    const user = auth.user;

    // Skip redirects for API routes, images, and static files
    const isApiRoute = pathname.startsWith("/api/");
    const isStaticAsset =
      pathname.startsWith("/_next/") ||
      pathname.includes(".ico") ||
      pathname.includes(".svg") ||
      pathname.includes(".png") ||
      pathname.includes(".jpg") ||
      pathname.includes(".css") ||
      pathname.includes(".js");

    // For protected routes, check if user is authenticated
    if (!userId && !isApiRoute && !isStaticAsset) {
      // Check for redirect loops before performing a redirect
      const loopCheck = detectRedirectLoop(request);

      // If we detect a loop, break it by allowing the request through with circuit breaker
      if (
        loopCheck.inLoop ||
        loopCheck.redirectCount >= AUTH_CONFIG.loopDetection.maxRedirects - 1
      ) {
        console.warn(
          `[Middleware] Redirect loop detected (${loopCheck.redirectCount} redirects). Breaking loop.`
        );
        // Just continue to the requested page with a circuit breaker
        const currentPath =
          pathname +
          url.search +
          (url.search ? "&" : "?") +
          "noRedirect=true&breakLoop=true";
        const currentUrl = new URL(currentPath, request.url);
        return NextResponse.redirect(currentUrl);
      }

      // Create sign in URL with redirect back to the current page
      const signInUrl = new URL(AUTH_CONFIG.signInUrl, request.url);

      // Add a timestamp to prevent caching issues
      signInUrl.searchParams.set("t", Date.now().toString());

      // Only add redirect for page routes, not for API routes
      if (!isApiRoute && !isStaticAsset) {
        // Use just the pathname and any query parameters for the redirect
        const redirectPath = pathname + url.search;

        // Always add breakLoop param to sign-in if there's any indication of a potential loop
        if (
          loopCheck.redirectCount >=
            AUTH_CONFIG.loopDetection.maxRedirects - 2 ||
          url.search.includes("t=") ||
          url.pathname.includes("/dashboard/")
        ) {
          signInUrl.searchParams.set("breakLoop", "true");
        }

        signInUrl.searchParams.set("redirect_url", redirectPath);
      }

      return NextResponse.redirect(signInUrl);
    } // CRITICAL CHANGE: For dashboard routes, if there's any sign of a loop, just send to user dashboard
    if (pathname.includes("/dashboard/") && userId && user) {
      // Skip API routes and static assets
      if (isApiRoute || isStaticAsset) {
        return NextResponse.next();
      }

      // Check for signs of a redirect loop
      const loopCheck = detectRedirectLoop(request);

      // Get the current URL search parameters
      const searchParams = url.searchParams;
      const hasTimestamp = searchParams.has("t");
      const hasRedirectCounter = searchParams.has("rc");
      const breakLoop = searchParams.get("breakLoop") === "true";

      // If user has explicitly requested to break the loop, always honor this
      if (breakLoop) {
        console.log(
          "[Middleware] Breaking loop as requested via URL parameter"
        );
        return NextResponse.next();
      }

      // If we detect a potential loop, redirect to the fix-dashboard utility instead
      if (
        loopCheck.inLoop ||
        loopCheck.redirectCount > 2 ||
        (hasTimestamp && hasRedirectCounter)
      ) {
        console.warn(
          "[Middleware] Potential dashboard loop detected, redirecting to fix utility"
        ); // Don't redirect if already on any fix or debug page
        if (
          pathname === "/fix-dashboard" ||
          pathname === "/fix-permission-cache" ||
          pathname === "/emergency-fix" ||
          pathname === "/debug-permissions" ||
          pathname === "/bypass-agent"
        ) {
          return NextResponse.next();
        }

        // Redirect to the emergency fix tool which can directly fix account issues
        const emergencyUrl = new URL("/emergency-fix", request.url);
        emergencyUrl.searchParams.set("from", pathname);
        emergencyUrl.searchParams.set("t", Date.now());
        return NextResponse.redirect(emergencyUrl);
      }

      // For all other cases, let the page handle any necessary redirections
      return NextResponse.next();
    }

    // User is authenticated or this is an API route, allow the request
    return NextResponse.next();
  } catch (error) {
    // If anything fails in the middleware, log the error and allow the request through
    console.error("[Middleware Error]", error);

    // Return a next response to prevent the middleware from crashing
    return NextResponse.next();
  }
});

// We still need Clerk to protect our routes, but we handle auth logic ourselves
export const config = {
  matcher: [
    // Match all except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Include API routes
    "/api/:path*",
  ],
};
