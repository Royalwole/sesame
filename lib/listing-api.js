import toast from "react-hot-toast";

// Import fixed version of getListingById to replace the buggy one
import { getListingByIdFixed } from "./listing-api-fixed";

/**
 * Process API response with consistent error handling
 */
const processResponse = async (response) => {
  // Check for redirects to authentication pages
  if (response.redirected && response.url.includes("/auth")) {
    console.log("Detected redirect to auth page:", response.url);
    throw new Error("Authentication required. Please sign in.");
  }

  // Check content type
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Expected JSON but got:", text.slice(0, 200));

    // If it looks like an auth page, provide a specific error
    if (
      text.includes("sign-in") ||
      text.includes("login") ||
      text.includes("<title>Sign In</title>")
    ) {
      // Store the current path for post-login redirect
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname + window.location.search;
        console.log("Storing redirect path for post-login:", currentPath);
        window.sessionStorage.setItem("redirectAfterLogin", currentPath);

        // Only redirect if we're not already on an auth page
        if (!window.location.pathname.includes("/auth/")) {
          window.location.href = `/auth/sign-in?redirect_url=${encodeURIComponent(
            currentPath
          )}`;
        }
      }

      window.sessionStorage.setItem("authRedirectDetected", "true");
      throw new Error("Authentication required. Please sign in to continue.");
    }

    // Instead of throwing an error, return fallback data
    console.warn("Non-JSON response detected, returning fallback data");
    return {
      success: true,
      listings: [],
      pagination: {
        total: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 10,
      },
      fallback: true,
      message: "Using fallback data (received HTML instead of JSON)",
    };
  }

  // Check for error status codes
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Error ${response.status}: ${response.statusText}`
      );
    } catch (e) {
      // If parsing fails, throw generic error with status
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  // Parse and return the JSON response with error handling
  try {
    return await response.json();
  } catch (e) {
    console.error("Error parsing JSON:", e);
    // Return fallback data instead of throwing
    return {
      success: true,
      listings: [],
      pagination: {
        total: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 10,
      },
      fallback: true,
      message: "Using fallback data (invalid JSON response)",
    };
  }
};

/**
 * Fetch listings with error handling and retries
 * @param {string} endpoint - API endpoint to fetch listings from
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries on failure
 * @returns {Promise<Object>} - Listings data
 */
export async function fetchListings(endpoint, options = {}, retries = 2) {
  let currentRetry = 0;
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  while (currentRetry <= retries) {
    try {
      // Add cache busting parameter with a more sanitized approach
      const cacheBuster = `_cb=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Ensure we have a valid URL by making it absolute if it's relative
      let url = endpoint;

      // If it's a relative URL, ensure it's properly formatted
      if (!url.startsWith("http")) {
        // Make sure it starts with a forward slash
        if (!url.startsWith("/")) {
          url = "/" + url;
        }

        // For client-side, use the window.location to make it absolute
        if (typeof window !== "undefined") {
          const baseUrl = `${window.location.protocol}//${window.location.host}`;
          url = baseUrl + url;
        }
      }

      // Properly append parameters to URL, avoiding duplicating cache busters
      const separator = url.includes("?") ? "&" : "?";
      // Only add cacheBuster if it's not already in the URL
      const urlWithCache =
        !url.includes("_cb=") && !url.includes("_nocache=")
          ? `${url}${separator}${cacheBuster}`
          : url;

      // Enhanced headers to prevent caching at all levels and add request tracking
      const enhancedHeaders = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-Fetch-ID": requestId,
        "X-Retry-Count": String(currentRetry),
        ...(options.headers || {}),
      };

      // Prepare fetch options with defaults
      const fetchOptions = {
        credentials: "include",
        cache: "no-store", // Force fresh data from network
        ...options,
        headers: {
          ...enhancedHeaders,
          ...(options.headers || {}),
        },
      };

      console.log(
        `[fetchListings] Fetching ${urlWithCache}, requestId: ${requestId}, retry: ${currentRetry}`
      );

      // Import the utilities
      const { fetchWithTimeout, isAbortError } = await import(
        "./fetch-with-timeout"
      );

      // Execute fetch with timeout handling built-in (15 second timeout)
      const response = await fetchWithTimeout(
        urlWithCache,
        fetchOptions,
        15000,
        `Request timeout for ${url}`
      );

      // Process response with error handling
      return await processResponse(response);
    } catch (error) {
      // Import the isAbortError utility
      const { isAbortError } = await import("./fetch-with-timeout");

      // Check if it was an abort error
      if (isAbortError(error)) {
        console.warn(
          `[Listing API] Request aborted for: ${endpoint}, requestId: ${requestId}`
        );
        error.context = { endpoint, wasTimeout: true, requestId };
      }

      // Last retry failed, use fallback data
      if (currentRetry === retries) {
        console.error(
          `Failed to fetch from ${endpoint} after ${retries} retries, requestId: ${requestId}`,
          error
        );

        // Return fallback data instead of throwing
        return {
          success: true,
          listings: [],
          pagination: {
            total: 0,
            currentPage: 1,
            totalPages: 1,
            limit: 10,
          },
          fallback: true,
          requestId,
          message: `Using fallback data after failed fetch attempts: ${error?.message || "Network error"}`,
        };
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, currentRetry) * 500;
      console.log(
        `Retry ${currentRetry + 1}/${retries} after ${delay}ms for ${endpoint}, requestId: ${requestId}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increment retry counter
      currentRetry++;
    }
  }
}

/**
 * Helper to fetch agent listings with error handling
 */
export async function getAgentListings(page = 1, limit = 50) {
  try {
    // Generate cache busting parameter
    const cacheBuster = `_t=${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const requestId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // Use fetchListings with cache-busting and no-cache headers
    const data = await fetchListings(
      `/api/listings/agent?page=${page}&limit=${limit}&${cacheBuster}`,
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          "X-Requested-With": "XMLHttpRequest",
          "X-Fetch-Type": "agent-listings",
          "X-Request-ID": requestId,
        },
        cache: "no-store",
      }
    );

    console.log(
      `[getAgentListings] Fetched ${data.listings?.length || 0} listings, request ${requestId}`
    );

    return {
      listings: Array.isArray(data.listings) ? data.listings : [],
      pagination: data.pagination || {
        total: 0,
        currentPage: page,
        totalPages: 1,
        limit,
      },
      success: true,
      fallback: data.fallback,
      requestId,
      timestamp: Date.now(), // Add timestamp to track when data was fetched
    };
  } catch (error) {
    console.error("[getAgentListings] Error:", error);
    toast.error("Failed to load your listings. Please try again later.");
    return {
      listings: [],
      pagination: { total: 0, currentPage: page, totalPages: 1, limit },
      success: false,
    };
  }
}

