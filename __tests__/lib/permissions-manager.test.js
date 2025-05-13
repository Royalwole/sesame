import { jest } from "@jest/globals";
import {
  hasPermission,
  clearUserPermissionCache,
  getUserPermissions,
  PERMISSIONS,
  ROLES,
} from "../../lib/permissions-manager";

// Mock the clerk client
jest.mock("@clerk/nextjs/server", () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

// Import the mocked module
import { clerkClient } from "@clerk/nextjs/server";

describe("Permission Manager Tests", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the permission cache
    clearUserPermissionCache();
  });

  describe("getUserPermissions", () => {
    it("should return role-based permissions for a user", async () => {
      // Mock Clerk response with admin role
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_123",
        publicMetadata: {
          role: ROLES.ADMIN,
        },
      });

      const permissions = await getUserPermissions("user_123");

      // Admin should have admin permissions
      expect(permissions).toContain(PERMISSIONS.users.MANAGE_USERS);
      expect(permissions).toContain(PERMISSIONS.users.VIEW_USERS);

      // Check that Clerk API was called
      expect(clerkClient.users.getUser).toHaveBeenCalledWith("user_123");
    });

    it("should merge role-based and user-specific permissions", async () => {
      // Mock Clerk response with regular user role but extra permissions
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_456",
        publicMetadata: {
          role: ROLES.USER,
          permissions: [PERMISSIONS.listings.APPROVE_LISTINGS],
        },
      });

      const permissions = await getUserPermissions("user_456");

      // Should have regular user permissions
      expect(permissions).toContain(PERMISSIONS.listings.VIEW_LISTINGS);

      // Should also have the extra granted permission
      expect(permissions).toContain(PERMISSIONS.listings.APPROVE_LISTINGS);

      // Should not have admin permissions
      expect(permissions).not.toContain(PERMISSIONS.users.MANAGE_USERS);
    });

    it("should handle users with no role", async () => {
      // Mock Clerk response with no role
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_789",
        publicMetadata: {},
      });

      const permissions = await getUserPermissions("user_789");

      // Should have basic permissions for default role
      expect(permissions).toContain(PERMISSIONS.listings.VIEW_LISTINGS);
      expect(permissions).not.toContain(PERMISSIONS.admin.ACCESS_ADMIN);
    });

    it("should use cached permissions for repeated calls", async () => {
      // Mock Clerk response
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_123",
        publicMetadata: {
          role: ROLES.AGENT,
        },
      });

      // First call - should hit Clerk API
      await getUserPermissions("user_123");

      // Second call - should use cache
      await getUserPermissions("user_123");

      // Clerk API should only be called once
      expect(clerkClient.users.getUser).toHaveBeenCalledTimes(1);
    });

    it("should refresh permissions after clearing cache", async () => {
      // Mock Clerk response
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_123",
        publicMetadata: {
          role: ROLES.AGENT,
        },
      });

      // First call - should hit Clerk API
      await getUserPermissions("user_123");

      // Clear cache
      clearUserPermissionCache("user_123");

      // Call again - should hit Clerk API again
      await getUserPermissions("user_123");

      // Clerk API should be called twice
      expect(clerkClient.users.getUser).toHaveBeenCalledTimes(2);
    });
  });

  describe("hasPermission", () => {
    it("should return true when user has the permission", async () => {
      // Mock Clerk response with admin role
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_123",
        publicMetadata: {
          role: ROLES.ADMIN,
        },
      });

      const result = await hasPermission(
        "user_123",
        PERMISSIONS.admin.ACCESS_ADMIN
      );

      expect(result).toBe(true);
    });

    it("should return false when user does not have the permission", async () => {
      // Mock Clerk response with regular user role
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_456",
        publicMetadata: {
          role: ROLES.USER,
        },
      });

      const result = await hasPermission(
        "user_456",
        PERMISSIONS.admin.ACCESS_ADMIN
      );

      expect(result).toBe(false);
    });

    it("should check multiple permissions with AND logic", async () => {
      // Mock Clerk response with agent role
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_789",
        publicMetadata: {
          role: ROLES.AGENT,
          permissions: [PERMISSIONS.listings.EDIT_LISTINGS],
        },
      });

      // User has both permissions
      const result1 = await hasPermission("user_789", [
        PERMISSIONS.listings.VIEW_LISTINGS,
        PERMISSIONS.listings.EDIT_LISTINGS,
      ]);
      expect(result1).toBe(true);

      // User does not have one of the permissions
      const result2 = await hasPermission("user_789", [
        PERMISSIONS.listings.EDIT_LISTINGS,
        PERMISSIONS.admin.ACCESS_ADMIN,
      ]);
      expect(result2).toBe(false);
    });

    it("should handle expired temporary permissions", async () => {
      // Mock current date
      const realDate = Date;
      global.Date = class extends Date {
        constructor(date) {
          if (date) return super(date);
          return new realDate("2025-05-11T12:00:00Z"); // Current fixed date
        }
      };

      // Mock Clerk response with expired permission
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_temp",
        publicMetadata: {
          role: ROLES.USER,
          permissions: [PERMISSIONS.listings.APPROVE_LISTINGS],
          temporaryPermissions: {
            [PERMISSIONS.listings.APPROVE_LISTINGS]: {
              grantedAt: "2025-05-01T12:00:00Z",
              expiresAt: "2025-05-10T12:00:00Z", // Expired yesterday
              grantedBy: "admin_user",
            },
          },
        },
      });

      const result = await hasPermission(
        "user_temp",
        PERMISSIONS.listings.APPROVE_LISTINGS
      );

      // Should return false as the permission has expired
      expect(result).toBe(false);

      // Restore original Date
      global.Date = realDate;
    });

    it("should handle valid temporary permissions", async () => {
      // Mock current date
      const realDate = Date;
      global.Date = class extends Date {
        constructor(date) {
          if (date) return super(date);
          return new realDate("2025-05-11T12:00:00Z"); // Current fixed date
        }
      };

      // Mock Clerk response with valid temporary permission
      clerkClient.users.getUser.mockResolvedValue({
        id: "user_temp",
        publicMetadata: {
          role: ROLES.USER,
          permissions: [PERMISSIONS.listings.APPROVE_LISTINGS],
          temporaryPermissions: {
            [PERMISSIONS.listings.APPROVE_LISTINGS]: {
              grantedAt: "2025-05-01T12:00:00Z",
              expiresAt: "2025-05-20T12:00:00Z", // Expires in the future
              grantedBy: "admin_user",
            },
          },
        },
      });

      const result = await hasPermission(
        "user_temp",
        PERMISSIONS.listings.APPROVE_LISTINGS
      );

      // Should return true as the permission is still valid
      expect(result).toBe(true);

      // Restore original Date
      global.Date = realDate;
    });
  });
});
