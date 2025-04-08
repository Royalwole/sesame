/**
 * Standardized API response utilities for consistent response formats
 */

/**
 * Create a standardized success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data payload
 * @param {String} message - Success message
 * @param {Number} status - HTTP status code (default: 200)
 */
export function sendSuccess(res, data = {}, message = "Success", status = 200) {
  res.status(status).json({
    success: true,
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create a standardized error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} status - HTTP status code (default: 400)
 * @param {Object} errors - Validation or other detailed errors
 */
export function sendError(res, message = "Error", status = 400, errors = null) {
  const response = {
    success: false,
    status,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(status).json(response);
}

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors object
 * @param {String} message - Error message
 */
export function sendValidationError(
  res,
  errors,
  message = "Validation failed"
) {
  sendError(res, message, 400, errors);
}

/**
 * Send a not found error response
 * @param {Object} res - Express response object
 * @param {String} resource - Name of the resource not found
 */
export function sendNotFound(res, resource = "Resource") {
  sendError(res, `${resource} not found`, 404);
}

/**
 * Send an unauthorized error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export function sendUnauthorized(res, message = "Authentication required") {
  sendError(res, message, 401);
}

/**
 * Send a forbidden error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
export function sendForbidden(res, message = "Access denied") {
  sendError(res, message, 403);
}

/**
 * Send a server error response
 * @param {Object} res - Express response object
 * @param {Error} error - Original error object
 * @param {String} message - Error message
 */
export function sendServerError(res, error, message = "Internal server error") {
  console.error("[API Error]", error);

  const response = {
    success: false,
    status: 500,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add debug details in development
  if (process.env.NODE_ENV === "development") {
    response.debug = {
      error: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  res.status(500).json(response);
}
