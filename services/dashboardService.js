// filepath: c:\Users\HomePC\Desktop\topdial\services\dashboardService.js
/**
 * Dashboard API service for handling user dashboard data
 */

import { API_ROUTES } from "../lib/api-utils";

/**
 * Fetches dashboard data for the current authenticated user
 * @returns {Promise<Object>} Object containing favorites and inspections
 */
export async function fetchUserDashboardData() {
  try {
    const response = await fetch(API_ROUTES.USER_DASHBOARD, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for auth cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error fetching dashboard data");
    }

    const result = await response.json();

    // Check if result has the expected structure
    const dashboardData = result.data || result;

    return {
      stats: {
        savedListings: dashboardData.stats?.savedListings || 0,
        viewedListings: dashboardData.stats?.viewedListings || 0,
        upcomingInspections: dashboardData.stats?.upcomingInspections || 0,
        recentSearches: dashboardData.stats?.recentSearches || 0,
        matches: dashboardData.stats?.matches || 0,
        notifications: dashboardData.stats?.notifications || 0,
      },
    };
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    // Return default data structure in case of error
    return {
      stats: {
        savedListings: 0,
        viewedListings: 0,
        upcomingInspections: 0,
        recentSearches: 0,
        matches: 0,
        notifications: 0,
      },
    };
  }
}

/**
 * Fetches user's favorite listings
 * @param {Object} options - Options for fetching favorites
 * @param {number} options.limit - Maximum number of favorites to fetch
 * @returns {Promise<Array>} Array of favorite listings
 */
export async function fetchUserFavorites({ limit = 10 } = {}) {
  try {
    const response = await fetch(
      `${API_ROUTES.USER_FAVORITES}?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error fetching user favorites");
    }

    const { data } = await response.json();
    return data.favorites;
  } catch (error) {
    console.error("Favorites fetch error:", error);
    throw error;
  }
}

/**
 * Fetches user's scheduled inspections
 * @param {Object} options - Options for fetching inspections
 * @param {number} options.limit - Maximum number of inspections to fetch
 * @param {boolean} options.futureOnly - Whether to fetch only future inspections
 * @returns {Promise<Array>} Array of scheduled inspections
 */
export async function fetchUserInspections({
  limit = 5,
  futureOnly = true,
} = {}) {
  try {
    const query = new URLSearchParams({
      limit: limit.toString(),
      futureOnly: futureOnly.toString(),
    });

    const response = await fetch(`${API_ROUTES.USER_INSPECTIONS}?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error fetching user inspections");
    }

    const { data } = await response.json();
    return data.inspections;
  } catch (error) {
    console.error("Inspections fetch error:", error);
    throw error;
  }
}
