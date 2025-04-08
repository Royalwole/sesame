/**
 * Clerk configuration for Pages Router
 */
import { clerkClient } from "@clerk/nextjs/server";

// Initialize Clerk with longer session lifetime
export function initClerk() {
  // You can add additional configuration if needed
  return {
    // Return any configuration you need
    sessionOptions: {
      lifetime: 7 * 24 * 60 * 60, // 7 days in seconds
    },
  };
}

// Helper to get user data from Clerk
export async function getClerkUser(userId) {
  if (!userId) return null;

  try {
    return await clerkClient.users.getUser(userId);
  } catch (error) {
    console.error("Failed to fetch user from Clerk:", error);
    return null;
  }
}
