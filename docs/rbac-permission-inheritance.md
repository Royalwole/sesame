# Role-Based Access Control (RBAC) Permission Inheritance

This document explains how permission inheritance works in the TopDial RBAC system.

## Role Hierarchy

Roles in the system are arranged in a hierarchy, with higher roles inheriting all permissions from lower roles:

```
USER → AGENT_PENDING → AGENT → SUPPORT → ADMIN → SUPER_ADMIN
```

Each role in this hierarchy inherits all the permissions from roles to its left.

## Permission Sources

A user's effective permissions come from three sources, in the following order of precedence:

1. **Explicitly Granted Permissions**: Individual permissions directly assigned to a user
2. **Role-Based Permissions**: Permissions that come with a user's role
3. **Resource-Based Permissions**: Permissions granted to a user for specific resources

## Role-Based Permission Inheritance

The following table shows the permissions inherited by each role:

| Role | Inherits From | Additional Permissions |
|------|--------------|------------------------|
| USER | None | Basic user permissions (viewing public content, managing own profile) |
| AGENT_PENDING | USER | Access to agent onboarding material |
| AGENT | USER, AGENT_PENDING | Listing management, client communication |
| SUPPORT | USER | Customer support tools, limited admin functions |
| ADMIN | USER, AGENT, SUPPORT | User management, system configuration |
| SUPER_ADMIN | USER, AGENT, SUPPORT, ADMIN | System-wide permissions, role management |

## Permission Resolution Logic

When checking if a user has a specific permission, the system follows this resolution logic:

1. First, check if the user has been **explicitly granted** the permission
2. If not, check if the user's **role has the permission** (including inherited permissions)
3. If not, check if the user has a **resource-specific grant** of this permission

If any of these checks return true, the user has the permission.

## Temporary Permissions

Any permission can be granted on a temporary basis with an expiration date. When a temporary permission expires:

1. It's automatically removed from the user's effective permissions
2. The removal is logged in the audit trail
3. Any actions requiring that permission will be denied

## Permission Conflicts

If there are conflicts between different permission sources:

1. **Explicit denials** override any grants
2. **Temporary grants** are overridden at expiration
3. **Resource-specific permissions** only apply to that resource

## Special Permission Handling

### Wildcard Permissions

Some administrative roles have wildcard permissions (e.g., `listings:*`) that grant all permissions in a domain.

### Permission Groups

Permissions can be bundled into groups for easier management. When a permission bundle is assigned:

1. All permissions in the bundle are granted individually
2. The bundle association is tracked for auditing
3. Revoking the bundle removes all permissions that were granted by it

## How to Use This Documentation

When designing features that require permission checks:

1. Check the existing permission structure to see if a suitable permission already exists
2. If not, define new permissions in the appropriate domain
3. Update this documentation when making changes to the permission inheritance model
4. Test thoroughly when changing role-based permissions as they affect many users

## Example: Permission Resolution Flow

For a request to edit a listing:

1. Check if user has `listings:edit_any` (global permission to edit any listing)
2. If not, check if user has `listings:edit_own` AND is the owner of the listing
3. If not, check if user has a resource-specific permission for this listing

Only if all checks fail should the request be denied.