import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/api/public",
  "/auth/sign-in",
  "/auth/sign-up",
  "/listings",
  "/images",
  "/_next",
];

// Export the Clerk middleware with your custom authorization logic
export default clerkMiddleware((auth, request) => {
  // Safely access the pathname
  const pathname = request.nextUrl?.pathname || "";

  // Check if the current path is public
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If it's a protected route and user is not authenticated, redirect to sign-in
  if (!isPublic && !auth.userId && !pathname.includes("/auth/")) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

// Configure matcher to include API routes and other protected pages
export const config = {
  matcher: [
    // Match all API routes except public ones
    "/api/:path*",
    // Match auth-related routes
    "/dashboard/:path*",
    // Skip public assets and static files
    "/((?!_next/static|_next/image|favicon.png|images|public).*)",
  ],
};
