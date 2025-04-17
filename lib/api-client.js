/**
 * Helper function to make authenticated API requests for listings
 */
export async function createListing(formData) {
  try {
    // Track request time
    const startTime = performance.now();

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("/api/listings/create", {
      method: "POST",
      body: formData,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const endTime = performance.now();
    console.log(
      `Listing API response time: ${(endTime - startTime).toFixed(0)}ms`
    );

    // Check content type before attempting to parse JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Unexpected response format:", contentType);
      throw new Error(
        `Server returned non-JSON response: ${contentType || "unknown"}`
      );
    }

    // Parse the response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Invalid server response");
    }

    // Handle error responses
    if (!response.ok) {
      const errorMessage = data.message || data.error || response.statusText;

      // Add contextual info based on status
      if (response.status === 400) {
        throw new Error(`Validation error: ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error(`Authentication error: Please sign in again`);
      } else if (response.status === 413) {
        throw new Error(`Files too large: Please reduce image sizes`);
      } else {
        throw new Error(`Failed to create listing: ${errorMessage}`);
      }
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === "AbortError") {
      throw new Error("Request timed out - server may be overloaded");
    }

    throw error;
  }
}

/**
 * Get all listings for an agent
 */
export async function getAgentListings() {
  try {
    const response = await fetch("/api/listings/agent", {
      credentials: "include",
    });

    // Check content type before attempting to parse JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Unexpected response format:", contentType);
      throw new Error(
        `Server returned non-JSON response: ${contentType || "unknown"}`
      );
    }

    // Parse JSON safely - only once
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid server response format");
    }

    if (!response.ok) {
      throw new Error(
        data.error || `Failed to fetch listings: ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching agent listings:", error);
    throw error;
  }
}

// Helper to check if we're on an auth page
export function isAuthPage() {
  if (typeof window === "undefined") return false;

  return (
    window.location.pathname.includes("/auth/") ||
    window.location.pathname.includes("/sign-in") ||
    window.location.pathname.includes("/sign-up")
  );
}

// Helper to check if the current user is authenticated
export function checkAuthenticated() {
  // Check for authentication status in sessionStorage
  // (we'll use this as a hint to avoid unnecessary API calls)
  if (typeof window === "undefined") return false;

  const authStatus = sessionStorage.getItem("isAuthenticated");
  return authStatus === "true";
}

// Set authentication status
export function setAuthenticated(status) {
  if (typeof window === "undefined") return;

  if (status) {
    sessionStorage.setItem("isAuthenticated", "true");
  } else {
    sessionStorage.removeItem("isAuthenticated");
  }
}
