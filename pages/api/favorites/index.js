import { connectDB, disconnectDB } from "../../../lib/db";
import Favorite from "../../../models/Favorite";
import { getAuth } from "@clerk/nextjs/server";
import { listingApiHandler } from "../../../middlewares/api-middleware";
import {
  sendSuccess,
  sendError,
  sendUnauthorized,
} from "../../../lib/api-response";

// Handler with consistent error handling and response format
const handler = async (req, res) => {
  // Method validation
  if (!["GET", "POST"].includes(req.method)) {
    return sendError(res, "Method not allowed", 405);
  }

  let dbConnection = false;
  const auth = getAuth(req);

  // Authentication check
  if (!auth?.userId) {
    return sendUnauthorized(res);
  }

  try {
    // Connect to database
    await connectDB();
    dbConnection = true;

    // GET request to retrieve favorites
    if (req.method === "GET") {
      // Get user's favorites with pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [favorites, total] = await Promise.all([
        Favorite.find({ userId: auth.userId })
          .populate("listing")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Favorite.countDocuments({ userId: auth.userId }),
      ]);

      const pages = Math.ceil(total / limit);

      return sendSuccess(
        res,
        {
          favorites,
          pagination: { total, page, limit, pages },
        },
        "Favorites retrieved successfully"
      );
    }

    // POST request to add a favorite
    if (req.method === "POST") {
      const { listingId } = req.body;

      if (!listingId) {
        return sendError(res, "Listing ID is required", 400);
      }

      // Check if already favorited
      const existingFavorite = await Favorite.findOne({
        userId: auth.userId,
        listing: listingId,
      });

      if (existingFavorite) {
        return sendError(res, "Listing is already in favorites", 400);
      }

      // Create new favorite
      const favorite = new Favorite({
        userId: auth.userId,
        listing: listingId,
      });

      await favorite.save();

      return sendSuccess(res, { favorite }, "Added to favorites", 201);
    }
  } catch (error) {
    throw error; // Let the error handling middleware handle this
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
};

export default listingApiHandler(handler);
