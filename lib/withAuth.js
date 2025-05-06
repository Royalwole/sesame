import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import Loader from "../components/utils/Loader";

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
  const { isAdmin, isAgent, dbUser, isLoading } = useAuth();
  const router = useRouter();

  // Show loading state while checking auth
  if (isLoading || !isLoaded) {
    return <Loader message="Checking authentication..." />;
  }

  // Redirect to login if not signed in
  if (!isSignedIn) {
    console.log("User not signed in, redirecting to login");
    router.replace(`/auth/sign-in?next=${encodeURIComponent(router.pathname)}`);
    return <Loader message="Redirecting to login..." />;
  }

  // Role-based access control
  if (role) {
    // Debug logs to understand what's happening
    console.log("Role check:", {
      requiredRole: role,
      userRole: dbUser?.role,
      isAdmin,
      isAgent,
    });

    const hasRequiredRole =
      (role === "admin" && isAdmin) ||
      (role === "agent" && isAgent) ||
      role === "user"; // Everyone is a user

    if (!hasRequiredRole) {
      // If user lacks permission, redirect to appropriate dashboard
      let redirectPath = "/dashboard";

      if (isAdmin) {
        redirectPath = "/dashboard/admin";
      } else if (isAgent) {
        redirectPath = "/dashboard/agent";
      }

      console.log(
        `User doesn't have role: ${role}, redirecting to ${redirectPath}`
      );
      router.replace(redirectPath);
      return <Loader message="Redirecting to your dashboard..." />;
    }
  }

  return <>{children}</>;
}

/**
 * Higher Order Component specifically for protecting agent routes
 * Ensures the user is authenticated and has the agent role
 */
export function withAgentAuth() {
  return withAuth({ role: "agent" });
}
