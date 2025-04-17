/**
 * Error handling utilities
 */

import { currentDebugConfig, alertOnAnomaly } from "./index";

// Error pattern analysis
class ErrorPatternAnalyzer {
  constructor() {
    this.errorLog = [];
    this.errorLogMaxSize = 100;
    this.errorCounts = {};

    // Reset error counts periodically
    this._resetInterval = setInterval(
      () => {
        this.errorCounts = {};
      },
      5 * 60 * 1000
    ); // 5 minutes
  }

  // Track an error
  logError(error, context = {}) {
    // Create error entry
    const errorEntry = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      code: error.code || error.name,
      context,
    };

    // Add to log
    this.errorLog.push(errorEntry);
    if (this.errorLog.length > this.errorLogMaxSize) {
      this.errorLog.shift();
    }

    // Update error counts for spike detection
    const errorKey = error.code || error.name || "unknown";
    this.errorCounts[errorKey] = (this.errorCounts[errorKey] || 0) + 1;

    // Check for error spikes
    this.checkForSpikes();

    return errorEntry;
  }

  // Check for spikes in error frequency
  checkForSpikes() {
    Object.entries(this.errorCounts).forEach(([code, count]) => {
      if (count >= 10) {
        alertOnAnomaly(
          {
            type: "errorSpike",
            errorCode: code,
            count,
            message: `Error spike detected: ${code} occurred ${count} times in 5 minutes`,
          },
          "critical"
        );

        // Reset the counter once alerted to prevent duplicate alerts
        this.errorCounts[code] = 0;
      }
    });
  }

  // Get recent errors
  getRecentErrors() {
    return [...this.errorLog];
  }

  // Clean up
  destroy() {
    if (this._resetInterval) {
      clearInterval(this._resetInterval);
    }
  }
}

// Create analyzer singleton
export const errorAnalyzer = new ErrorPatternAnalyzer();

// Centralized error handler
export const errorHandler = (error, req, res) => {
  // Log the error
  errorAnalyzer.logError(error, {
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  // Log error to console
  console.error("Error details:", {
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  // Determine verbosity level
  const errorVerbosity = currentDebugConfig.errorVerbosity || "minimal";

  // Prepare response based on verbosity
  let responseBody = {
    error: "Internal server error",
  };

  if (errorVerbosity === "full" || process.env.NODE_ENV === "development") {
    responseBody = {
      error: error.message,
      stack: error.stack,
      code: error.code,
      type: error.name,
      path: req.path,
      requestId: req.requestId,
    };
  } else if (errorVerbosity === "partial") {
    responseBody = {
      error: error.message,
      code: error.code,
      requestId: req.requestId,
    };
  }

  // Send response
  res.status(error.status || 500).json(responseBody);
};
