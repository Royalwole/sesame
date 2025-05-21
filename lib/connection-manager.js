import { connectDB, disconnectDB } from "./db";
import mongoose from "mongoose";

/**
 * Database connection manager with enhanced functionality
 */
class ConnectionManager {
  /**
   * Connect to database with retry logic
   */
  static async connect(options = {}) {
    const { maxRetries = 3 } = options;
    let attempts = 0;
    let lastError = null;

    while (attempts <= maxRetries) {
      try {
        // Use the existing connectDB function
        await connectDB();

        // If requested, create indexes
        if (options.createIndexes) {
          await this.createIndexes();
        }

        return true;
      } catch (error) {
        lastError = error;
        attempts++;

        console.warn(
          `[DB-Manager] Connection attempt ${attempts}/${maxRetries + 1} failed: ${error.message}`
        );

        if (attempts <= maxRetries) {
          // Wait before retrying with exponential backoff
          const delay = Math.min(500 * Math.pow(2, attempts - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to connect to database after ${maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Create database indexes for better performance
   */
  static async createIndexes() {
    try {
      console.log("[DB-Manager] Creating or verifying indexes...");

      // Create indexes for Listing model
      if (mongoose.models.Listing) {
        await mongoose.models.Listing.collection.createIndex(
          { status: 1, createdAt: -1 },
          { background: true }
        );

        await mongoose.models.Listing.collection.createIndex(
          { agentId: 1 },
          { background: true }
        );

        await mongoose.models.Listing.collection.createIndex(
          { createdAt: -1 },
          { background: true }
        );
      }

      // Create indexes for User model
      if (mongoose.models.User) {
        await mongoose.models.User.collection.createIndex(
          { clerkId: 1 },
          { unique: true, background: true }
        );
      }
    } catch (error) {
      console.warn("[DB-Manager] Error creating indexes:", error.message);
    }
  }

  /**
   * Safely disconnect from database
   */
  static async disconnect() {
    return disconnectDB();
  }
}

export default ConnectionManager;
