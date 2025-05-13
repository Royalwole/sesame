// filepath: c:\Users\HomePC\Desktop\topdial\lib\api-resilience.js
/**
 * API Resilience utilities to prevent API failures from causing authentication loops
 */

// Default fallback values for common API responses
const FALLBACKS = {
  // User profile fallback
  profile: {
    _id: "fallback_user",
    clerkId: "unknown",
    firstName: "User",
    lastName: "",
    email: "",
    role: "user", // Always default to regular user role
    approved: false,
    isEmergencyFallback: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Dashboard data fallback
  dashboard: {
    stats: {
      savedListings: 0,
      viewedListings: 0,
      upcomingInspections: 0,
      recentSearches: 0,
      matches: 0,
      notifications: 0,
    },
    isEmergencyFallback: true,
  },

  // Empty array fallback for collections
  emptyArray: [],
};

/**
 * Wrapper for fetch that handles errors gracefully
 * Returns fallback data instead of throwing errors to prevent auth loops
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {any} fallbackData - Data to return if fetch fails
 * @returns {Promise<any>} - The response data or fallback
 */
export async function resilientFetch(url, options = {}, fallbackData = null) {
  // Store the timeout ID outside the try block to ensure we can clear it
  let fetchTimeoutId = null;

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    fetchTimeoutId = setTimeout(() => {
      console.warn(`Request timeout for ${url} - aborting after 5 seconds`);
      controller.abort();
    }, 5000); // 5 second timeout

    // Ensure URL starts with /api if it's a relative URL and doesn't already
    const apiUrl =
      url.startsWith("/") && !url.startsWith("/api") ? `/api${url}` : url;

    // Prepare fetch options with the abort signal
    const fetchOptions = {
      ...options,
      signal: controller.signal,
      credentials: "include", // Ensure cookies are sent
    };

    // Attempt the fetch
    const response = await fetch(apiUrl, fetchOptions);

    // Clear timeout as soon as we get a response
    if (fetchTimeoutId) {
      clearTimeout(fetchTimeoutId);
      fetchTimeoutId = null;
    }

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`Non-JSON response from ${url}: ${contentType}`);
      return fallbackData;
    }

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`JSON parse error from ${url}:`, parseError);
      return fallbackData;
    }

    // Even if status is not OK, return the data if present to prevent undefined errors
    if (!response.ok) {
      console.warn(`API error ${response.status} from ${url}`);
      return data.data || fallbackData;
    }

    // Return successful data
    return data.data || data;
  } catch (error) {
    // Always clear the timeout if there's an error
    if (fetchTimeoutId) {
      clearTimeout(fetchTimeoutId);
      fetchTimeoutId = null;
    }

    // Better error handling with more informative messages
    if (error.name === "AbortError") {
      console.warn(`Request aborted for ${url} - timeout or user navigation`);
    } else if (
      error instanceof TypeError &&
      error.message.includes("NetworkError")
    ) {
      console.warn(`Network error for ${url} - API may be unavailable`);
    } else {
      console.error(`Fetch error for ${url}:`, error);
    }

    return fallbackData;
  }
}

/**
 * Resilient user profile fetch - never throws, always returns usable data
 */
export async function fetchUserProfile() {
  return resilientFetch("/users/profile", {}, FALLBACKS.profile);
}

/**
 * Resilient dashboard data fetch - never throws, always returns usable data
 */
export async function fetchDashboardData() {
  return resilientFetch("/user/dashboard-data", {}, FALLBACKS.dashboard);
}

/**
 * Resilient favorites fetch - never throws, always returns an array
 */
export async function fetchFavorites(limit = 6) {
  const result = await resilientFetch(
    `/user/favorites?limit=${limit}`,
    {},
    { favorites: [] }
  );
  // Handle different response structures
  if (Array.isArray(result)) {
    return result;
  } else if (result && Array.isArray(result.favorites)) {
    return result.favorites;
  }
  return [];
}

/**
 * Resilient inspections fetch - never throws, always returns an array
 */
export async function fetchInspections(limit = 5, futureOnly = true) {
  const result = await resilientFetch(
    `/user/inspections?limit=${limit}&futureOnly=${futureOnly}`,
    {},
    { inspections: [] }
  );

  // Handle different response structures
  if (Array.isArray(result)) {
    return result;
  } else if (result && Array.isArray(result.inspections)) {
    return result.inspections;
  }
  return [];
}

/**
 * Utility to make any API request resilient to failures
 * @param {Function} apiCall - The API call function
 * @param {any} fallbackData - Data to return if the call fails
 * @returns {Promise<any>} - The result or fallback data
 */
export async function makeResilient(apiCall, fallbackData = null) {
  try {
    const result = await apiCall();
    return result || fallbackData;
  } catch (error) {
    console.error("API call failed, using fallback:", error);
    return fallbackData;
  }
}

/**
 * API availability checker - returns true if APIs seem to be working
 * Use this to display offline indicators in the UI
 */
export async function checkApiAvailability() {
  // Store timeout ID outside try block to ensure we can clear it
  let healthCheckTimeoutId = null;

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    healthCheckTimeoutId = setTimeout(() => {
      console.warn("API health check timeout - aborting after 3 seconds");
      controller.abort();
    }, 3000); // 3 second timeout for health check

    const response = await fetch("/api/health?t=" + Date.now(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    // Clear timeout when response is received
    if (healthCheckTimeoutId) {
      clearTimeout(healthCheckTimeoutId);
      healthCheckTimeoutId = null;
    }

    return response.ok;
  } catch (error) {
    // Always clear timeout on error
    if (healthCheckTimeoutId) {
      clearTimeout(healthCheckTimeoutId);
      healthCheckTimeoutId = null;
    }

    // Provide more specific error information
    if (error.name === "AbortError") {
      console.warn("API health check timed out");
    } else if (
      error instanceof TypeError &&
      error.message.includes("NetworkError")
    ) {
      console.warn("API health check network error - server may be down");
    } else {
      console.warn("API health check failed:", error);
    }

    return false;
  }
}
