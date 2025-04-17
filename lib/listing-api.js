import toast from "react-hot-toast";

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

  while (currentRetry <= retries) {
    try {
      // Add cache busting parameter
      const cacheBuster = `_cb=${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const separator = endpoint.includes("?") ? "&" : "?";
      const urlWithCache = `${endpoint}${separator}${cacheBuster}`;

      // Prepare fetch options with defaults
      const fetchOptions = {
        credentials: "include",
        headers: {
          "Cache-Control": "no-store",
          Accept: "application/json",
          Pragma: "no-cache",
          "X-Requested-With": "XMLHttpRequest",
        },
        ...options,
      };

      // Use AbortController for timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      fetchOptions.signal = controller.signal;

      try {
        // Execute fetch
        const response = await fetch(urlWithCache, fetchOptions);
        clearTimeout(timeoutId);

        // Process response with error handling
        return await processResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error; // Re-throw for outer catch
      }
    } catch (error) {
      // Last retry failed, use fallback data
      if (currentRetry === retries) {
        console.error(
          `Failed to fetch from ${endpoint} after ${retries} retries:`,
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
          message: `Using fallback data after failed fetch attempts: ${error?.message || "Network error"}`,
        };
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, currentRetry) * 500;
      console.log(
        `Retry ${currentRetry + 1}/${retries} after ${delay}ms for ${endpoint}`
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
    const data = await fetchListings(
      `/api/listings/agent?page=${page}&limit=${limit}`
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
    };
  } catch (error) {
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
  // Server-side safety check - don't show toast on server
  const isClient = typeof window !== "undefined";

  try {
    // Clean filters - remove undefined/null/empty values
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Build query string from filters
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...cleanFilters,
    }).toString();

    const data = await fetchListings(`/api/listings?${queryParams}`);

    // Ensure we have array data, even if response is malformed
    const listings = Array.isArray(data.listings) ? data.listings : [];
    const pagination = data.pagination || {
      total: 0,
      currentPage: page,
      totalPages: 1,
      limit,
    };

    // Show fallback warning only on client
    if (isClient && data.fallback) {
      toast.warning(data.message || "Using fallback listings data");
    }

    return {
      listings,
      pagination,
      success: true,
      fallback: data.fallback,
    };
  } catch (error) {
    console.error("Failed to load listings:", error);

    // Show toast only on client
    if (isClient) {
      toast.error("Failed to load listings. Please try again later.");
    }

    return {
      listings: [],
      pagination: { total: 0, currentPage: page, totalPages: 1, limit },
      success: false,
    };
  }
}

/**
 * Helper to fetch a single listing by ID with enhanced error handling and diagnostics
 */
export async function getListingById(id) {
  if (!id) {
    console.error("[getListingById] Called with no ID");
    return { success: false, error: "No listing ID provided", listing: null };
  }

  // Extract the pure ID without any query parameters
  const pureId = String(id).split("?")[0].trim();

  const diagnostics = {
    startTime: Date.now(),
    attempts: 0,
    errors: [],
    requestId: Math.random().toString(36).substring(2, 10),
  };

  // IMPORTANT: Create a new AbortController for each attempt
  // This fixes the "signal is aborted without reason" error
  let currentRetry = 0;
  const MAX_RETRIES = 2; // Increase retries for better reliability

  // Return early if the ID doesn't seem valid
  if (!pureId || pureId === "undefined" || pureId === "null") {
    console.error(`[getListingById] Invalid ID provided: ${id}`);
    return {
      success: false,
      error: "Invalid listing ID",
      diagnostics,
    };
  }

  console.log(`[getListingById] Starting request for listing: ${pureId}`);

  let data; // Declare data variable in the outer scope

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Create a NEW controller for each attempt
    const controller = new AbortController();
    let timeoutId = null;

    try {
      diagnostics.attempts++;
      console.log(
        `[getListingById] Attempt ${attempt + 1}/${
          MAX_RETRIES + 1
        } for ID: ${pureId}`
      );

      // Set timeout AFTER controller is created - increased to 30 seconds
      timeoutId = setTimeout(() => {
        console.warn(
          `[getListingById] Request timeout after 30 seconds for ID: ${pureId}`
        );
        controller.abort();
      }, 30000); // 30 second timeout increased from 20s

      // Create a unique cache-busting parameter with more entropy
      const cacheBuster = `_nocache=${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 12)}`;

      // Try both direct API and fixed-fetch endpoint for robustness
      const endpoint =
        attempt === 0
          ? `/api/listings/${pureId}?${cacheBuster}`
          : `/api/listings/fixed-fetch?id=${pureId}&${cacheBuster}`;

      console.log(`[getListingById] Fetching URL: ${endpoint}`);

      const response = await fetch(endpoint, {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          "X-Debug-ID": diagnostics.requestId,
          "X-Attempt-Number": String(attempt + 1),
        },
        signal: controller.signal,
        cache: "no-store",
      });

      // Clear timeout as soon as response is received
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Use the processResponse helper function for consistent error handling
      try {
        data = await processResponse(response); // Now using the outer scope variable
      } catch (error) {
        // Add more context to the error
        error.message = `Listing ${pureId}: ${error.message}`;
        throw error;
      }

      // Validate response structure (additional checks after processing)
      if (!data) {
        throw new Error("Empty response from server");
      }

      if (!data.listing) {
        if (data.success === false) {
          throw new Error(
            data.error || data.message || "Server reported failure"
          );
        }
        throw new Error("Response missing listing data");
      }

      // Success! Return the listing data
      console.log(
        `[getListingById] Success! Retrieved listing: ${
          data.listing.title || "[No Title]"
        }`
      );
      return {
        success: true,
        listing: data.listing,
        diagnostics: {
          ...diagnostics,
          duration: Date.now() - diagnostics.startTime,
          attempts: diagnostics.attempts,
        },
      };
    } catch (error) {
      // Always clear timeout to prevent memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Record error details
      const errorInfo = {
        attempt: attempt + 1,
        message: error.message,
        name: error.name,
        timestamp: Date.now(),
        endpoint: attempt === 0 ? "standard" : "fixed-fetch",
      };
      diagnostics.errors.push(errorInfo);

      console.warn(
        `[getListingById] Attempt ${attempt + 1} failed: ${error.name} - ${
          error.message
        }`
      );

      // Check if this was an abort error
      if (error.name === "AbortError") {
        console.warn(
          `[getListingById] Request was aborted (timeout) for ID: ${pureId}`
        );

        // If this was the last attempt, return the error
        if (attempt === MAX_RETRIES) {
          return {
            success: false,
            error: "Request timed out. Please try again.",
            diagnostics,
          };
        }
      }

      // If this was the last retry, return the error details
      if (attempt === MAX_RETRIES) {
        console.error(`[getListingById] All attempts failed for ID: ${pureId}`);
        return {
          success: false,
          error:
            error.message || "Failed to load listing after multiple attempts",
          diagnostics,
        };
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Fallback error - should not normally reach here
  return {
    success: false,
    error: "Failed to load listing data",
    diagnostics,
  };
}
