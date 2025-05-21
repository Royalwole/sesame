import { connectDB, disconnectDB } from "./db";
import mongoose from "mongoose";

/**
 * Create necessary database indexes to optimize queries
 */
export async function createIndexes() {
  try {
    console.log("[DB-Utils] Creating or verifying indexes...");

    // Create indexes for Listing model if it exists
    if (mongoose.models.Listing) {
      console.log("[DB-Utils] Creating indexes for Listing model");

      // Create critical indexes in the background
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

    // Create indexes for User model if it exists
    if (mongoose.models.User) {
      console.log("[DB-Utils] Creating indexes for User model");

      // Index for lookups by Clerk ID
      await mongoose.models.User.collection.createIndex(
        { clerkId: 1 },
        { unique: true, background: true }
      );
    }

    console.log("[DB-Utils] Indexes created or verified successfully");
  } catch (error) {
    console.warn("[DB-Utils] Error creating indexes:", error.message);
    // Non-fatal error - continue without indexes if needed
  }
}

/**
 * Connect to database with retry logic (uses existing connectDB)
 */
export async function connectWithRetry(options = {}) {
  const { maxRetries = 3 } = options;
  let attempts = 0;
  let lastError = null;

  while (attempts <= maxRetries) {
    try {
      // Use the existing connectDB function
      const result = await connectDB();

      // If requested, create indexes
      if (options.createIndexes) {
        await createIndexes();
      }

      return result;
    } catch (error) {
      lastError = error;
      attempts++;

      console.warn(
        `[DB-Utils] Connection attempt ${attempts}/${maxRetries + 1} failed: ${error.message}`
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
 * Re-export the disconnectDB function for convenience
 */
export { disconnectDB };
