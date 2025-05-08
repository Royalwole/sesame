/**
 * Centralized error logging service
 * Used to log and track errors across the application
 */

// Track errors for monitoring purposes
const errorLog = [];
const MAX_ERROR_LOG_SIZE = 100;

/**
 * Log an error with additional context
 * @param {string} source - Where the error occurred
 * @param {Error} error - The error object
 * @param {Object} context - Additional context data
 */
export function logError(source, error, context = {}) {
  const timestamp = new Date();

  // Create standardized error entry
  const errorEntry = {
    timestamp,
    source,
    message: error.message,
    stack: error.stack,
    code: error.code,
    name: error.name,
    ...context,
  };

  // Log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${timestamp.toISOString()}] Error in ${source}:`, error);
    if (Object.keys(context).length > 0) {
      console.error("Context:", context);
    }
  } else {
    // In production, log more concisely
    console.error(
      `[${timestamp.toISOString()}][${source}] ${error.name}: ${error.message}`
    );
  }

  // Store in memory log (with limit)
  errorLog.unshift(errorEntry);
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.pop();
  }

  // Here you could send the error to an external logging service
  // like Sentry, LogRocket, etc.
}

/**
 * Get recent application errors
 * @param {number} limit - Maximum number of errors to return
 * @returns {Array} Recent errors
 */
export function getRecentErrors(limit = 10) {
  return errorLog.slice(0, limit);
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  errorLog.length = 0;
}

export default {
  logError,
  getRecentErrors,
  clearErrorLog,
};
