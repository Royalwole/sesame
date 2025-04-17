/**
 * Utility for managing loading timeouts
 */

// Default timeout duration in milliseconds
const DEFAULT_TIMEOUT = 15000; // 15 seconds

/**
 * Creates a promise that resolves with either the original promise or a timeout
 * @param {Promise} promise - The promise to add a timeout to
 * @param {number} ms - Timeout in milliseconds
 * @param {string} errorMessage - Message to show on timeout
 * @returns {Promise} A promise that rejects if the timeout is reached
 */
export function withTimeout(
  promise,
  ms = DEFAULT_TIMEOUT,
  errorMessage = "Operation timed out"
) {
  const timeoutPromise = new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    // Clean up timeout if promise resolves or rejects before timeout
    promise.finally(() => clearTimeout(timeoutId));
  });

  // Race the original promise against the timeout
  return Promise.race([promise, timeoutPromise]);
}

/**
 * React hook for managing async operations with timeouts
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} State and execution function
 */
export function useAsyncWithTimeout(asyncFunction, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    errorMessage = "Operation timed out",
    onTimeout = null,
    dependencies = [],
  } = options;

  const [state, setState] = React.useState({
    isLoading: false,
    error: null,
    data: null,
  });

  const execute = React.useCallback(
    async (...args) => {
      setState({ isLoading: true, error: null, data: null });

      try {
        const result = await withTimeout(
          asyncFunction(...args),
          timeout,
          errorMessage
        );

        setState({ isLoading: false, error: null, data: result });
        return result;
      } catch (error) {
        setState({ isLoading: false, error, data: null });

        if (error.message === errorMessage && onTimeout) {
          onTimeout(error);
        }

        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asyncFunction, timeout, errorMessage, onTimeout, ...dependencies]
  );

  return { ...state, execute };
}
