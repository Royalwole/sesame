/**
 * This is a patched version of the getListingById function that fixes the AbortError issues
 * by using the fetch-with-timeout utility. It properly handles aborted signals
 * and avoids the "signal is aborted without reason" error.
 */

import toast from "react-hot-toast";

/**
 * Enhanced version of getListingById that fixes AbortError issues
 */
export async function getListingByIdFixed(id) {
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

  // Define max retries
  const MAX_RETRIES = 2; // Up to 3 total attempts for better reliability

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

  // Strategy: Try fixed-fetch first, then standard endpoint, then recovery
  let strategies = [
    { endpoint: `/api/listings/fixed-fetch?id=${pureId}`, type: "fixed-fetch" },
    { endpoint: `/api/listings/${pureId}`, type: "standard" },
    {
      endpoint: `/api/listings/fixed-fetch?id=${pureId}&forceDirect=true`,
      type: "recovery",
    },
  ];

  // Import the utilities once
  const { fetchWithTimeout, isAbortError } = await import(
    "./fetch-with-timeout"
  );

  // Process API response with consistent error handling
  const processResponse = async (response) => {
    // Check for redirects to authentication pages
    if (response.redirected && response.url.includes("/auth")) {
      throw new Error("Authentication required. Please sign in.");
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();

      // If it looks like an auth page, provide a specific error
      if (
        text.includes("sign-in") ||
        text.includes("login") ||
        text.includes("<title>Sign In</title>")
      ) {
        throw new Error("Authentication required. Please sign in to continue.");
      }

      // Fallback data for non-JSON responses
      return {
        success: true,
        listing: null,
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
      return {
        success: true,
        listing: null,
        fallback: true,
        message: "Using fallback data (invalid JSON response)",
      };
    }
  };

  // Try each strategy
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Select strategy based on attempt number
    const strategy = strategies[Math.min(attempt, strategies.length - 1)];

    try {
      diagnostics.attempts++;
      console.log(
        `[getListingById] Attempt ${attempt + 1}/${MAX_RETRIES + 1} using "${strategy.type}" strategy for ID: ${pureId}`
      );

      // Create a unique cache-busting parameter
      const cacheBuster = `_nocache=${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
      const endpoint = `${strategy.endpoint}${strategy.endpoint.includes("?") ? "&" : "?"}${cacheBuster}`;

      console.log(`[getListingById] Fetching URL: ${endpoint}`);

      // Use our enhanced fetch utility that handles AbortController properly
      const response = await fetchWithTimeout(
        endpoint,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            "X-Debug-ID": diagnostics.requestId,
            "X-Attempt-Number": String(attempt + 1),
            "X-Strategy": strategy.type,
          },
          cache: "no-store",
        },
        30000, // 30 second timeout
        `Request timeout after 30s for listing ID: ${pureId}`
      );

      // Process response
      let data;
      try {
        data = await processResponse(response);
      } catch (error) {
        error.message = `Listing ${pureId}: ${error.message}`;
        throw error;
      }

      // Validate response structure
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

      // Verify ID consistency
      const returnedId = data.listing._id ? String(data.listing._id) : null;

      if (!returnedId) {
        console.warn(
          `[getListingById] Missing ID in response for listing "${data.listing.title}"`
        );
      } else if (returnedId !== pureId) {
        console.warn(
          `[getListingById] ID mismatch! Requested: ${pureId}, Found: ${returnedId}`
        );

        // Only accept ID mismatch from recovery/fixed-fetch strategies
        if (strategy.type === "standard") {
          throw new Error(
            `ID mismatch error: Expected ${pureId}, got ${returnedId}`
          );
        } else {
          console.log(
            `[getListingById] Accepting ID mismatch from ${strategy.type} strategy`
          );
        }
      }

      // Success! Return the listing data
      console.log(
        `[getListingById] Success! Retrieved listing: ${
          data.listing.title || "[No Title]"
        } with ID ${returnedId}`
      );

      return {
        success: true,
        listing: data.listing,
        idMatch: returnedId === pureId,
        diagnostics: {
          ...diagnostics,
          duration: Date.now() - diagnostics.startTime,
          attempts: diagnostics.attempts,
          strategy: strategy.type,
        },
      };
    } catch (error) {
      // Record error details
      const errorInfo = {
        attempt: attempt + 1,
        message: error.message,
        name: error.name,
        timestamp: Date.now(),
        strategy: strategy.type,
      };
      diagnostics.errors.push(errorInfo);

      console.warn(
        `[getListingById] Attempt ${attempt + 1} failed with ${strategy.type} strategy: ${error.name} - ${error.message}`
      );

      // Check if this was an abort error
      if (isAbortError(error)) {
        console.warn(
          `[getListingById] Request was aborted (timeout or manual abort)`
        );
        diagnostics.timeouts = (diagnostics.timeouts || 0) + 1;

        // Add brief delay before next attempt with exponential backoff
        const delayMs = Math.min(500 * Math.pow(2, attempt), 5000); // Max 5 second delay
        console.log(
          `[getListingById] Waiting ${delayMs}ms before next attempt`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
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

      // Wait before retry with exponential backoff
      const delay = Math.min(Math.pow(2, attempt) * 500, 2000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Fallback error - should not normally reach here
  return {
    success: false,
    error: "Failed to load listing data after exhausting all options",
    diagnostics,
  };
}

// Export a replacement for the original function
export const getListingById = getListingByIdFixed;

export default {
  getListingByIdFixed,
  getListingById: getListingByIdFixed,
};
