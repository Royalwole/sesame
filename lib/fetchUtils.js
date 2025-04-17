/**
 * Utility functions for making fetch requests with improved error handling
 */

/**
 * Fetch JSON data with improved error handling, timeouts, and retries
 *
 * @param {string} url - URL to fetch from
 * @param {Object} options - Options including timeout, retries, and fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function fetchJSON(url, options = {}) {
  const { timeout = 8000, retries = 2, ...fetchOptions } = options;

  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    attempt++;

    try {
      // Create an AbortController for this attempt
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Add headers and signal to options
      const requestOptions = {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store",
          Pragma: "no-cache",
          ...(fetchOptions.headers || {}),
        },
      };

      // Make request
      const response = await fetch(url, requestOptions);

      // Clear timeout
      clearTimeout(timeoutId);

      // Check for non-JSON responses (which might cause the JSON parse to fail)
      const contentType = response.headers.get("content-type");
      const isJSON = contentType && contentType.includes("application/json");

      if (!isJSON) {
        // If not JSON, this could be an HTML error page or other non-JSON response
        const text = await response.text();
        console.error("Non-JSON response received:", {
          status: response.status,
          contentType,
          url,
          preview: text.substring(0, 100) + "...",
        });

        // If it's HTML and seems to be an error page, return fallback data
        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
          console.warn("HTML response detected, using fallback data");
          return {
            success: true,
            listings: [],
            pagination: {
              total: 0,
              currentPage: 1,
              totalPages: 1,
              limit: 10,
            },
            message: "Using fallback data (received HTML instead of JSON)",
            fallback: true,
          };
        }

        throw new Error(
          `Expected JSON but got ${contentType || "unknown content"} (HTTP ${response.status})`
        );
      }

      // Parse JSON with error handling
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Return fallback data structure instead of throwing on parse error
        return {
          success: true,
          listings: [],
          pagination: {
            total: 0,
            currentPage: 1,
            totalPages: 1,
            limit: 10,
          },
          message: "Using fallback data (invalid JSON response)",
          fallback: true,
        };
      }

      // Check for API error responses
      if (!response.ok) {
        const errorMessage =
          data?.error || data?.message || `HTTP error ${response.status}`;
        throw new Error(errorMessage);
      }

      // Success case
      return data;
    } catch (error) {
      lastError = error;

      // Don't retry if we've reached max attempts or it's an abort error
      if (attempt > retries || error.name === "AbortError") {
        break;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Retry ${attempt}/${retries} after ${delay}ms for ${url}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // If we've exhausted retries, use fallback data instead of throwing
  console.error(
    `Failed after ${retries} attempts: ${lastError?.message || "Unknown error"}`
  );

  return {
    success: true,
    listings: [],
    pagination: {
      total: 0,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
    },
    message: `Using fallback data after failed fetch attempts: ${lastError?.message || "Network error"}`,
    fallback: true,
  };
}

/**
 * Safely extract data from API response with structured error handling
 *
 * @param {Response} response - Fetch Response object
 * @returns {Promise<any>} - Parsed response data
 */
export async function safelyParseResponse(response) {
  if (!response.ok) {
    const contentType = response.headers.get("content-type");

    // For JSON error responses, extract the error message
    if (contentType && contentType.includes("application/json")) {
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP error ${response.status}`
        );
      } catch (parseError) {
        // If JSON parsing fails, throw generic error with status
        throw new Error(`Server error (${response.status})`);
      }
    } else {
      // For non-JSON error responses
      throw new Error(`Server error (${response.status})`);
    }
  }

  // Parse successful response
  try {
    return await response.json();
  } catch (error) {
    console.error("Error parsing successful response:", error);
    throw new Error("Invalid data received from server");
  }
}
