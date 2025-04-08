/**
 * Centralized error handling for the application
 */

// Constants
export const ERROR_TYPES = {
  API_ERROR: "API_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * Custom application error with additional context
 */
export class AppError extends Error {
  constructor(
    message,
    type = ERROR_TYPES.UNKNOWN_ERROR,
    statusCode = 500,
    details = {}
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error, req, res) {
  console.error(`[API Error] ${error.message}`, {
    path: req.url,
    method: req.method,
    ...(error instanceof AppError ? error.details : {}),
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  // Determine if this is a known error type
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      type: error.type,
      ...(process.env.NODE_ENV === "development"
        ? { details: error.details }
        : {}),
    });
  }

  // Handle common errors
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      type: ERROR_TYPES.VALIDATION_ERROR,
      details:
        process.env.NODE_ENV === "development" ? error.errors : undefined,
    });
  }

  if (error.name === "MongoError" && error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate entry",
      type: ERROR_TYPES.VALIDATION_ERROR,
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: "Server error",
    type: ERROR_TYPES.UNKNOWN_ERROR,
    ...(process.env.NODE_ENV === "development"
      ? { message: error.message }
      : {}),
  });
}

/**
 * Client-side error handler for fetch requests
 */
export async function handleFetchError(response) {
  if (!response.ok) {
    let errorData;

    try {
      errorData = await response.json();
    } catch (e) {
      throw new AppError(
        `HTTP error ${response.status}`,
        ERROR_TYPES.API_ERROR,
        response.status
      );
    }

    throw new AppError(
      errorData.error || `HTTP error ${response.status}`,
      errorData.type || ERROR_TYPES.API_ERROR,
      response.status,
      errorData.details
    );
  }

  return response;
}
