/**
 * Utilities for consistent API responses and error handling
 */

/**
 * Create a standardized success response
 * @param {Object} data - Response data
 * @param {String} message - Success message
 * @param {Number} status - HTTP status code (default: 200)
 * @returns {Object} - Formatted success response
 */
export function apiSuccess(data = {}, message = "Success", status = 200) {
  return {
    success: true,
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized error response
 * @param {String} message - Error message
 * @param {Number} status - HTTP status code (default: 400)
 * @param {Object} details - Additional error details
 * @returns {Object} - Formatted error response
 */
export function apiError(
  message = "An error occurred",
  status = 400,
  details = null
) {
  const errorResponse = {
    success: false,
    status,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add error details if provided
  if (details) {
    errorResponse.details = details;
  }

  return errorResponse;
}

/**
 * Middleware for handling API errors consistently
 * @param {Function} handler - API route handler
 * @returns {Function} - Wrapped handler with error handling
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    const requestId = `req-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    try {
      // Add request ID to response headers for tracking
      res.setHeader("X-Request-ID", requestId);

      // Execute the handler
      return await handler(req, res);
    } catch (error) {
      console.error(`[API Error ${requestId}]`, error);

      // Determine appropriate status code
      let status = 500;
      let message = "Internal server error";

      if (error.name === "ValidationError") {
        status = 400;
        message = "Validation error";
      } else if (error.name === "UnauthorizedError") {
        status = 401;
        message = "Authentication required";
      } else if (error.name === "ForbiddenError") {
        status = 403;
        message = "Access denied";
      } else if (error.name === "NotFoundError") {
        status = 404;
        message = "Resource not found";
      }

      // Format error details
      const errorDetails =
        process.env.NODE_ENV === "development"
          ? { stack: error.stack, name: error.name }
          : undefined;

      // Send standardized error response
      return res
        .status(status)
        .json(apiError(error.message || message, status, errorDetails));
    }
  };
}

/**
 * Custom error classes for specific API error scenarios
 */
export class ValidationError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
