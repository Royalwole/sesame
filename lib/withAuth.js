import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "./role-management";
import { useEffect } from "react";

/**
 * Higher-order component for protected routes
 * @param {Object} options - Configuration options
 * @param {string} options.role - Required role (admin, agent, user)
 * @param {boolean} options.loading - Whether to show loading state instead of redirecting
 * @returns {Function} - HOC function
 */
export function withAuth(options = {}) {
  // Default options
  const { role, loading = true } = options;

  // Function that takes a component and enhances it
  return function withAuthWrapper(Component) {
    // Create a wrapper component
    const WrappedComponent = (props) => {
      // Check if we're running on the server side
      const isServer = typeof window === "undefined";

      // For server-side rendering, render the wrapped component directly without auth checks
      // This avoids issues with React hooks that depend on client-side context
      if (isServer) {
        // Skip all auth logic on the server, we'll handle it on the client
        return <Component {...props} />;
      }

      // Client-side code continues from here
      const router = useRouter();
      const auth = useAuth();

      // Check for circuit breaker parameters from dashboard redirection
      const hasBreakLoop = router.query.breakLoop === "true";
      const hasCacheCleared = router.query.cacheCleared === "true";
      const hasNoRedirect = router.query.noRedirect === "true";
      const redirectCount = parseInt(router.query.rc || "0", 10);

      // Comprehensive loop detection
      const loopIndicators = {
        hasBreakLoop,
        hasCacheCleared,
        hasNoRedirect,
        redirectCount: redirectCount > 1,
        multipleTimestamps: (router.asPath.match(/t=/g) || []).length > 1,
      };

      const loopDetected = Object.values(loopIndicators).some(
        (v) => v === true
      );

      if (loopDetected) {
        console.log("[withAuth] Loop indicators detected:", loopIndicators);
      } // Break cache to prevent stale auth state - with additional safety mechanisms
      useEffect(() => {
        // Only add timestamp when certain conditions are met:
        // 1. No timestamp already exists
        // 2. We're requiring a role (protected route)
        // 3. No loop detected
        // 4. Not already in the process of redirecting
        if (!router.asPath.includes("t=") && role && !loopDetected) {
          // For listings create page specifically, check for special conditions
          const isListingsCreate =
            router.pathname === "/dashboard/agent/listings/create";

          // Skip timestamp for problematic routes or if we've already detected issues
          if (
            isListingsCreate &&
            (redirectCount > 0 || router.query.bypassLoad === "true")
          ) {
            console.log(
              "[withAuth] Skipping timestamp for listings create page due to redirect history"
            );
            return;
          }

          // Store original path without the timestamp to prevent loops
          const originalPath = router.pathname;
          const separator = router.asPath.includes("?") ? "&" : "?";
          const timestamp = `${separator}t=${Date.now()}`;

          console.log(
            "[withAuth] Adding timestamp to prevent stale auth state"
          );

          // Use replace to avoid affecting browser history
          router.replace(`${router.asPath}${timestamp}`, undefined, {
            shallow: true,
          });
        }
        // Keep dependencies minimal to prevent refresh loops
      }, [router.pathname, role, loopDetected, redirectCount]);

      // Effect to check metadata roles and sync user data if needed
      useEffect(() => {
        let isMounted = true;

        const updateUserData = async () => {
          // Skip user data sync if circuit breaker is active
          if (hasBreakLoop || hasCacheCleared) {
            console.log(
              "[withAuth] Circuit breaker active, skipping user data sync"
            );
            return;
          }

          // Log auth state details to help debug auth state inconsistencies
          console.log("[withAuth] Auth state:", {
            isLoading: auth.isLoading,
            isSignedIn: auth.isSignedIn,
            hasUser: !!auth.user,
            userRole: auth?.user?.publicMetadata?.role || "unknown",
          });

          if (!auth.isLoading && (auth.isSignedIn || auth.user)) {
            try {
              // Check for admin role in metadata but not in auth state
              if (
                role === ROLES.ADMIN &&
                !auth.isAdmin &&
                auth.user?.publicMetadata?.role === ROLES.ADMIN
              ) {
                console.log(
                  "[withAuth] Detected admin role in metadata, syncing user data"
                );
                // Sync user data to update role state
                if (auth.syncUserData && isMounted) {
                  try {
                    await auth.syncUserData(true);
                  } catch (syncError) {
                    console.error(
                      "[withAuth] Error syncing admin data:",
                      syncError
                    );
                    // Continue without failing - will use cached data instead
                  }
                }
              }
              // Check for agent role in metadata but not in auth state
              else if (
                role === ROLES.AGENT &&
                !auth.isAgent &&
                auth.user?.publicMetadata?.role === ROLES.AGENT
              ) {
                console.log(
                  "[withAuth] Detected agent role in metadata, syncing user data"
                );
                // Force a refresh of user data to get the updated role
                if (auth.syncUserData && isMounted) {
                  try {
                    await auth.syncUserData(true);
                  } catch (syncError) {
                    console.error(
                      "[withAuth] Error syncing agent data:",
                      syncError
                    );
                    // Continue without failing - will use cached data instead
                  }
                }
              }
            } catch (error) {
              console.error("[withAuth] Error in updateUserData:", error);
              // Don't throw - prevent breaking the rendering flow
            }
          }
        };

        // Call the function but don't await it in the effect
        updateUserData().catch((err) => {
          console.error("[withAuth] Unhandled error in updateUserData:", err);
        });

        return () => {
          isMounted = false;
        };
      }, [
        auth.isLoading,
        auth.isSignedIn,
        auth.user,
        auth.isAdmin,
        auth.isAgent,
        auth.syncUserData,
        role,
        hasBreakLoop,
        hasCacheCleared,
      ]);

      console.log(`[withAuth] Checking auth for path: ${router.asPath}`);
      console.log(
        `[withAuth] Required role: ${role}, User role: ${auth?.role}, isLoading: ${auth.isLoading}, isAuthenticated: ${auth.isSignedIn}`
      ); // Handle loading state      // Special handling for agent dashboard that's having loading issues
      const isAgentDashboardPage = router.pathname === "/dashboard/agent";
      // Identify the problematic create listings page
      const isCreateListingsPage =
        router.pathname === "/dashboard/agent/listings/create";

      // Skip loading timeout for create listings page altogether to prevent refresh loops
      // Check for circuit breaker parameters or if we're on create listings page
      const shouldSkipTimeout =
        isCreateListingsPage ||
        hasBreakLoop ||
        router.query.bypassLoad === "true";

      // Skip the timeout for problematic pages
      const loadingTimeout = shouldSkipTimeout
        ? 0
        : isAgentDashboardPage
          ? 3000
          : 5000;

      // Skip loading state completely for create listings page that has an auth user
      if (isCreateListingsPage && auth.user) {
        console.log(
          "[withAuth] Create listings page detected with auth user - rendering immediately"
        );
        return <Component {...props} />;
      }

      if (auth.isLoading) {
        console.log("[withAuth] Auth is still loading", {
          path: router.pathname,
          isAgentDashboard: isAgentDashboardPage,
          isCreateListingsPage,
          hasAuthUser: !!auth.user,
          shouldSkipTimeout,
        });

        // Special case: If we're on any agent dashboard route and have the user object,
        // we can render the component even if other auth parts are still loading
        const isAnyAgentDashboardPage =
          router.pathname.startsWith("/dashboard/agent");
        if (
          isAnyAgentDashboardPage &&
          auth.user &&
          (hasBreakLoop ||
            redirectCount > 0 ||
            router.query.bypassLoad === "true")
        ) {
          console.log(
            "[withAuth] Bypassing loading state for agent dashboard with circuit breaker"
          );
          return <Component {...props} />;
        }

        // Check if we already have circuit breaker parameters
        if (hasBreakLoop || router.query.bypassLoad === "true") {
          console.log(
            "[withAuth] Circuit breaker parameters detected, skipping timeout"
          );
          // If we're already in circuit-breaker mode, don't set another timeout
          if (auth.user) {
            console.log(
              "[withAuth] User exists with circuit breaker, forcing render"
            );
            return <Component {...props} />;
          }
        }
        // Add timeout protection for loading state to prevent infinite loading
        else if (typeof window !== "undefined") {
          // Check if this is the create listings page which has issues
          const isCreateListingsPage =
            router.pathname === "/dashboard/agent/listings/create";

          // Use React state instead of returning from setTimeout which doesn't work          // Skip setting timeout altogether for create listings page
          if (isCreateListingsPage && auth.user) {
            console.log(
              "[withAuth] Create listings page detected - skipping timeout and rendering immediately"
            );
            return <Component {...props} />;
          }

          const timeoutId = setTimeout(() => {
            console.log(
              "[withAuth] Loading timeout reached, checking if we can render"
            );
            // If we have user data but auth is still loading, force render
            if (auth.user) {
              console.log("[withAuth] User exists, forcing component render");
              // For problematic pages, use replaceState instead of location.href to avoid full refresh
              if (isCreateListingsPage) {
                console.log(
                  "[withAuth] Using history.replaceState for listings create page to prevent refresh loop"
                );
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.set("breakLoop", "true");
                  url.searchParams.set("bypassLoad", "true");
                  url.searchParams.set("t", Date.now().toString());
                  window.history.replaceState(
                    {},
                    document.title,
                    url.toString()
                  );

                  // Force re-render with local storage
                  const triggerKey = "auth_render_trigger";
                  localStorage.setItem(triggerKey, Date.now().toString());

                  // Return the component without page refresh
                  return <Component {...props} />;
                } catch (e) {
                  console.error(
                    "[withAuth] Error applying circuit breaker:",
                    e
                  );
                }
              } else {
                // For other pages, use traditional reload with circuit breaker
                window.location.href = `${router.pathname}?breakLoop=true&bypassLoad=true&t=${Date.now()}`;
              }
            }
          }, loadingTimeout);

          // Clean up timeout
          return () => clearTimeout(timeoutId);
        }

        // Return loading state based on option
        if (loading) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          );
        }
        // Don't render anything while loading
        return null;
      } // Check if user is authenticated - use multiple checks for more reliability
      // Special handling for /dashboard/agent route that's showing loading issues
      // Variable already declared above as isAgentDashboardPage
      const hasAuthCircuitBreaker =
        hasBreakLoop || hasCacheCleared || redirectCount > 1;
      const bypassLoadingParam = router.query.bypassLoad === "true"; // If we're on agent dashboard and circuit breaker is active, skip auth check
      if (
        isAgentDashboardPage &&
        (hasAuthCircuitBreaker || bypassLoadingParam)
      ) {
        console.log(
          "[withAuth] Agent dashboard with circuit breaker - skipping normal auth check"
        );
        // For agent dashboard with circuit breaker, skip further checks and render component
        if (auth.user) {
          console.log(
            "[withAuth] Agent dashboard - forcing component render with user:",
            {
              userExists: !!auth.user,
              email: auth.user?.primaryEmailAddress?.emailAddress,
              hasMetadata: !!auth.user?.publicMetadata,
            }
          );
          return <Component {...props} />;
        }
      }
      // Normal auth check for other routes
      else if (!auth.isSignedIn || !auth.user) {
        console.log(
          "[withAuth] User is not authenticated, redirecting to sign-in",
          {
            isSignedIn: auth.isSignedIn,
            user: !!auth.user,
            pathname: router.pathname,
          }
        );

        // Circuit breaker - check URL for noRedirect parameter
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("noRedirect") === "true") {
            console.log(
              "[withAuth] Circuit breaker active - skipping auth redirect"
            );
            // Show a minimal error page instead of redirecting
            return (
              <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                  <div className="text-red-500 text-5xl mb-4">⚠️</div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Authentication Required
                  </h1>
                  <p className="text-gray-600 mb-6">
                    You need to be signed in to view this page, but redirects
                    have been disabled to prevent a loop.
                  </p>
                  <div className="flex flex-col space-y-3">
                    <a
                      href="/auth/sign-in?noRedirect=true"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Go to Sign In Page
                    </a>
                  </div>
                </div>
              </div>
            );
          }
        }

        // For client-side redirect - with enhanced loop detection and prevention
        if (typeof window !== "undefined") {
          // Collect all indicators of potential loops
          const urlParams = new URLSearchParams(window.location.search);
          const redirectCount = parseInt(urlParams.get("rc") || "0");
          const hasBreakLoop = urlParams.get("breakLoop") === "true";
          const hasNoRedirect = urlParams.get("noRedirect") === "true";
          const hasTooManyTimestamps =
            (router.asPath.match(/t=/g) || []).length > 1;
          const isInSignInFlow = router.asPath.includes("/auth/sign-in");

          // If we have any indication of a loop OR we're already in sign-in flow, prevent further redirects
          if (
            redirectCount > 2 ||
            hasBreakLoop ||
            hasNoRedirect ||
            hasTooManyTimestamps ||
            isInSignInFlow
          ) {
            console.log(
              "[withAuth] Loop prevention triggered, showing error page instead of redirecting"
            );
            return (
              <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                  <div className="text-red-500 text-5xl mb-4">⚠️</div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Authentication Required
                  </h1>
                  <p className="text-gray-600 mb-6">
                    You need to be signed in to view this page, but redirects
                    have been disabled to prevent a loop.
                  </p>
                  <div className="flex flex-col space-y-3">
                    <a
                      href="/auth/sign-in?noRedirect=true"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Go to Sign In Page
                    </a>
                  </div>
                </div>
              </div>
            );
          }

          // Get the current path for redirect after sign-in
          const returnUrl = encodeURIComponent(router.asPath);

          // Add a timestamp to break cache and prevent loops
          const signInUrl = `/auth/sign-in?redirect_url=${returnUrl}&t=${Date.now()}`;
          console.log("[withAuth] Redirecting to:", signInUrl);

          // Redirect to sign-in
          router.replace(signInUrl);
          return null;
        } // For server-side, just render a loading state
        return null;
      }

      // For role-based access check, use more direct equality checks to prevent loops
      if (role) {
        // If loop detection is active, skip role checks completely
        if (auth.loopDetected || hasBreakLoop || hasCacheCleared) {
          console.log(
            "[withAuth] Circuit breaker active - skipping role check"
          );
          return <Component {...props} />;
        }

        let hasRequiredRole = false; // Get the raw role value directly from metadata for stable comparison
        // Use a safe accessor pattern to prevent undefined errors
        const userMetadata = auth?.user?.publicMetadata || {};
        const userRole = userMetadata.role || "user";
        const isUserApproved = userMetadata.approved === true;

        // EMERGENCY FIX: If user has no metadata but we know they're signed in,
        // redirect to fix-permission-cache to repair their account
        if (
          auth.isSignedIn &&
          auth.user &&
          !userMetadata.role &&
          !hasBreakLoop
        ) {
          console.error(
            "[withAuth] User has no role metadata! Redirecting to fix permissions page"
          );
          if (typeof window !== "undefined") {
            window.location.replace("/fix-permission-cache?fromAuthError=true");
            return null;
          }
        }

        console.log("[withAuth] Role check details:", {
          userRole,
          isUserApproved,
          requiredRole: role,
          path: router.pathname,
          hasMetadata: !!userMetadata.role,
        });

        // More direct role checking to avoid indirect function calls that might have bugs
        if (role === ROLES.ADMIN) {
          // Admin check - must be admin AND approved
          hasRequiredRole =
            (userRole === "admin" || userRole === "super_admin") &&
            isUserApproved;

          // Clear console logging to better understand the state
          console.log(`[withAuth] Admin role check details:`, {
            userRole,
            isApproved: isUserApproved,
            hasAccess: hasRequiredRole,
            requiredRole: role,
            pathRequested: router.pathname,
          });

          // If the user has the admin role but is not approved, explain the issue
          if (
            (userRole === "admin" || userRole === "super_admin") &&
            !isUserApproved
          ) {
            console.warn(
              `[withAuth] User has admin role but is not approved - access denied`
            );
          }
        } // Check for agent role - directly check both role and approval
        else if (role === ROLES.AGENT) {
          hasRequiredRole = userRole === "agent" && isUserApproved;
          console.log(
            `[withAuth] Agent role check: Role=${userRole}, Approved=${isUserApproved}, HasAccess=${hasRequiredRole}, PathRequested=${router.pathname}`
          );

          // Add special handling for all agent dashboard routes to debug loading issue
          if (router.pathname.startsWith("/dashboard/agent")) {
            console.log(
              "[withAuth] Agent dashboard route requested:",
              router.pathname
            );
            // If we're on any agent dashboard route with breakLoop parameter, force access
            if (hasBreakLoop || redirectCount > 1) {
              console.log(
                "[withAuth] Forcing access to agent dashboard due to circuit breaker"
              );
              hasRequiredRole = true;
            }

            // If we see the loading still stuck, check for bypassLoad parameter
            const bypassLoadingParam = router.query.bypassLoad === "true";
            if (bypassLoadingParam) {
              console.log(
                "[withAuth] Bypassing agent role check due to bypassLoad parameter"
              );
              hasRequiredRole = true;
            }
          }
        }
        // Check for pending agent role - just check the role value directly
        else if (role === ROLES.AGENT_PENDING) {
          hasRequiredRole = userRole === "agent_pending";
          console.log(
            `[withAuth] Pending agent role check: Role=${userRole}, HasAccess=${hasRequiredRole}`
          );
        }
        // Default user role - everyone can access
        else {
          hasRequiredRole = true;
        }

        // Handle unauthorized access
        if (!hasRequiredRole) {
          console.log(`[withAuth] Access denied to ${role} route`);

          // For client-side redirect
          if (typeof window !== "undefined") {
            // Prevent redirect loops by checking for too many redirects or URL indicators
            const urlParams = new URLSearchParams(window.location.search);
            const redirectCount = parseInt(urlParams.get("rc") || "0");

            // If we've redirected too many times, show an error instead of redirecting again
            if (redirectCount > 2 || router.asPath.includes("breakLoop=true")) {
              console.log(
                "[withAuth] Too many redirects detected, showing error page instead"
              );
              return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                  <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      Access Error
                    </h1>
                    <p className="text-gray-600 mb-4">
                      There seems to be an issue with your permissions for this
                      page.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      Required role: {role} | Your role: {userRole} (Approved:{" "}
                      {isUserApproved ? "Yes" : "No"})
                    </p>
                    <div className="flex flex-col space-y-3">
                      <a
                        href="/dashboard/user"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Go to User Dashboard
                      </a>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Get appropriate dashboard URL directly based on user's role
            // using direct metadata values to prevent circular dependencies
            let redirectPath = "/dashboard/user"; // Default

            if (
              (userRole === "admin" || userRole === "super_admin") &&
              isUserApproved
            ) {
              redirectPath = "/dashboard/admin";
            } else if (userRole === "agent" && isUserApproved) {
              redirectPath = "/dashboard/agent";
            } else if (userRole === "agent_pending") {
              redirectPath = "/dashboard/pending";
            }

            // Add redirect counter and timestamp to track potential loops
            const separator = redirectPath.includes("?") ? "&" : "?";
            redirectPath = `${redirectPath}${separator}t=${Date.now()}&rc=${redirectCount + 1}`;

            // Only redirect if not already at the target location or its sub-path
            const currentPath = router.asPath.split("?")[0];
            const targetPath = redirectPath.split("?")[0];

            if (!currentPath.startsWith(targetPath)) {
              console.log(`[withAuth] Redirecting to ${redirectPath}`);
              router.replace(redirectPath);
            } else {
              console.log(
                "[withAuth] Already at the correct dashboard location"
              );
            }
            return null;
          }

          // For server-side, just render a loading state
          return null;
        }
      }

      // User is authorized, render the component
      console.log("[withAuth] User is authorized, rendering component");
      return <Component {...props} />;
    };

    // For server-side rendering support
    WrappedComponent.displayName = `withAuth(${Component ? Component.displayName || Component.name || "Component" : "Component"})`;

    // Server-side props for initial auth check
    if (Component && Component.getInitialProps) {
      WrappedComponent.getInitialProps = async (ctx) => {
        // Get the component's props
        const componentProps = await Component.getInitialProps(ctx);
        return { ...componentProps };
      };
    }

    return WrappedComponent;
  };
}

