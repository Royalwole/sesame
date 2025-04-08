import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./db";

/**
 * Utility to help recover listing data when normal channels fail
 */
export async function recoverListingData(id, options = {}) {
  const { useDirectDb = false, tryAlternateIds = false } = options;
  let dbConnection = false;

  try {
    console.log(
      `[ListingRecovery] Attempting to recover listing data for ID "${id}"`
    );

    // Connect to database directly if needed
    if (useDirectDb) {
      await connectDB();
      dbConnection = true;
    }

    // Try multiple approaches to find the listing
    const results = {
      apiAttempt: null,
      directDbAttempt: null,
      alternateIdAttempts: [],
      success: false,
      listing: null,
      error: null,
    };

    // Approach 1: Try the standard API
    try {
      console.log("[ListingRecovery] Attempting API recovery");
      const response = await fetch(`/api/listings/${id}?recovery=true`);
      const data = await response.json();

      results.apiAttempt = {
        success: response.ok,
        status: response.status,
        data,
      };

      if (response.ok && data.listing) {
        results.success = true;
        results.listing = data.listing;
        return results;
      }
    } catch (apiError) {
      console.error("[ListingRecovery] API recovery failed:", apiError);
      results.apiAttempt = { error: apiError.message };
    }

    // Approach 2: Try direct DB access if enabled
    if (useDirectDb && dbConnection) {
      try {
        console.log("[ListingRecovery] Attempting direct DB recovery");

        // Dynamically import Mongoose model to avoid SSR issues
        const Listing =
          mongoose.models.Listing ||
          (await import("../models/Listing")).default;

        // Try both string ID and ObjectId approaches
        const objectId = new mongoose.Types.ObjectId(id);
        const listing = await Listing.findOne({ _id: objectId }).lean();

        results.directDbAttempt = {
          success: !!listing,
          listing: listing ? { ...listing, _id: listing._id.toString() } : null,
        };

        if (listing) {
          results.success = true;
          results.listing = { ...listing, _id: listing._id.toString() };
          return results;
        }
      } catch (dbError) {
        console.error("[ListingRecovery] Direct DB recovery failed:", dbError);
        results.directDbAttempt = { error: dbError.message };
      }
    }

    // Approach 3: Try similar/alternate IDs if enabled
    if (tryAlternateIds) {
      console.log("[ListingRecovery] Attempting alternate ID recovery");

      // Create slightly modified IDs to try (for ObjectId corruption cases)
      const alternateIds = [];

      // No alternates implemented yet, but could add strategies here
      // e.g., check for common character substitutions, try IDs from recent history, etc.

      for (const altId of alternateIds) {
        try {
          const response = await fetch(`/api/listings/${altId}?recovery=true`);
          const data = await response.json();

          results.alternateIdAttempts.push({
            id: altId,
            success: response.ok,
            status: response.status,
            data: response.ok ? data : null,
          });

          if (response.ok && data.listing) {
            results.success = true;
            results.listing = data.listing;
            return results;
          }
        } catch (error) {
          results.alternateIdAttempts.push({
            id: altId,
            error: error.message,
          });
        }
      }
    }

    // If we got here, all recovery attempts failed
    results.error = "All recovery attempts failed";
    return results;
  } catch (error) {
    console.error("[ListingRecovery] Recovery process failed:", error);
    return {
      success: false,
      error: error.message,
      listing: null,
    };
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
