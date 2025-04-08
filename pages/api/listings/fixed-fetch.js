import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import mongoose from "mongoose";

export default async function handler(req, res) {
  // Get the listing ID from query parameters
  const { id, forceDirect } = req.query;
  let dbConnection = false;

  try {
    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing ID parameter",
      });
    }

    console.log(`[fixed-fetch] Recovery attempt for listing ${id}`);

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Try multiple approaches to find the listing
    let listing = null;
    const recoveryLog = [];

    // Try multiple ID formats for maximum compatibility
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Try 1: Direct ObjectId lookup
      try {
        const objectId = new mongoose.Types.ObjectId(id);
        recoveryLog.push({ method: "objectId", id: objectId.toString() });

        listing = await Listing.findOne({ _id: objectId })
          .populate("createdBy", "firstName lastName email phone")
          .lean();

        if (listing) {
          recoveryLog.push({ success: true, method: "objectId" });
        }
      } catch (err) {
        recoveryLog.push({ error: err.message, method: "objectId" });
      }

      // Try 2: String ID lookup as fallback
      if (!listing) {
        try {
          recoveryLog.push({ method: "stringId", id: id.toString() });

          listing = await Listing.findOne({ _id: id.toString() })
            .populate("createdBy", "firstName lastName email phone")
            .lean();

          if (listing) {
            recoveryLog.push({ success: true, method: "stringId" });
          }
        } catch (err) {
          recoveryLog.push({ error: err.message, method: "stringId" });
        }
      }
    }

    // Try 3: If direct flag is set, try even more aggressive approaches
    if (!listing && forceDirect === "true") {
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
        recoveryLog.push({ error: err.message, method: "advancedRecovery" });
      }
    }

    // If we found a listing with any method
    if (listing) {
      // Standardize listing for response
      const standardizedListing = {
        ...listing,
        _id: listing._id.toString(),
        createdBy: listing.createdBy
          ? { ...listing.createdBy, _id: listing.createdBy._id.toString() }
          : null,
      };

      return res.status(200).json({
        success: true,
        listing: standardizedListing,
        recoveryInfo: {
          method: "direct-db-query",
          steps: recoveryLog,
        },
      });
    }

    // No listing found with any approach
    return res.status(404).json({
      success: false,
      error: "Listing not found",
      recoveryInfo: { steps: recoveryLog },
      queriedId: id,
    });
  } catch (error) {
    console.error("Error in fixed-fetch API:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
