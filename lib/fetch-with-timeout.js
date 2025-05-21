/**
 * Fetch With Timeout Utility
 *
 * Provides consistent AbortController handling for fetch requests with timeouts.
 * This utility helps prevent "signal is aborted without reason" errors by
 * ensuring proper AbortController lifecycle management.
 */

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

export const isTimeoutError = (error) => error instanceof TimeoutError;

/**
 * Performs a fetch request with a configurable timeout
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Standard fetch options
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @param {string} [timeoutReason="Request timed out"] - Reason for timeout
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 30000,
  timeoutReason = "Request timed out"
) {
  // Create a new AbortController for this request
  const controller = new AbortController();
  let timeoutId;

  try {
    // Merge the abort signal with any existing options
    const fetchOptions = {
      ...options,
      signal: controller.signal,
    };

    // Create a race between the fetch and a timeout
    const fetchPromise = fetch(url, fetchOptions);

    // Create the timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const abortError = new DOMException(timeoutReason, "AbortError");
        abortError.isTimeout = true;
        controller.abort(timeoutReason);
        reject(abortError);
      }, timeoutMs);
    });

    // Race the fetch against the timeout
    return await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    // Always clear the timeout to prevent memory leaks
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Helper to determine if an error is an AbortError
 * Handles various browser implementations
 *
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's an abort error
 */
export function isAbortError(error) {
  return (
    error.name === "AbortError" ||
    error.code === 20 || // DOMException code for abort
    (error.message &&
      (error.message.includes("abort") || error.message.includes("timeout")))
  );
}

/**
 * Wraps a fetch call with proper timeout and AbortController handling
 *
 * @param {Function} fetchFn - Async function that performs the actual fetch call
 * @param {Object} options - Options for the wrapper
 * @param {number} [options.timeoutMs=30000] - Timeout in milliseconds
 * @param {number} [options.retries=0] - Number of retries on failure
 * @param {number} [options.retryDelayMs=500] - Delay between retries in milliseconds
 * @param {Function} [options.onTimeout] - Callback when timeout occurs
 * @param {Function} [options.onRetry] - Callback when retry is attempted
 * @returns {Promise<any>} - Response from the fetch function
 */
export async function withFetchTimeout(fetchFn, options = {}) {
  const {
    timeoutMs = 30000,
    retries = 0,
    retryDelayMs = 500,
    onTimeout,
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Create a new controller for each attempt
    const controller = new AbortController();
    let timeoutId;

    try {
      // Set timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const reason = `Request timed out after ${timeoutMs}ms`;
          controller.abort(reason);
          const error = new DOMException(reason, "AbortError");
          error.isTimeout = true;

          // Call timeout callback if provided
          if (onTimeout) onTimeout(error, attempt);

          reject(error);
        }, timeoutMs);
      });

      // Call the fetch function with the abort signal
      const fetchPromise = fetchFn({ signal: controller.signal });

      // Race the promises
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      // Save the last error for potential rethrow
      lastError = error;

      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // If this is an abort error and we have retries left
      if (isAbortError(error) && attempt < retries) {
        // Call retry callback if provided
        if (onRetry) onRetry(error, attempt);

        // Add exponential backoff delay
        const delay = retryDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Continue to the next retry
        continue;
      }

      // If we've exhausted retries or it's not an abort error, rethrow
      throw error;
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Request failed after all retries");
}
