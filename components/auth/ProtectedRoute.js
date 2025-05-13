import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../lib/role-management";

/**
 * Protected Route Component
 * Handles client-side route protection based on user roles from Clerk
 *
 * Usage:
 * <ProtectedRoute requiredRole={ROLES.ADMIN} redirectTo="/login">
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/",
  loadingComponent = null,
}) {
  const router = useRouter();
  const { isSignedIn, isLoaded, role, refreshSession } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait until auth is loaded
    if (!isLoaded) return;

    // If user is not signed in, redirect to login
    if (!isSignedIn) {
      router.push(redirectTo);
      return;
    }

    // Check if a specific role is required
    if (requiredRole) {
      let hasAccess = false;

      // Check for array of roles or single role
      if (Array.isArray(requiredRole)) {
        hasAccess = requiredRole.includes(role);
      } else {
        hasAccess = requiredRole === role;
      }

      if (!hasAccess) {
        console.log(
          `Access denied: Required role ${requiredRole}, user role ${role}`
        );
        router.push(redirectTo);
        return;
      }
    }

    // Refresh user session to ensure we have the latest role data
    // This helps prevent race conditions during role changes
    async function refreshUserSession() {
      try {
        await refreshSession();
        setAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error("Error refreshing session:", error);
        setAuthorized(true); // Continue anyway with current data
        setIsChecking(false);
      }
    }

    refreshUserSession();
  }, [
    isLoaded,
    isSignedIn,
    role,
    requiredRole,
    router,
    redirectTo,
    refreshSession,
  ]);

  // Show loading state while checking authorization
  if (isChecking || !isLoaded) {
    return loadingComponent || <div>Loading...</div>;
  }

  // Show children if authorized
  return authorized ? children : null;
}
