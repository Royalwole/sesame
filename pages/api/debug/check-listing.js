import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
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

    // Get all listings if no ID provided
    if (!id) {
      const latestListings = await Listing.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return res.status(200).json({
        success: true,
        message: "5 most recent listings",
        listings: latestListings.map((listing) => ({
          id: listing._id.toString(),
          title: listing.title,
          status: listing.status || "No status set",
          createdBy: listing.createdBy?.toString(),
          createdAt: listing.createdAt,
          images: (listing.images || []).length,
        })),
      });
    }

    // If ID provided but invalid format
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid listing ID format",
        providedId: id,
      });
    }

    // Get specific listing details
    const listing = await Listing.findById(id).populate("createdBy").lean();

    if (!listing) {
      return res.status(404).json({
        error: "Listing not found",
        providedId: id,
      });
    }

    // Get authenticated user for reference
    const auth = getAuth(req);
    let currentUser = null;

    if (auth?.userId) {
      currentUser = await User.findOne({ clerkId: auth.userId }).lean();
    }

    return res.status(200).json({
      success: true,
      listing: {
        id: listing._id.toString(),
        title: listing.title,
        status: listing.status || "No status set",
        createdBy: listing.createdBy
          ? {
              id: listing.createdBy._id.toString(),
              name: `${listing.createdBy.firstName} ${listing.createdBy.lastName}`,
              email: listing.createdBy.email,
              role: listing.createdBy.role,
            }
          : "No creator associated",
        isAssociatedWithCurrentUser:
          currentUser &&
          listing.createdBy &&
          currentUser._id.toString() === listing.createdBy._id.toString(),
        visibility: {
          isPublished: listing.status === "published",
          isPubliclyAccessible: listing.status === "published",
          isVisibleToCreator: true,
          isVisibleToAdmin: true,
        },
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        images: listing.images || [],
        address: listing.address,
        city: listing.city,
        price: listing.price,
      },
    });
  } catch (error) {
    console.error("Error in check-listing API:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
