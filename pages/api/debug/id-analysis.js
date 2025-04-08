import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import mongoose from "mongoose";

export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only endpoint" });
  }

  const { id } = req.query;
  let dbConnection = false;

  try {
    await connectDB();
    dbConnection = true;

    // If no ID provided, analyze the most recent listings
    if (!id) {
      const recentListings = await Listing.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return res.status(200).json({
        success: true,
        listingCount: recentListings.length,
        listings: recentListings.map((listing) => ({
          title: listing.title,
          rawId: listing._id,
          stringId: listing._id.toString(),
          isValid: mongoose.Types.ObjectId.isValid(listing._id.toString()),
          createdAt: listing.createdAt,
        })),
      });
    }

    // Analyze the specific ID
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    let exactIdMatch = null;
    let objectIdMatch = null;

    // Try to find by exact string ID first
    if (isValidObjectId) {
      const objectId = new mongoose.Types.ObjectId(id);
      objectIdMatch = await Listing.findOne({ _id: objectId }).lean();

      // Also try using the plain string ID just to test
      exactIdMatch = await Listing.findOne({ _id: id }).lean();
    }

    // Return detailed analysis
    return res.status(200).json({
      success: true,
      analysis: {
        providedId: id,
        isValidObjectId,
        stringIdMatchFound: !!exactIdMatch,
        objectIdMatchFound: !!objectIdMatch,
        matchingListing: objectIdMatch
          ? {
              title: objectIdMatch.title,
              id: objectIdMatch._id.toString(),
              createdAt: objectIdMatch.createdAt,
              status: objectIdMatch.status,
              isExactMatch: id === objectIdMatch._id.toString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error in ID analysis API:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
