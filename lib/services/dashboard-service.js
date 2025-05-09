import { API_ROUTES } from "../api-utils";

/**
 * Service for dashboard related operations
 */
export const DashboardService = {
  /**
   * Fetches all user dashboard data including favorites and inspections
   * @returns {Promise} Dashboard data containing favorites and inspections
   */
  getUserDashboardData: async () => {
    try {
      const response = await fetch(API_ROUTES.USER_DASHBOARD_DATA, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for auth cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error fetching dashboard data");
      }

      return data.data;
    } catch (error) {
      console.error("Dashboard service error:", error);
      throw error;
    }
  },

  /**
   * Refreshes user dashboard data
   * @param {boolean} forceRefresh - Whether to bypass cache
   * @returns {Promise} Dashboard data containing favorites and inspections
   */
  refreshDashboardData: async (forceRefresh = false) => {
    try {
      const url = new URL(
        API_ROUTES.USER_DASHBOARD_DATA,
        window.location.origin
      );

      if (forceRefresh) {
        url.searchParams.append("refresh", "true");
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error refreshing dashboard data");
      }

      return data.data;
    } catch (error) {
      console.error("Dashboard refresh error:", error);
      throw error;
    }
  },
};

export default DashboardService;
