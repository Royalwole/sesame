/**
 * Enhanced wrapper for listing API functions
 * This exports all the fixed functions and ensures they work properly
 */

// Import fixed functions
import { getListingByIdFixed } from "./listing-api-fixed";

// Import standard functions from the main API
import {
  fetchListings,
  getAgentListings,
  getPublicListings,
} from "./listing-api";

// Import recovery functions for extreme fallback cases
import { recoverListingById, attemptListingRecovery } from "./listing-recovery";

// Import fetch utilities
import {
  fetchWithTimeout,
  isAbortError,
  isTimeoutError,
  withFetchTimeout,
} from "./fetch-with-timeout";

// Re-export everything with fixed versions taking precedence
export {
  // Core listing functions
  getListingByIdFixed as getListingById,
  fetchListings,
  getAgentListings,
  getPublicListings,

  // Recovery functions
  recoverListingById,
  attemptListingRecovery,

  // Fetch utilities
  fetchWithTimeout,
  isAbortError,
  isTimeoutError,
  withFetchTimeout,
};
