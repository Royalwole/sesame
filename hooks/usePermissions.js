import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import {
  getUserPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getDomainPermissions,
  DOMAINS,
  PERMISSIONS,
} from "../lib/permissions-manager";

/**
 * Hook for checking user permissions in React components
 *
 * @returns {Object} Permission checking utilities and user permissions
 */
export default function usePermissions() {
  const { user, isLoaded, isSignedIn } = useUser();

  const permissions = useMemo(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return {
        permissions: [],
        has: () => false,
        hasAll: () => false,
        hasAny: () => false,
        domain: () => ({}),
        can: {},
        DOMAINS,
        PERMISSIONS,
      };
    }

    // Get all user permissions
    const userPermissions = getUserPermissions(user);

    // Create domain-specific permission checkers
    const domainPermissionCheckers = {};

    // For each domain, create a checker function that returns domain permissions
    Object.keys(DOMAINS).forEach((domain) => {
      domainPermissionCheckers[domain.toLowerCase()] = () =>
        getDomainPermissions(user, domain);
    });

    // Create convenient "can" object with all permission checks
    const can = {};

    // Flatten all permissions into a single object with functions
    Object.entries(PERMISSIONS).forEach(([domain, domainPermissions]) => {
      Object.entries(domainPermissions).forEach(
        ([action, permissionString]) => {
          // Convert to camelCase for easier usage: e.g., can.viewUsers()
          const camelCaseAction = action
            .toLowerCase()
            .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

          can[camelCaseAction] = () =>
            userPermissions.includes(permissionString);
        }
      );
    });

    return {
      // Raw list of permission strings
      permissions: userPermissions,

      // Permission check functions
      has: (permission) => hasPermission(user, permission),
      hasAll: (permissions) => hasAllPermissions(user, permissions),
      hasAny: (permissions) => hasAnyPermission(user, permissions),

      // Get domain-specific permissions
      domain: (domain) => getDomainPermissions(user, domain),

      // Domain-specific permission checkers
      ...domainPermissionCheckers,

      // Convenient permission checking object
      can,

      // Access to constants
      DOMAINS,
      PERMISSIONS,
    };
  }, [user, isLoaded, isSignedIn]);

  return permissions;
}