/**
 * Helper to fetch public listings with error handling
 */
export async function getPublicListings(filters = {}, page = 1, limit = 12) {
  const isClient = typeof window !== "undefined";
  const requestId = `public-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    // Clean filters - remove undefined/null/empty values
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Add timestamp to force fresh data
    const timestamp = Date.now();

    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      _t: timestamp, // Add timestamp to prevent caching
      _rid: requestId, // Add request ID for tracking
      ...cleanFilters,
    }).toString();

    console.log(
      `[getPublicListings] Fetching with filters: ${JSON.stringify(cleanFilters)}, requestId: ${requestId}`
    );

    // Use enhanced fetchListings
    const data = await fetchListings(`/api/listings?${queryParams}`, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        "X-Requested-With": "XMLHttpRequest",
        "X-Fetch-Type": "public-listings",
        "X-Request-ID": requestId,
      },
      cache: "no-store",
    });

    // Make sure listings is always an array
    const listings = Array.isArray(data.listings) ? data.listings : [];

    console.log(
      `[getPublicListings] Fetched ${listings.length} listings, requestId: ${requestId}${
        data.fallback ? " (using fallback data)" : ""
      }`
    );

    // If we received fallback data, log it for debugging
    if (data.fallback) {
      console.warn(
        `[getPublicListings] Using fallback data for request ${requestId}`
      );
    }

    const pagination = data.pagination || {
      total: data.total || 0,
      currentPage: page,
      totalPages: Math.ceil((data.total || 0) / limit),
      limit,
    };

    // Show fallback warning only on client
    if (isClient && data.fallback) {
      toast.warning(data.message || "Using fallback listings data");
    }

    return {
      listings,
      pagination,
      filters: cleanFilters,
      success: true,
      fallback: data.fallback,
      requestId,
      timestamp,
    };
  } catch (error) {
    console.error(`[getPublicListings:${requestId}] Failed:`, error);

    // Show toast only on client
    if (isClient) {
      toast.error("Failed to load listings. Please try again later.");
    }

    return {
      listings: [],
      pagination: { total: 0, currentPage: page, totalPages: 1, limit },
      success: false,
      error: error.message,
    };
  }
}

/**
 * Simplified stub of the original getListingById function
 * This is for documentation purposes only - the real function is imported from listing-api-fixed.js
 */
function getListingByIdOriginal(id) {
  console.warn(
    "[getListingById] Using stub implementation - this should never be called directly"
  );

  if (!id) {
    console.error("[getListingById] Called with no ID");
    return { success: false, error: "No listing ID provided", listing: null };
  }

  // This function is just a placeholder - the real implementation is in listing-api-fixed.js
  return {
    success: false,
    error:
      "This function is replaced by the fixed version in listing-api-fixed.js",
    listing: null,
  };
}

// Re-export the fixed version of getListingById from listing-api-fixed.js
export { getListingByIdFixed as getListingById } from "./listing-api-fixed";
