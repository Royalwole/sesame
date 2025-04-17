/**
 * Performance monitoring utilities
 */

import { alertOnAnomaly } from "./index";

// Basic performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.history = [];
    this.historyMaxSize = 1000;

    // Setup periodic memory check
    if (typeof process !== "undefined") {
      this.startMemoryMonitoring();
    }
  }

  // Start tracking an operation
  startTimer(operationId, metadata = {}) {
    const operationKey = `${operationId}_${Date.now()}`;

    this.metrics.set(operationKey, {
      id: operationId,
      key: operationKey,
      start: process.hrtime(),
      startMemory: process.memoryUsage(),
      metadata,
      startTime: Date.now(),
    });

    return operationKey;
  }

  // End tracking an operation
  endTimer(operationKey) {
    const start = this.metrics.get(operationKey);
    if (!start) return null;

    // Clean up the map
    this.metrics.delete(operationKey);

    // Calculate elapsed time
    const elapsed = process.hrtime(start.start);
    const duration = elapsed[0] * 1000 + elapsed[1] / 1000000;

    // Calculate memory usage delta
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: endMemory.heapUsed - start.startMemory.heapUsed,
      external: endMemory.external - start.startMemory.external,
      rss: endMemory.rss - start.startMemory.rss,
    };

    // Create metric result
    const result = {
      id: start.id,
      duration,
      memoryDelta,
      metadata: start.metadata,
      timestamp: new Date().toISOString(),
      startTime: start.startTime,
      endTime: Date.now(),
    };

    // Add to history
    this.history.push(result);
    if (this.history.length > this.historyMaxSize) {
      this.history.shift();
    }

    // Alert for slow operations
    if (duration > 1000 && process.env.NODE_ENV === "production") {
      alertOnAnomaly({
        type: "slowOperation",
        operation: start.id,
        duration,
        metadata: start.metadata,
        message: `Slow operation: ${start.id} took ${duration.toFixed(2)}ms`,
      });
    }

    return result;
  }

  // Track memory usage
  startMemoryMonitoring(interval = 60000) {
    if (this._memoryInterval) {
      clearInterval(this._memoryInterval);
    }

    this._memoryInterval = setInterval(() => {
      try {
        const memory = process.memoryUsage();
        const heapUsagePercent = memory.heapUsed / memory.heapTotal;

        const memInfo = {
          timestamp: new Date().toISOString(),
          heapUsed: memory.heapUsed,
          heapTotal: memory.heapTotal,
          heapUsagePercent,
          external: memory.external,
          rss: memory.rss,
        };

        // Add to history
        this.history.push({
          id: "memory-check",
          memoryInfo: memInfo,
          timestamp: memInfo.timestamp,
        });

        // Check for high memory usage
        if (heapUsagePercent > 0.8) {
          alertOnAnomaly(
            {
              type: "highMemoryUsage",
              heapUsed: memory.heapUsed,
              heapTotal: memory.heapTotal,
              usagePercent: heapUsagePercent,
              message: `High memory usage: ${(heapUsagePercent * 100).toFixed(1)}% of heap used`,
            },
            heapUsagePercent > 0.9 ? "critical" : "warning"
          );
        }
      } catch (err) {
        console.error("Error in memory monitoring:", err);
      }
    }, interval);
  }

  // Stop memory monitoring
  stopMemoryMonitoring() {
    if (this._memoryInterval) {
      clearInterval(this._memoryInterval);
      this._memoryInterval = null;
    }
  }

  // Get performance metrics
  getMetrics() {
    return {
      activeOperations: Array.from(this.metrics.entries()).map(
        ([key, data]) => ({
          id: data.id,
          key,
          startTime: new Date(data.startTime).toISOString(),
          elapsedMs: Date.now() - data.startTime,
        })
      ),
      recentOperations: this.history
        .filter((op) => op.id !== "memory-check")
        .slice(-20),
      memoryUsage: process.memoryUsage(),
    };
  }
}

// Performance middleware
export const performanceMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    if (duration > 1000) {
      // Log slow requests (>1s)
      console.warn(
        `Slow request: ${req.method} ${req.path} took ${duration}ms`
      );
    }
  });

  next();
};
