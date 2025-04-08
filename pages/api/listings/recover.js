import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import { getAuth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import User from "../../../models/User";

export default async function handler(req, res) {
  // This endpoint is for listing recovery when normal paths fail
  const { id } = req.query;
  let dbConnection = false;

  try {
    // Authorization check - restrict to agents, admins, or dev environment
    const auth = getAuth(req);
    let isAuthorized = process.env.NODE_ENV === "development";
    let user = null;

    if (auth?.userId) {
      await connectDB();
      dbConnection = true;

      user = await User.findOne({ clerkId: auth.userId }).lean();
      if (user && (user.role === "admin" || user.role === "agent")) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "Only agents and admins can use this recovery endpoint",
      });
    }

    // Require an ID parameter
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing ID parameter",
      });
    }

    // Connect to DB if not already connected
    if (!dbConnection) {
      await connectDB();
      dbConnection = true;
    }

    // Try different query strategies to find the listing
    const recoveryResults = {
      strategies: [],
      success: false,
      listing: null,
    };

    // Strategy 1: Standard ObjectId lookup
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const objectId = new mongoose.Types.ObjectId(id);
        const listing = await Listing.findOne({ _id: objectId })
          .populate("createdBy", "firstName lastName email phone")
          .lean();

        if (listing) {
          recoveryResults.strategies.push({
            name: "standard",
            success: true,
          });

          recoveryResults.success = true;
          recoveryResults.listing = {
            ...listing,
            _id: listing._id.toString(),
            createdBy: listing.createdBy
              ? {
                  ...listing.createdBy,
                  _id: listing.createdBy._id.toString(),
                }
              : null,
          };
        } else {
          recoveryResults.strategies.push({
            name: "standard",
            success: false,
            message: "Listing not found with valid ObjectId",
          });
        }
      }
    } catch (error) {
      recoveryResults.strategies.push({
        name: "standard",
        success: false,
        error: error.message,
      });
    }

    // Strategy 2: Search by title/address if provided
    try {
      const { title, address } = req.query;

      if (title || address) {
        const searchQuery = {};

        if (title) searchQuery.title = { $regex: new RegExp(title, "i") };
        if (address) searchQuery.address = { $regex: new RegExp(address, "i") };

        const potentialMatches = await Listing.find(searchQuery)
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        recoveryResults.strategies.push({
          name: "textSearch",
          success: potentialMatches.length > 0,
          matchCount: potentialMatches.length,
          matches: potentialMatches.map((l) => ({
            _id: l._id.toString(),
            title: l.title,
            address: l.address,
            createdAt: l.createdAt,
          })),
        });

        // If we haven't found a listing yet and have a single match, use it
        if (!recoveryResults.success && potentialMatches.length === 1) {
          const listing = potentialMatches[0];

          recoveryResults.success = true;
          recoveryResults.listing = {
            ...listing,
            _id: listing._id.toString(),
            createdBy: listing.createdBy
              ? {
                  ...listing.createdBy,
                  _id: listing.createdBy._id.toString(),
                }
              : null,
          };
        }
      }
    } catch (error) {
      recoveryResults.strategies.push({
        name: "textSearch",
        success: false,
        error: error.message,
      });
    }

    // If we've found a listing through any strategy, return it
    if (recoveryResults.success) {
      return res.status(200).json({
        success: true,
        listing: recoveryResults.listing,
        recoveryInfo: recoveryResults.strategies,
      });
    }

    // If all strategies failed, return diagnostics
    return res.status(404).json({
      success: false,
      error: "Could not recover listing",
      message: "No recovery strategy found the requested listing",
      recoveryInfo: recoveryResults.strategies,
    });
  } catch (error) {
    console.error("Error in listing recovery API:", error);
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
