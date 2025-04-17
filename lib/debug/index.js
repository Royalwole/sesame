/**
 * Centralized debugging module for TopDial application
 * Provides controlled debugging capabilities for various parts of the system
 */

import { mongoDebug } from "./mongo";
import { blobDebug } from "./blob";
import { createApiLogger } from "./api";
import { PerformanceMonitor } from "./performance";

// Environment detection - use it to determine active environment
const currentEnvironment = process.env.NODE_ENV || "development";
const isProd = currentEnvironment === "production";

// Debug configuration based on environment
export const debugConfig = {
  development: {
    mongoDebug: true,
    blobDebug: true,
    apiLogging: true,
    performanceMonitoring: true,
    errorVerbosity: "full",
  },
  test: {
    mongoDebug: true,
    blobDebug: false,
    apiLogging: true,
    performanceMonitoring: false,
    errorVerbosity: "partial",
  },
  production: {
    mongoDebug: false,
    blobDebug: false,
    apiLogging: true,
    performanceMonitoring: true,
    errorVerbosity: "minimal",
    // Only enable specific parts in production if debug flags are set
    ...(process.env.DEBUG_MONGO === "true" && { mongoDebug: true }),
    ...(process.env.DEBUG_BLOB === "true" && { blobDebug: true }),
  },
};

// Get current config based on environment
export const currentDebugConfig = debugConfig[currentEnvironment];

// Performance monitoring singleton
export const performanceMonitor = new PerformanceMonitor();

// System monitoring thresholds
export const monitoringThresholds = {
  requestDuration: parseInt(process.env.THRESHOLD_REQUEST_DURATION || "1000"), // ms
  maxPayloadSize: parseInt(process.env.THRESHOLD_MAX_PAYLOAD_SIZE || "1000000"), // bytes
  maxConnections: parseInt(process.env.THRESHOLD_MAX_CONNECTIONS || "100"),
  errorThreshold: parseInt(process.env.THRESHOLD_ERRORS_PER_MINUTE || "10"),
  memoryThreshold: parseFloat(process.env.THRESHOLD_MEMORY_USAGE || "0.8"), // 80% of max heap
};

// Export debugging tools
export { mongoDebug, blobDebug, createApiLogger, PerformanceMonitor };

// Utility for sending alerts
export function alertOnAnomaly(anomaly, severity = "warning") {
  const anomalyData = {
    timestamp: new Date().toISOString(),
    environment: currentEnvironment,
    severity,
    details: anomaly,
  };

  console[severity === "critical" ? "error" : "warn"](
    "Anomaly detected:",
    anomalyData
  );

  // In production, send to monitoring service
  if (isProd) {
    // Integration point for monitoring services like Sentry, LogRocket, etc.
    if (global.Sentry) {
      global.Sentry.captureMessage(`Anomaly: ${JSON.stringify(anomaly)}`, {
        level: severity === "critical" ? "error" : "warning",
      });
    }

    // Could add Slack notification, email alert, etc.
  }

  return anomalyData;
}

// Health check function
export async function systemHealthCheck() {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: "ok",
      services: {
        mongodb: false,
        blobStorage: false,
        api: true,
        memory: true,
      },
      details: {},
    };

    // Check MongoDB if enabled
    if (currentDebugConfig.mongoDebug) {
      try {
        const mongoStatus = await mongoDebug.checkConnection();
        health.services.mongodb = mongoStatus.isConnected;
        health.details.mongodb = mongoStatus;
      } catch (err) {
        health.services.mongodb = false;
        health.details.mongodb = { error: err.message };
      }
    }

    // Check Blob Storage if enabled
    if (currentDebugConfig.blobDebug) {
      try {
        const blobStatus = await blobDebug.checkConnection();
        health.services.blobStorage = blobStatus.isConnected;
        health.details.blobStorage = blobStatus;
      } catch (err) {
        health.services.blobStorage = false;
        health.details.blobStorage = { error: err.message };
      }
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    health.services.memory =
      heapUsagePercent < monitoringThresholds.memoryThreshold;
    health.details.memory = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      heapUsagePercent: heapUsagePercent,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
    };

    // Determine overall status
    const failedServices = Object.entries(health.services)
      .filter(([_, status]) => status === false)
      .map(([service]) => service);

    if (failedServices.length > 0) {
      health.status = "degraded";
      health.details.failedServices = failedServices;
    }

    return health;
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
