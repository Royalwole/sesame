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

/**
 * Log listing-related events for debugging and tracking
 * @param {Object} eventData - Data about the listing event
 * @param {string} eventData.type - Event type (e.g., LISTING_CREATED, SERVICE_ERROR)
 * @param {string} eventData.action - The action being performed (optional)
 * @param {string} eventData.id - Listing ID (if applicable)
 * @param {string} eventData.userId - User ID (if applicable)
 * @param {string} eventData.error - Error message (if applicable)
 * @param {Object} eventData.metadata - Additional context data
 */
export function logListingEvent(eventData = {}) {
  const timestamp = new Date();

  // Create standardized event entry
  const eventEntry = {
    timestamp,
    type: eventData.type || "UNKNOWN_EVENT",
    action: eventData.action,
    id: eventData.id,
    userId: eventData.userId,
    error: eventData.error,
    metadata: eventData.metadata || {},
  };

  // For development, log detailed information
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[${timestamp.toISOString()}][LISTING:${eventData.type}]`,
      eventData
    );
  } else {
    // For production, log more concisely
    console.log(
      `[${timestamp.toISOString()}][LISTING:${eventData.type}] ID: ${eventData.id || "N/A"}, Action: ${eventData.action || "N/A"}`
    );

    // Only log errors in production
    if (eventData.error) {
      console.error(
        `[${timestamp.toISOString()}][LISTING_ERROR] ${eventData.error}`
      );
    }
  }

  // Here you could send important events to an analytics or monitoring service
}

export default {
  logError,
  getRecentErrors,
  clearErrorLog,
  logListingEvent,
};
