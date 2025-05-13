// filepath: c:\Users\HomePC\Desktop\topdial\services\dashboardService.js
/**
 * Dashboard API service for handling user dashboard data
 */

import { API_ROUTES } from "../lib/api-utils";
import {
  resilientFetch,
  fetchDashboardData as fetchResilience,
  fetchFavorites as fetchFavoritesResilience,
  fetchInspections as fetchInspectionsResilience,
} from "../lib/api-resilience";

// Configuration for API requests
const API_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 10000,
};

// Use our resilient API fetch functions to prevent auth loops completely
export const fetchUserDashboardData = fetchResilience;
export const fetchUserFavorites = fetchFavoritesResilience;
export const fetchUserInspections = fetchInspectionsResilience;
