import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/utils/Loader";
import {
  ROLES,
  hasRole,
  isAdmin,
  isAnyAgent,
  isApprovedAgent,
  getDashboardByRole,
} from "./role-management";

/**
 * Higher Order Component for protecting routes with authentication
 * @param {Object} options - Configuration options
 * @param {string} options.role - Required role to access the page (optional)
 * @returns {Function} getServerSideProps function
 */
export function withAuth(options = {}) {
  return async (context) => {
    // Server-side authentication check is handled on the client side
    // For server-side props if needed
    return {
      props: {},
    };
  };
}

/**
 * Client-side auth guard component that redirects based on auth state
 */
export function AuthGuard({ children, role }) {
  const { isLoaded, isSignedIn } = useUser();
  const { dbUser, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Preserve the current URL for redirect after login
  const currentPath = router.asPath;
  const encodedRedirect = encodeURIComponent(currentPath);

  // Show loading state while checking auth
  if (isLoading || !isLoaded) {
    return <Loader message="Checking authentication..." />;
  }

  // Redirect to login if not signed in
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    router.replace(`/auth/sign-in?redirect_url=${encodedRedirect}`);
    return <Loader message="Redirecting to login..." />;
  }

  // Role-based access control
  if (role) {
    // Determine if the user has the required role using our role management system
    let hasRequiredRole = false;

    switch (role) {
      case ROLES.ADMIN:
        hasRequiredRole = isAdmin(dbUser);
        break;
      case ROLES.AGENT:
        hasRequiredRole = isAnyAgent(dbUser);
        break;
      case "approved_agent": // Special case for approved agents only
        hasRequiredRole = isApprovedAgent(dbUser);
        break;
      case ROLES.USER:
        // Everyone with an account has at least user access
        hasRequiredRole = true;
        break;
      default:
        // Custom role check
        hasRequiredRole = hasRole(dbUser, role);
    }

    if (!hasRequiredRole) {
      // If user lacks permission, redirect to appropriate dashboard using our utility
      const redirectPath = getDashboardByRole(dbUser);
      const message = "You don't have permission to access that page";

      console.log(
        `Access denied: User doesn't have role "${role}", redirecting to ${redirectPath}`
      );

      // Add a message query param to show the user why they were redirected
      router.replace(`${redirectPath}?message=${encodeURIComponent(message)}`);
      return <Loader message="Redirecting to your dashboard..." />;
    }
  }

  // User is authenticated and has the required role
  return <>{children}</>;
}

/**
 * Higher Order Component specifically for protecting agent routes
 * Ensures the user is authenticated and has the agent role
 */
export function withAgentAuth() {
  return withAuth({ role: ROLES.AGENT });
}

/**
 * Higher Order Component specifically for protecting approved agent routes
 * Ensures the user is authenticated and has an approved agent role
 */
export function withApprovedAgentAuth() {
  return withAuth({ role: "approved_agent" });
}

/**
 * Higher Order Component specifically for protecting admin routes
 * Ensures the user is authenticated and has the admin role
 */
export function withAdminAuth() {
  return withAuth({ role: ROLES.ADMIN });
}

/**
 * Wrapper component for any page that requires authentication
 * Use this to easily protect routes
 */
export function ProtectedPage({ children, role }) {
  return <AuthGuard role={role}>{children}</AuthGuard>;
}
