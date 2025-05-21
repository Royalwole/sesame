import mongoose from "mongoose";
import { connectDB, disconnectDB } from "./db";
import { logListingEvent } from "./error-logger";

/**
 * Utility to help recover listing data when normal channels fail
 */
export async function recoverListingData(id, options = {}) {
  const { useDirectDb = false, tryAlternateIds = false } = options;
  let dbConnection = false;
  const recoveryId = `recovery-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  try {
    logListingEvent({
      type: "RECOVERY_ATTEMPT",
      id,
      metadata: { options, recoveryId },
    });

    // Connect to database directly if needed
    if (useDirectDb) {
      await connectDB();
      dbConnection = true;
    }

    // Try multiple approaches to find the listing
    const results = {
      recoveryId,
      timestamp: new Date(),
      apiAttempt: null,
      directDbAttempt: null,
      alternateIdAttempts: [],
      recentlyDeletedCheck: null,
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
        logListingEvent({
          type: "RECOVERY_SUCCESS",
          id,
          metadata: { method: "api", recoveryId },
        });
        return results;
      }
    } catch (apiError) {
      console.error("[ListingRecovery] API recovery failed:", apiError);
      results.apiAttempt = { error: apiError.message };
      logListingEvent({
        type: "RECOVERY_FAILURE",
        id,
        metadata: { method: "api", error: apiError.message, recoveryId },
      });
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
          logListingEvent({
            type: "RECOVERY_SUCCESS",
            id,
            metadata: { method: "direct_db", recoveryId },
          });
          return results;
        }
      } catch (dbError) {
        console.error("[ListingRecovery] Direct DB recovery failed:", dbError);
        results.directDbAttempt = { error: dbError.message };
        logListingEvent({
          type: "RECOVERY_FAILURE",
          id,
          metadata: { method: "direct_db", error: dbError.message, recoveryId },
        });
      }
    }

    // NEW: Approach 3: Check for recently deleted listings
    try {
      console.log("[ListingRecovery] Checking recently deleted listings");

      // Dynamically import models
      const Listing =
        mongoose.models.Listing || (await import("../models/Listing")).default;

      // Look for soft-deleted listings (if your schema supports it)
      const deletedListing = await Listing.findOne({
        _id: new mongoose.Types.ObjectId(id),
        deleted: true,
      }).lean();

      // Check the deletion log collection (if it exists)
      let deletionLog = null;
      try {
        // If you have a deletion log collection
        if (
          mongoose.models.ListingDeletionLog ||
          mongoose.connection.collections["listingdeletionlogs"]
        ) {
          const ListingDeletionLog =
            mongoose.models.ListingDeletionLog ||
            mongoose.model(
              "ListingDeletionLog",
              new mongoose.Schema({
                listingId: String,
                originalData: Object,
                deletedAt: Date,
                deletedBy: String,
                reason: String,
              })
            );

          deletionLog = await ListingDeletionLog.findOne({
            listingId: id,
          }).lean();
        }
      } catch (logErr) {
        console.error(
          "[ListingRecovery] Error checking deletion logs:",
          logErr
        );
      }

      results.recentlyDeletedCheck = {
        wasDeleted: !!deletedListing || !!deletionLog,
        softDeleteFound: !!deletedListing,
        deletionLogFound: !!deletionLog,
        deletionInfo: deletionLog
          ? {
              deletedAt: deletionLog.deletedAt,
              reason: deletionLog.reason,
            }
          : null,
        recoverable:
          !!deletedListing || (deletionLog && !!deletionLog.originalData),
      };

      // If we found a soft-deleted listing, we could potentially recover it
      if (deletedListing) {
        console.log(`[ListingRecovery] Found soft-deleted listing (ID: ${id})`);
        results.listing = {
          ...deletedListing,
          _id: deletedListing._id.toString(),
          wasDeleted: true,
          recoverable: true,
        };
        results.success = true;
        logListingEvent({
          type: "RECOVERY_SUCCESS",
          id,
          metadata: {
            method: "soft_delete_check",
            wasDeleted: true,
            recoveryId,
          },
        });
        return results;
      }

      // If we have the original data in the deletion log
      if (deletionLog && deletionLog.originalData) {
        console.log(
          `[ListingRecovery] Found listing in deletion logs (ID: ${id})`
        );
        results.listing = {
          ...deletionLog.originalData,
          _id: id,
          wasDeleted: true,
          deletedAt: deletionLog.deletedAt,
          recoverable: true,
        };
        results.success = true;
        logListingEvent({
          type: "RECOVERY_SUCCESS",
          id,
          metadata: {
            method: "deletion_log",
            deletedAt: deletionLog.deletedAt,
            recoveryId,
          },
        });
        return results;
      }
    } catch (deletionErr) {
      console.error(
        "[ListingRecovery] Error checking deleted listings:",
        deletionErr
      );
      logListingEvent({
        type: "RECOVERY_FAILURE",
        id,
        metadata: {
          method: "deleted_check",
          error: deletionErr.message,
          recoveryId,
        },
      });
    }

    // Approach 4: Try similar/alternate IDs if enabled
    if (tryAlternateIds) {
      console.log("[ListingRecovery] Attempting alternate ID recovery");

      // Create slightly modified IDs to try (for ObjectId corruption cases)
      const alternateIds = [];

      // Check for common ObjectId typos or data corruption patterns
      if (id.length === 24) {
        // Swap adjacent characters (common typo)
        for (let i = 0; i < id.length - 1; i += 2) {
          const altId =
            id.substring(0, i) +
            id.charAt(i + 1) +
            id.charAt(i) +
            id.substring(i + 2);
          if (/^[0-9a-fA-F]{24}$/.test(altId)) {
            alternateIds.push(altId);
          }
        }

        // Check last few listings created (might be a similar time)
        try {
          const Listing =
            mongoose.models.Listing ||
            (await import("../models/Listing")).default;
          const recentListings = await Listing.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("_id")
            .lean();

          recentListings.forEach((recent) => {
            if (recent._id.toString() !== id) {
              alternateIds.push(recent._id.toString());
            }
          });
        } catch (err) {
          console.error(
            "[ListingRecovery] Error fetching recent listings:",
            err
          );
        }
      }

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
            results.listing.possibleMistyped = true;
            results.listing.originalRequestedId = id;
            logListingEvent({
              type: "RECOVERY_SUCCESS",
              id,
              metadata: {
                method: "alternate_id",
                foundId: altId,
                recoveryId,
              },
            });
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
    logListingEvent({
      type: "RECOVERY_COMPLETE_FAILURE",
      id,
      metadata: { recoveryId },
    });
    return results;
  } catch (error) {
    console.error("[ListingRecovery] Recovery process failed:", error);
    logListingEvent({
      type: "RECOVERY_ERROR",
      id,
      metadata: { error: error.message, recoveryId },
    });
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

/**
 * Attempts to restore a previously deleted listing
 */
export async function restoreDeletedListing(id, userId) {
  try {
    await connectDB();

    // Dynamically import models
    const Listing =
      mongoose.models.Listing || (await import("../models/Listing")).default;

    // Check for soft-deleted listing first
    const softDeletedListing = await Listing.findOne({
      _id: new mongoose.Types.ObjectId(id),
      deleted: true,
    });

    if (softDeletedListing) {
      // Restore the soft-deleted listing by updating the deleted flag
      await Listing.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { deleted: false, restoredAt: new Date(), restoredBy: userId } }
      );

      logListingEvent({
        type: "LISTING_RESTORED",
        id,
        userId,
        metadata: { method: "soft_delete" },
      });

      return {
        success: true,
        listing: softDeletedListing,
        message: "Listing has been restored successfully",
      };
    }

    // Check deletion log if soft-delete didn't work
    let restoredFromLog = false;
    try {
      // If you have a deletion log collection
      if (
        mongoose.models.ListingDeletionLog ||
        mongoose.connection.collections["listingdeletionlogs"]
      ) {
        const ListingDeletionLog =
          mongoose.models.ListingDeletionLog ||
          mongoose.model(
            "ListingDeletionLog",
            new mongoose.Schema({
              listingId: String,
              originalData: Object,
              deletedAt: Date,
              deletedBy: String,
              reason: String,
            })
          );

        const deletionLog = await ListingDeletionLog.findOne({
          listingId: id,
        }).lean();

        if (deletionLog && deletionLog.originalData) {
          // Create a new listing with the original data
          const originalData = deletionLog.originalData;

          // Ensure we're not overwriting an existing listing
          const existingListing = await Listing.findById(
            new mongoose.Types.ObjectId(id)
          );
          if (existingListing) {
            return {
              success: false,
              error: "Cannot restore: A listing with this ID already exists",
            };
          }

          // Create new listing with the original data but preserve original ID
          const newListing = new Listing({
            ...originalData,
            _id: new mongoose.Types.ObjectId(id),
            restoredAt: new Date(),
            restoredBy: userId,
            restoredFromBackup: true,
          });

          await newListing.save();

          // Mark the deletion log entry as restored
          await ListingDeletionLog.updateOne(
            { listingId: id },
            {
              $set: {
                restored: true,
                restoredAt: new Date(),
                restoredBy: userId,
              },
            }
          );

          logListingEvent({
            type: "LISTING_RESTORED",
            id,
            userId,
            metadata: { method: "deletion_log" },
          });

          restoredFromLog = true;

          return {
            success: true,
            listing: newListing,
            message: "Listing has been restored from backup data",
          };
        }
      }
    } catch (logErr) {
      console.error(
        "[ListingRecovery] Error restoring from deletion logs:",
        logErr
      );
      logListingEvent({
        type: "RESTORE_FAILURE",
        id,
        userId,
        metadata: { error: logErr.message },
      });
    }

    if (!restoredFromLog) {
      logListingEvent({
        type: "RESTORE_FAILURE",
        id,
        userId,
        metadata: { reason: "No recoverable data found" },
      });

      return {
        success: false,
        error: "No recoverable data found for this listing",
      };
    }
  } catch (error) {
    console.error("[ListingRecovery] Restoration failed:", error);
    logListingEvent({
      type: "RESTORE_ERROR",
      id,
      userId,
      metadata: { error: error.message },
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get a listing by ID with advanced recovery methods
 * Public function to be exposed in the wrapper
 */
export async function recoverListingById(id, options = {}) {
  if (!id) {
    console.error("[recoverListingById] Called with no ID");
    return {
      success: false,
      error: "No listing ID provided",
      listing: null,
    };
  }

  try {
    console.log(
      `[recoverListingById] Attempting recovery for listing ID: ${id}`
    );
    const result = await recoverListingData(id, {
      useDirectDb: true,
      tryAlternateIds: true,
      ...options,
    });

    return {
      success: result.success,
      listing: result.listing,
      wasDeleted: result.listing?.wasDeleted || false,
      recoveryDetails: {
        methods: Object.keys(result)
          .filter((key) => key.includes("Attempt") && result[key]?.success)
          .map((key) => key.replace("Attempt", "")),
        wasDeleted: result.recentlyDeletedCheck?.wasDeleted || false,
        recoveryId: result.recoveryId,
      },
      error: result.success ? null : "Listing could not be recovered",
    };
  } catch (error) {
    console.error(`[recoverListingById] Recovery error for ID ${id}:`, error);
    return {
      success: false,
      error: `Recovery failed: ${error.message}`,
      listing: null,
    };
  }
}

/**
 * Attempt recovery of a listing - simpler version for client use
 */
export async function attemptListingRecovery(id) {
  if (!id) return { success: false, error: "No listing ID provided" };

  try {
    // Try to recover via API first
    const response = await fetch(`/api/listings/recovery?id=${id}`);
    const data = await response.json();

    if (response.ok && data.listing) {
      return {
        success: true,
        listing: data.listing,
        method: "api",
      };
    }

    return {
      success: false,
      error: data.error || "Listing could not be recovered via API",
    };
  } catch (error) {
    console.error(`[attemptListingRecovery] Error for ID ${id}:`, error);
    return {
      success: false,
      error: `Recovery attempt failed: ${error.message}`,
    };
  }
}

/**
 * Check if a listing was recently deleted
 */
export async function checkRecentlyDeleted(id) {
  try {
    await connectDB();

    // Check for soft-deleted listing
    const Listing =
      mongoose.models.Listing || (await import("../models/Listing")).default;
    const softDeletedListing = await Listing.findOne({
      _id: new mongoose.Types.ObjectId(id),
      deleted: true,
    }).lean();

    // Check deletion logs
    let deletionLog = null;
    try {
      if (
        mongoose.models.ListingDeletionLog ||
        mongoose.connection.collections["listingdeletionlogs"]
      ) {
        const ListingDeletionLog =
          mongoose.models.ListingDeletionLog ||
          mongoose.model(
            "ListingDeletionLog",
            new mongoose.Schema({
              listingId: String,
              originalData: Object,
              deletedAt: Date,
              deletedBy: String,
              reason: String,
            })
          );

        deletionLog = await ListingDeletionLog.findOne({
          listingId: id,
        }).lean();
      }
    } catch (err) {
      console.error("Error checking deletion logs:", err);
    }

    return {
      wasDeleted: !!softDeletedListing || !!deletionLog,
      softDeletedListing: softDeletedListing
        ? {
            ...softDeletedListing,
            _id: softDeletedListing._id.toString(),
          }
        : null,
      deletionLog: deletionLog
        ? {
            deletedAt: deletionLog.deletedAt,
            reason: deletionLog.reason,
            hasBackupData: !!deletionLog.originalData,
          }
        : null,
      recoverable:
        !!softDeletedListing || (deletionLog && !!deletionLog.originalData),
    };
  } catch (error) {
    console.error("[ListingRecovery] Error checking deleted listings:", error);
    return { error: error.message };
  }
}
