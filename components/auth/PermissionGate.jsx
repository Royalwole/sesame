import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * Component that conditionally renders children based on user permissions
 * 
 * Example usage:
 * <PermissionGate 
 *   permission="listings:create"
 *   fallback={<p>You don't have permission to create listings</p>}
 * >
 *   <CreateListingForm />
 * </PermissionGate>
 */
export function PermissionGate({ 
  children, 
  permission, 
  permissions, 
  anyPermission = false,
  fallback = null, 
  loading = null 
}) {
  const { can, canAll, canAny, loading: permissionsLoading } = usePermissions();
  
  // Show loading state if permissions are still loading
  if (permissionsLoading) {
    return loading || null;
  }
  
  // Different permission checking modes
  let hasAccess = false;
  
  if (permission) {
    // Single permission check
    hasAccess = can(permission);
  } else if (permissions) {
    // Multiple permissions check
    hasAccess = anyPermission 
      ? canAny(permissions)  // Any permission is sufficient
      : canAll(permissions); // All permissions are required
  }
  
  // Render children if user has permission, otherwise render fallback
  return hasAccess ? children : fallback;
}

/**
 * Component that renders content only if user has a specific permission
 *
 * Example usage:
 * <HasPermission permission="admin:access_dashboard">
 *   <AdminPanel />
 * </HasPermission>
 */
export function HasPermission({ children, permission, fallback = null, loading = null }) {
  return (
    <PermissionGate
      permission={permission}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Component that renders content only if user has all specified permissions
 *
 * Example usage:
 * <HasAllPermissions 
 *   permissions={["listings:update", "listings:publish"]}
 *   fallback={<RestrictedAccessMessage />}
 * >
 *   <PublishListingButton />
 * </HasAllPermissions>
 */
export function HasAllPermissions({ children, permissions, fallback = null, loading = null }) {
  return (
    <PermissionGate
      permissions={permissions}
      anyPermission={false}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Component that renders content if user has any of the specified permissions
 *
 * Example usage:
 * <HasAnyPermission 
 *   permissions={["reports:view", "admin:view_analytics"]}
 * >
 *   <AnalyticsDashboard />
 * </HasAnyPermission>
 */
export function HasAnyPermission({ children, permissions, fallback = null, loading = null }) {
  return (
    <PermissionGate
      permissions={permissions}
      anyPermission={true}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Higher-order component that wraps a component with permission checking
 * 
 * Example usage:
 * const ProtectedAdminPanel = withPermission(AdminPanel, "admin:access_dashboard");
 */
export function withPermission(Component, permission, FallbackComponent = () => null) {
  return function PermissionWrapper(props) {
    return (
      <PermissionGate
        permission={permission}
        fallback={<FallbackComponent {...props} />}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}

/**
 * Component that restricts access based on domain permissions
 * 
 * Example usage:
 * <DomainPermissionGate 
 *   domain="LISTINGS" 
 *   requiredPermissions={["CREATE", "PUBLISH"]}
 * >
 *   <ListingEditor />
 * </DomainPermissionGate>
 */
export function DomainPermissionGate({ 
  children, 
  domain, 
  requiredPermissions, 
  anyPermission = false,
  fallback = null, 
  loading = null 
}) {
  const { forDomain, loading: permissionsLoading, DOMAINS } = usePermissions();
  
  if (permissionsLoading) {
    return loading || null;
  }
  
  // Check if domain is valid
  if (!DOMAINS[domain]) {
    console.error(`Invalid domain: ${domain}`);
    return fallback;
  }
  
  // Get permissions for this domain
  const domainPermissions = forDomain(domain);
  
  // Check if user has the required permissions
  let hasAccess = false;
  
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (anyPermission) {
      // User needs at least one of the specified permissions
      hasAccess = requiredPermissions.some(perm => domainPermissions[perm]);
    } else {
      // User needs all specified permissions
      hasAccess = requiredPermissions.every(perm => domainPermissions[perm]);
    }
  }
  
  return hasAccess ? children : fallback;
}