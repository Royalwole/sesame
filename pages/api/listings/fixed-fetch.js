import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import mongoose from "mongoose";

export default async function handler(req, res) {
  const { id, forceDirect = false } = req.query;
  let dbConnection = false;
  const requestId = `fetch-${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();
  const recoveryLog = [];

  console.log(
    `[FixedFetch:${requestId}] Starting enhanced fetch for ID: ${id}`
  );

  try {
    // Connect to database
    await connectDB();
    dbConnection = true;

    // Only GET method is supported
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
        requestId,
      });
    }

    // Validate ID format
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Listing ID is required",
        requestId,
      });
    }

    // Try standard ObjectId approach first
    let listing = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      try {
        const objectId = new mongoose.Types.ObjectId(id);
        recoveryLog.push({
          method: "standardFetch",
          objectId: objectId.toString(),
        });

        // Use findById for exact match
        listing = await Listing.findById(objectId)
          .populate("createdBy", "firstName lastName email phone")
          .lean();

        if (listing) {
          recoveryLog.push({
            success: true,
            method: "standardFetch",
            foundId: listing._id.toString(),
          });
        }
      } catch (err) {
        recoveryLog.push({
          method: "standardFetch",
          error: err.message,
        });
      }
    }

    // If standard approach didn't work, try direct ObjectId querying
    if (!listing && (forceDirect || !mongoose.Types.ObjectId.isValid(id))) {
      try {
        recoveryLog.push({ method: "directQuery", search: "byStringId" });

        // Try direct string matching
        listing = await Listing.findOne({
          $or: [{ _id: id }, { _id: { $regex: id, $options: "i" } }],
        })
          .populate("createdBy", "firstName lastName email phone")
          .lean();

        if (listing) {
          recoveryLog.push({
            success: true,
            method: "directQuery",
            foundId: listing._id.toString(),
          });
        }
      } catch (err) {
        recoveryLog.push({
          method: "directQuery",
          error: err.message,
        });
      }
    }

    // If still not found, try advanced recovery techniques
    if (!listing) {
      try {
        // Try searching by ID field or any other unique identifiers
        recoveryLog.push({ method: "advancedRecovery", search: "byId" });

        // Fetch most recent listings to see if any match
        const recentListings = await Listing.find({})
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("createdBy", "firstName lastName email phone")
          .lean();

        // See if any recent listing has matching ID components
        const possibleMatch = recentListings.find(
          (l) =>
            l._id.toString().includes(id.substring(0, 8)) ||
            id.includes(l._id.toString().substring(0, 8))
        );

        if (possibleMatch) {
          listing = possibleMatch;
          recoveryLog.push({
            success: true,
            method: "advancedRecovery",
            note: "Found possible match in recent listings",
          });
        }
      } catch (err) {
        recoveryLog.push({
          method: "advancedRecovery",
          error: err.message,
        });
      }

      // Try fetching by title if provided in query
      if (!listing && req.query.fallbackTitle) {
        try {
          recoveryLog.push({
            method: "fallbackSearch",
            search: "byTitle",
            title: req.query.fallbackTitle,
          });

          const titleSearch = decodeURIComponent(req.query.fallbackTitle);
          listing = await Listing.findOne({
            title: { $regex: titleSearch, $options: "i" },
          })
            .populate("createdBy", "firstName lastName email phone")
            .lean();

          if (listing) {
            recoveryLog.push({
              success: true,
              method: "fallbackSearch",
              foundId: listing._id.toString(),
            });
          }
        } catch (err) {
          recoveryLog.push({
            method: "fallbackSearch",
            error: err.message,
          });
        }
      }
    }

    // Final result processing
    const duration = Date.now() - startTime;

    // Set cache control headers
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // If found, return listing with timestamp to avoid caching
    if (listing) {
      // Ensure IDs are properly stringified
      const stringifiedListing = JSON.parse(JSON.stringify(listing));

      return res.status(200).json({
        success: true,
        listing: stringifiedListing,
        meta: {
          requestId,
          timestamp: Date.now(),
          duration,
        },
        log: process.env.NODE_ENV === "development" ? recoveryLog : undefined,
      });
    }

    // No listing found after all attempts
    return res.status(404).json({
      success: false,
      message: "Listing not found after multiple recovery attempts",
      meta: {
        requestId,
        timestamp: Date.now(),
        duration,
      },
      log: process.env.NODE_ENV === "development" ? recoveryLog : undefined,
    });
  } catch (error) {
    console.error(`[FixedFetch:${requestId}] Error:`, error);

    return res.status(500).json({
      success: false,
      message: "Server error during listing fetch",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      meta: {
        requestId,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      },
      log: process.env.NODE_ENV === "development" ? recoveryLog : undefined,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
