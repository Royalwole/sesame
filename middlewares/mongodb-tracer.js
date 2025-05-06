import mongoose from "mongoose";
import { logClientError } from "../lib/monitoring";

let slowQueryThreshold = 1000; // 1 second
let isMonitoringEnabled = true;

export function setupMongoDBMonitoring() {
  // Skip mongoose operations in Edge Runtime
  if (typeof window !== "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  mongoose.connection.on("connecting", () => {
    console.log("🔄 Connecting to MongoDB...");
  });

  mongoose.connection.on("connected", () => {
    console.log("✅ Connected to MongoDB");
  });

  mongoose.connection.on("disconnecting", () => {
    console.log("⚠️ Disconnecting from MongoDB...");
  });

  mongoose.connection.on("disconnected", () => {
    console.log("❌ Disconnected from MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
    logClientError(err, { source: "MongoDB connection" });

    // Log specific error details for common issues
    if (err.name === "MongoServerSelectionError") {
      console.error("Unable to connect to MongoDB server. Possible causes:");
      console.error("1. MongoDB server is not running");
      console.error("2. Network connectivity issues");
      console.error("3. IP address not whitelisted in MongoDB Atlas");
      console.error("4. Invalid connection string");
    }

    if (err.name === "MongoNetworkError") {
      console.error("Network error connecting to MongoDB. Possible causes:");
      console.error("1. No internet connection");
      console.error("2. MongoDB server is unreachable");
      console.error("3. Firewall blocking connection");
    }
  });
}

export function setSlowQueryThreshold(ms) {
  slowQueryThreshold = ms;
}

export function enableMonitoring(enable = true) {
  isMonitoringEnabled = enable;
}

// Only setup monitoring if not in Edge Runtime
if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
  setupMongoDBMonitoring();
}
