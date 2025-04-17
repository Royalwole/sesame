/**
 * API debugging utilities
 */

import { alertOnAnomaly } from "./index";

// Store recent API requests/responses
const requestLog = [];
const REQUEST_LOG_MAX_SIZE = 100;

// Middleware for API request logging
export const createApiLogger = (options = {}) => {
  const {
    logBody = true,
    logHeaders = true,
    logParams = true,
    sensitiveFields = ["password", "token", "secret", "authorization"],
    sensitiveHeaders = ["authorization", "cookie"],
    maxBodyLength = 10000,
  } = options;

  return (req, res, next) => {
    // Generate request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    req.requestId = requestId;

    // Add request ID to response headers
    res.setHeader("X-Request-ID", requestId);

    // Capture request start time
    const start = process.hrtime();

    // Prepare request data
    const requestData = {
      id: requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.url,
      query: logParams ? sanitizeObject(req.query, sensitiveFields) : undefined,
      headers: logHeaders
        ? sanitizeObject(req.headers, sensitiveHeaders)
        : undefined,
      body: logBody
        ? truncateAndSanitize(req.body, sensitiveFields, maxBodyLength)
        : undefined,
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    };

    // Log request start
    console.log(`--> [${requestId}] ${req.method} ${req.url}`);

    // Capture response data
    const chunks = [];
    const originalWrite = res.write;
    const originalEnd = res.end;

    // Override write to capture response body
    res.write = function (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return originalWrite.apply(res, arguments);
    };

    // Override end to finalize and log response
    res.end = function (chunk) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      // Call original end method
      originalEnd.apply(res, arguments);

      // Calculate duration
      const durationHr = process.hrtime(start);
      const durationMs = (
        durationHr[0] * 1000 +
        durationHr[1] / 1000000
      ).toFixed(2);

      // Get response body if JSON
      let responseBody;
      try {
        if (
          res.getHeader("content-type") &&
          res.getHeader("content-type").includes("application/json")
        ) {
          const buffer = Buffer.concat(chunks);
          responseBody =
            buffer.length > 0 ? JSON.parse(buffer.toString()) : null;
        }
      } catch (e) {
        // Ignore parsing errors
      }

      // Prepare response data
      const responseData = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.getHeaders ? res.getHeaders() : {},
        body: responseBody
          ? truncateAndSanitize(responseBody, sensitiveFields, maxBodyLength)
          : undefined,
        size: chunks.reduce((acc, chunk) => acc + chunk.length, 0),
        duration: durationMs,
      };

      // Add to request log
      const logEntry = {
        ...requestData,
        response: responseData,
      };

      requestLog.push(logEntry);
      if (requestLog.length > REQUEST_LOG_MAX_SIZE) {
        requestLog.shift();
      }

      // Log response summary
      console.log(
        `<-- [${requestId}] ${req.method} ${req.url} ${res.statusCode} ${durationMs}ms`
      );

      // Alert for slow requests or errors
      if (parseInt(durationMs) > 1000) {
        alertOnAnomaly({
          type: "slowRequest",
          requestId,
          method: req.method,
          path: req.url,
          duration: durationMs,
          message: `Slow API request: ${req.method} ${req.url} took ${durationMs}ms`,
        });
      }

      if (res.statusCode >= 500) {
        alertOnAnomaly(
          {
            type: "serverError",
            requestId,
            statusCode: res.statusCode,
            method: req.method,
            path: req.url,
            message: `API server error: ${res.statusCode} on ${req.method} ${req.url}`,
          },
          "critical"
        );
      }
    };

    // Continue to next middleware
    if (next) next();
  };
};

// API anomaly detection middleware
export const apiAnomalyDetector = (req, res, next) => {
  // Track request patterns
  const requestPattern = {
    method: req.method,
    path: req.path,
    queryParams: Object.keys(req.query).length,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    timestamp: Date.now(),
  };

  // Check for unusual patterns
  const anomalies = [];

  // Large payload detection
  if (requestPattern.bodySize > 1000000) {
    // 1MB
    anomalies.push("Large request payload detected");
  }

  // Unusual number of query parameters
  if (requestPattern.queryParams > 20) {
    anomalies.push("Excessive query parameters");
  }

  // Log anomalies if found
  if (anomalies.length > 0) {
    alertOnAnomaly({
      type: "apiAnomaly",
      pattern: requestPattern,
      anomalies,
      message: `API anomalies detected: ${anomalies.join(", ")}`,
    });
  }

  if (next) next();
};

// Track recent requests
export const getRequestLog = () => requestLog;

// Helper to sanitize sensitive data
function sanitizeObject(obj, sensitiveFields) {
  if (!obj) return obj;

  const result = { ...obj };
  sensitiveFields.forEach((field) => {
    if (field in result) {
      result[field] = "[REDACTED]";
    }
  });

  return result;
}

// Helper to truncate large objects and sanitize
function truncateAndSanitize(data, sensitiveFields, maxLength) {
  if (!data) return data;

  // Convert to string to measure length
  const str = typeof data === "string" ? data : JSON.stringify(data);

  // Truncate if too long
  const truncated =
    str.length > maxLength
      ? str.substring(0, maxLength) + "... [truncated]"
      : str;

  // Convert back to object if it was an object
  if (typeof data !== "string") {
    try {
      // Parse the possibly truncated JSON and sanitize
      const parsed = typeof data === "object" ? data : JSON.parse(truncated);
      return sanitizeObject(parsed, sensitiveFields);
    } catch (_) {
      // Ignore parsing error, just return truncated string
      return truncated;
    }
  }

  return truncated;
}
