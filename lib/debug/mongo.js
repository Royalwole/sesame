/**
 * MongoDB debugging utilities
 */

import mongoose from "mongoose";
import { alertOnAnomaly } from "./index";

class MongoDebugger {
  constructor() {
    this.isDebugEnabled = false;
    this.connectionPool = new Map();
    this.queryLog = [];
    this.queryLogMaxSize = 100;
  }

  // Enable debugging
  enableDebug() {
    this.isDebugEnabled = true;

    if (mongoose.connection) {
      // Enable query logging
      mongoose.set("debug", true);

      // Monitor connection events
      mongoose.connection.on("connected", () => this.logEvent("connected"));
      mongoose.connection.on("disconnected", () =>
        this.logEvent("disconnected")
      );
      mongoose.connection.on("error", (err) => this.logEvent("error", err));

      console.log("MongoDB debugging enabled");
    } else {
      console.warn("MongoDB connection not available for debugging");
    }

    return this;
  }

  // Disable debugging
  disableDebug() {
    this.isDebugEnabled = false;
    mongoose.set("debug", false);
    return this;
  }

  // Check connection status
  async checkConnection() {
    const connectionState = mongoose.connection.readyState;

    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const result = {
      isConnected: connectionState === 1,
      state: stateMap[connectionState] || "unknown",
      timeChecked: new Date().toISOString(),
    };

    if (this.isDebugEnabled) {
      console.log("MongoDB connection state:", result);
    }

    return result;
  }

  // Get database statistics
  async getDbStats() {
    if (connectionState !== 1) {
      throw new Error("Cannot get stats: MongoDB not connected");
    }

    try {
      const stats = await mongoose.connection.db.stats();
      if (this.isDebugEnabled) {
        console.log("MongoDB stats:", stats);
      }
      return stats;
    } catch (error) {
      console.error("Failed to get MongoDB stats:", error);
      throw error;
    }
  }

  // Get collection statistics
  async getCollectionStats(modelNameOrModel) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Cannot get stats: MongoDB not connected");
    }

    try {
      let model;
      if (typeof modelNameOrModel === "string") {
        model = mongoose.models[modelNameOrModel];
        if (!model) {
          throw new Error(`Model "${modelNameOrModel}" not found`);
        }
      } else {
        model = modelNameOrModel;
      }

      const stats = await model.collection.stats();

      if (this.isDebugEnabled) {
        console.log(`Collection ${model.collection.name} stats:`, stats);
      }

      return stats;
    } catch (error) {
      console.error("Failed to get collection stats:", error);
      throw error;
    }
  }

  // Log connection events
  logEvent(event, data) {
    if (!this.isDebugEnabled) return;

    const timestamp = new Date();
    console.log(`MongoDB ${event} at ${timestamp.toISOString()}`);

    if (data) {
      console.log("Event data:", data);
    }

    // Track connection changes
    if (event === "connected") {
      this.trackConnectionPool("add");
    } else if (event === "disconnected") {
      this.trackConnectionPool("remove");
    }
  }

  // Track connection pool usage
  trackConnectionPool(action) {
    // Generate a unique ID for the connection
    const connectionId = Date.now().toString();

    if (action === "add") {
      this.connectionPool.set(connectionId, {
        startTime: Date.now(),
        active: true,
      });

      // Check if pool is nearing capacity
      if (this.connectionPool.size > 80) {
        // Assuming 100 is max
        alertOnAnomaly({
          type: "connectionPool",
          message: `Connection pool nearing capacity: ${this.connectionPool.size}/100`,
          severity: "warning",
        });
      }
    } else if (action === "remove") {
      // Find an active connection and mark as inactive
      for (const [connKey, conn] of this.connectionPool.entries()) {
        if (conn.active) {
          conn.active = false;
          conn.endTime = Date.now();
          break;
        }
      }
    }
  }

  // Track query execution
  trackQuery(query, collection, duration) {
    if (!this.isDebugEnabled) return;

    this.queryLog.push({
      timestamp: new Date(),
      collection,
      query,
      duration,
    });

    // Maintain log size limit
    if (this.queryLog.length > this.queryLogMaxSize) {
      this.queryLog.shift();
    }

    // Detect slow queries
    if (duration > 1000) {
      alertOnAnomaly({
        type: "slowQuery",
        collection,
        query: JSON.stringify(query),
        duration,
        message: `Slow query detected: ${duration}ms`,
      });
    }
  }

  // Check for data consistency issues
  async checkDataConsistency(model, rules) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Cannot check consistency: MongoDB not connected");
    }

    try {
      const anomalies = [];
      const documents = await model.find({}).lean();

      // Process each document
      for (const doc of documents) {
        // Default rules
        if (!rules) {
          // Check for null fields that shouldn't be null
          Object.entries(doc).forEach(([key, value]) => {
            if (
              value === null &&
              model.schema &&
              model.schema.paths[key] &&
              model.schema.paths[key].isRequired
            ) {
              anomalies.push({
                documentId: doc._id,
                field: key,
                issue: "Null value in required field",
              });
            }
          });

          // Check date consistency
          if (doc.createdAt && doc.updatedAt && doc.createdAt > doc.updatedAt) {
            anomalies.push({
              documentId: doc._id,
              issue: "createdAt date is after updatedAt date",
            });
          }
        }
        // Custom rules
        else if (typeof rules === "function") {
          const issuesFound = rules(doc);
          if (issuesFound && issuesFound.length > 0) {
            anomalies.push(
              ...issuesFound.map((issue) => ({
                documentId: doc._id,
                ...issue,
              }))
            );
          }
        }
      }

      return anomalies;
    } catch (error) {
      console.error("Data consistency check failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const mongoDebug = new MongoDebugger();

// Debug MongoDB connections
export const debugMongo = async (modelOrCollection) => {
  try {
    // Check connection status
    const connectionState = mongoose.connection.readyState;
    console.log(
      "MongoDB connection state:",
      {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      }[connectionState]
    );

    // Enable query logging
    mongoose.set("debug", true);

    // Check collection statistics if model provided
    if (modelOrCollection) {
      const stats = await modelOrCollection.collection.stats();
      console.log("Collection stats:", stats);
    }

    return {
      connectionState,
      serverInfo:
        mongoose.connection.db &&
        (await mongoose.connection.db.admin().serverInfo()),
      databaseName: mongoose.connection.name,
    };
  } catch (error) {
    console.error("MongoDB debug error:", error);
    return { error: error.message };
  }
};
