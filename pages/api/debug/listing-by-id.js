import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import mongoose from "mongoose";
import IdFlowLogger from "../../../lib/id-flow-logger";

export default async function handler(req, res) {
  // Only allow this endpoint in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development endpoint only" });
  }

  const id = req.query.id;
  const logger = new IdFlowLogger({ id, requestType: "debug-listing-by-id" });
  let dbConnection = false;

  logger.log("Request received", {
    method: req.method,
    query: req.query,
    headers: req.headers,
  });

  try {
    if (!id) {
      logger.error("No ID provided in request");
      return res.status(400).json({
        error: "Missing ID parameter",
        flow: logger.getReport(),
      });
    }

    logger.log("Validating MongoDB ObjectID format");
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);

    if (!isValidObjectId) {
      logger.error("Invalid MongoDB ObjectID format", { id });
      return res.status(400).json({
        error: "Invalid MongoDB ObjectID format",
        flow: logger.getReport(),
      });
    }

    logger.log("Connecting to database");
    await connectDB();
    dbConnection = true;

    // Create a new ObjectId for exact matching
    logger.log("Creating ObjectId from string ID");
    const objectId = new mongoose.Types.ObjectId(id);
    logger.log("ObjectId created", {
      stringId: id,
      objectId: objectId.toString(),
      isEqual: id === objectId.toString(),
    });

    // Test multiple query approaches to find the issue
    logger.log("Executing queries with multiple approaches");

    // Approach 1: Using findById (should automatically handle string to ObjectId conversion)
    const listing1 = await Listing.findById(id).lean();
    logger.log("Query 1 (findById) result", {
      found: !!listing1,
      idMatch: listing1 ? IdFlowLogger.compareIds(listing1._id, id) : false,
      title: listing1?.title,
    });

    // Approach 2: Find with _id as string
    const listing2 = await Listing.findOne({ _id: id }).lean();
    logger.log("Query 2 (findOne with string _id) result", {
      found: !!listing2,
      idMatch: listing2 ? IdFlowLogger.compareIds(listing2._id, id) : false,
      title: listing2?.title,
    });

    // Approach 3: Find with explicit ObjectId instance
    const listing3 = await Listing.findOne({ _id: objectId }).lean();
    logger.log("Query 3 (findOne with ObjectId) result", {
      found: !!listing3,
      idMatch: listing3 ? IdFlowLogger.compareIds(listing3._id, id) : false,
      title: listing3?.title,
    });

    // Final object - which approach returned the correct document?
    let finalListing = null;
    let approachUsed = "";

    if (listing3 && IdFlowLogger.compareIds(listing3._id, id)) {
      finalListing = listing3;
      approachUsed = "Using ObjectId instance";
    } else if (listing1 && IdFlowLogger.compareIds(listing1._id, id)) {
      finalListing = listing1;
      approachUsed = "Using findById";
    } else if (listing2 && IdFlowLogger.compareIds(listing2._id, id)) {
      finalListing = listing2;
      approachUsed = "Using string ID";
    } else {
      logger.error("No matching document found with any approach");
    }

    // Check for ID consistency
    if (finalListing) {
      const responseId = String(finalListing._id);
      const requestId = String(id);

      logger.log("Final result object analysis", {
        title: finalListing.title,
        responseId,
        requestId,
        idsMatch: responseId === requestId,
        approachUsed,
      });

      // If IDs don't match exactly, this is our problem
      if (responseId !== requestId) {
        logger.error("Critical ID mismatch detected", {
          responseId,
          requestId,
          title: finalListing.title,
        });

        return res.status(500).json({
          error: "ID mismatch",
          message: "The requested ID does not match the returned document ID",
          details: {
            requested: requestId,
            returned: responseId,
            title: finalListing.title,
          },
          flow: logger.getReport(),
        });
      }

      // Return the listing with debug info
      const result = {
        success: true,
        listing: {
          ...finalListing,
          _id: String(finalListing._id), // Ensure consistent string representation
        },
        debug: {
          approachUsed,
          requestId: id,
          responseId: String(finalListing._id),
        },
        flow: logger.getReport(),
      };

      logger.log("Returning successful response");
      // Set strong cache busting headers
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      return res.status(200).json(result);
    } else {
      // No document found
      logger.log("No document found with the requested ID");
      return res.status(404).json({
        error: "Not found",
        message: "No listing found with the provided ID",
        debug: {
          query1Result: !!listing1,
          query2Result: !!listing2,
          query3Result: !!listing3,
        },
        flow: logger.getReport(),
      });
    }
  } catch (error) {
    logger.error("Unexpected error in debug API", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
      flow: logger.getReport(),
    });
  } finally {
    if (dbConnection) {
      logger.log("Disconnecting from database");
      await disconnectDB();
    }
  }
}
