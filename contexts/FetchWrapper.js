/**
 * Enhanced fetch wrapper with retry capability and timeout handling
 */
export async function fetchWithRetry(url, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const timeout = options.timeout || 8000; // 8 seconds default timeout
  const retryDelay = options.retryDelay || 1000;

  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Create a controller for this attempt
    const controller = new AbortController();
    let timeoutId;

    try {
      // Create a custom abort reason for timeouts
      const timeoutError = new DOMException("Request timeout", "TimeoutError");

      // Set timeout for this attempt
      timeoutId = setTimeout(() => {
        console.log(`Request to ${url} timed out after ${timeout}ms`);
        controller.abort(timeoutError);
      }, timeout);

      // Use the controller's signal - AbortSignal.any isn't widely supported
      const fetchOptions = {
        ...options,
        signal: controller.signal,
      };

      // Remove any potentially problematic options
      delete fetchOptions.maxRetries;
      delete fetchOptions.retryDelay;
      delete fetchOptions.timeout;

      // Attempt the fetch
      console.log(`Fetch attempt ${attempt + 1}/${maxRetries} to ${url}`);
      const response = await fetch(url, fetchOptions);

      // Clear the timeout since we got a response
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP error ${response.status}` };
        }

        throw new Error(
          `Server responded with ${response.status}: ${
            errorData.message || errorData.error || response.statusText
          }`
        );
      }

      // Parse JSON response safely
      try {
        const data = await response.json();
        return data;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      // Always clear timeout to prevent memory leaks
      if (timeoutId) clearTimeout(timeoutId);

      lastError = error;
      console.error(
        `Fetch attempt ${attempt + 1}/${maxRetries} failed:`,
        error.message
      );

      // Check if this is a timeout error we generated
      const isTimeoutError =
        error.name === "TimeoutError" ||
        (error.name === "AbortError" && error.message === "Request timeout");

      // Don't retry if the request was aborted for reasons other than our timeout
      if (error.name === "AbortError" && !isTimeoutError) {
        console.log("Request was manually aborted, not retrying");
        throw error;
      }

      // Last attempt failed, throw the error
      if (attempt === maxRetries - 1) {
        console.log(`All ${maxRetries} attempts failed, giving up`);
        throw error;
      }

      // Wait before retrying with exponential backoff
      const retryWait = retryDelay * Math.pow(2, attempt);
      console.log(`Waiting ${retryWait}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, retryWait));
      console.log("Retrying request...");
    }
  }

  throw lastError;
}

/**
 * Helper function to check if we should redirect to agent dashboard
 */
export function shouldRedirectToAgentDashboard(user) {
  if (!user) return false;
  return user.role === "agent" || user.role === "agent_pending";
}
