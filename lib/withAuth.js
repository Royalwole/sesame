import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/utils/Loader';

/**
 * Higher-order function that wraps a page component with authentication checks
 * @param {Object} options - Configuration options
 * @param {string} options.role - Required role to access the page (optional)
 * @param {Function} getServerSideProps - Original getServerSideProps if it exists
 * @returns {Function} - New getServerSideProps function with auth checks
 */
export function withAuth(options = {}, getServerSideProps) {
  // Allow options to be passed as first parameter or getServerSideProps
  if (typeof options === 'function') {
    getServerSideProps = options;
    options = {};
  }

  return async (context) => {
    // Run the original getServerSideProps if provided
    const originalProps = getServerSideProps ? await getServerSideProps(context) : { props: {} };
    
    // If redirect is already set, return it directly
    if (originalProps.redirect) {
      return originalProps;
    }

    // Return props as-is for server-side rendering
    // Auth checking will be done on the client
    return {
      ...originalProps,
      props: {
        ...(originalProps.props || {}),
        requiresAuth: true,
        requiredRole: options.role || null,
      },
    };
  };
}

/**
 * Client-side authentication guard component
 * Handles login redirects and role-based access checks
 */
export function AuthGuard({ children, requiredRole }) {
  const router = useRouter();
  const { isAuthenticated, dbUser, isLoading, isAdmin, isAgent } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  
  // Add a safety timer to prevent endless loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth check is taking too long - proceeding anyway');
        setAuthorized(true);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    // Skip checks while loading, unless the safety timeout triggers
    if (isLoading) {
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.replace(`/auth/sign-in?redirect_url=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Check role requirements if specified and user data is loaded
    if (requiredRole && dbUser) {
      let hasRequiredRole = false;
      
      if (requiredRole === 'admin' && isAdmin) {
        hasRequiredRole = true;
      } else if (requiredRole === 'agent' && isAgent) {
        hasRequiredRole = true;
      } else if (dbUser.role === requiredRole) {
        hasRequiredRole = true;
      }

      if (!hasRequiredRole) {
        // Redirect based on actual role
        if (isAdmin) {
          router.replace('/dashboard/admin');
        } else if (isAgent) {
          router.replace('/dashboard/agent');
        } else {
          router.replace('/dashboard/user');
        }
        return;
      }
    }

    // User is authenticated and has required role
    setAuthorized(true);
  }, [isLoading, isAuthenticated, dbUser, requiredRole, router, isAdmin, isAgent]);

  // Render loading state while checking auth
  if (!authorized) {
    return <Loader message="Checking authorization..." />;
  }

  // Render the protected content
  return <>{children}</>;
}

export default withAuth;