/**
 * Enhanced withAuth function for usage with getServerSideProps
 * This version ensures properly structured return objects for Next.js
 *
 * @param {Object} options - Same options as withAuth
 * @returns {Function} - Function that returns properly structured props object
 */
export function withAuthServerSideProps(options = {}) {
  return async (context) => {
    // In the future, you can add server-side auth checks here

    // Always return an object with a props key
    return {
      props: {}, // Empty props object that Next.js expects
    };
  };
}

/**
 * Special handler for getServerSideProps that always returns properly structured objects
 * Use this instead of directly using the withAuth HOC in getServerSideProps
 *
 * Example: export const getServerSideProps = withAuthGetServerSideProps({ role: 'admin' })
 *
 * @param {Object} options - Same options as withAuth
 * @returns {Function} - getServerSideProps function that returns properly structured props
 */
export function withAuthGetServerSideProps(options = {}) {
  return async (context) => {
    // Return clean props to avoid Next.js errors about extra properties
    return {
      props: {}, // Empty props object that Next.js expects
    };
  };
}

// Define withAgentAuth as a function that returns the HOC applied to a component
export const withAgentAuth = function (Component) {
  return withAuth({ role: ROLES.AGENT })(Component);
};

/**
 * Helper function specifically for agent auth in getServerSideProps
 * @returns {Function} - getServerSideProps function that returns properly structured props
 */
export function withAgentAuthGetServerSideProps() {
  return withAuthGetServerSideProps({ role: ROLES.AGENT });
}

export default withAuth;
