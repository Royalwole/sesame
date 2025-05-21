import { connectDB, disconnectDB } from './db';
import mongoose from "mongoose";

/**
 * Enhanced database connection with retry logic
 */
export async function connectDBWithRetry(options = {}) {
  const { maxRetries = 3 } = options;
  let attempts = 0;
  let lastError = null;
  
  while (attempts <= maxRetries) {
    try {
      // Use the existing connectDB function
      await connectDB();
      
      // If requested, create indexes
      if (options.createIndexes) {
        await createDBIndexes();
      }
      
      console.log('[DB-Enhanced] Connected to database successfully');
      return true;
    } catch (error) {
      lastError = error;
      attempts++;
      
      console.warn(`[DB-Enhanced] Connection attempt ${attempts}/${maxRetries + 1} failed: ${error.message}`);
      
      if (attempts <= maxRetries) {
        // Wait before retrying with exponential backoff
        const delay = Math.min(500 * Math.pow(2, attempts - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to connect to database after ${maxRetries + 1} attempts: ${lastError?.message}`);
}

/**
 * Create database indexes for better performance
 */
export async function createDBIndexes() {
  try {
    console.log('[DB-Enhanced] Creating or verifying indexes...');
    
    // Create indexes for Listing model if it exists
    if (mongoose.models.Listing) {
      console.log('[DB-Enhanced] Creating indexes for Listing model');
      
      // Create indexes in the background
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
      console.log('[DB-Enhanced] Creating indexes for User model');
      
      await mongoose.models.User.collection.createIndex(
        { clerkId: 1 }, 
        { unique: true, background: true }
      );
    }
    
    console.log('[DB-Enhanced] Indexes created successfully');
  } catch (error) {
    console.warn('[DB-Enhanced] Error creating indexes:', error.message);
    // Non-fatal error - continue without indexes if needed
  }
}

// Re-export the original functions for convenience
export { connectDB, disconnectDB };
