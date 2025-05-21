import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";

/**
 * API endpoint to fetch public listings with robust error handling
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const requestId = `listings_${Math.random().toString(36).substring(2, 10)}`;
  console.log(`[${requestId}] Processing listings request`, {
    query: req.query,
  });

  let dbConnection = false;
  const startTime = Date.now();

  try {
    // Parse query parameters with defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
    const skip = (page - 1) * limit;

    // Add cache-busting parameter to log but not use
    const cacheBuster = req.query._cb || req.query._t || null;
    if (cacheBuster) {
      console.log(`[${requestId}] Cache buster: ${cacheBuster}`);
    }

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Build query filters
    const filters = {};

    // Status filter - default to published
    filters.status = req.query.status || "published";

    // Additional filters
    if (req.query.propertyType) {
      filters.propertyType = req.query.propertyType;
    }

    if (req.query.minPrice) {
      filters.price = {
        ...(filters.price || {}),
        $gte: parseInt(req.query.minPrice, 10),
      };
    }

    if (req.query.maxPrice) {
      filters.price = {
        ...(filters.price || {}),
        $lte: parseInt(req.query.maxPrice, 10),
      };
    }

    if (req.query.bedrooms) {
      filters.bedrooms = { $gte: parseInt(req.query.bedrooms, 10) };
    }

    // Location filter with safe regex
    if (req.query.location) {
      const safeLocation = req.query.location.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      if (safeLocation.length <= 50) {
        filters["city"] = new RegExp(safeLocation, "i");
      }
    }

    console.log(`[${requestId}] Applying filters:`, filters);

    // Execute query with explicit sort
    const sortOptions =
      req.query.sort === "price_asc"
        ? { price: 1 }
        : req.query.sort === "price_desc"
          ? { price: -1 }
          : { createdAt: -1 };

    // Total count for pagination
    const total = await Listing.countDocuments(filters);

    // Fetch paginated listings
    const listings = await Listing.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const duration = Date.now() - startTime;
    console.log(
      `[${requestId}] Found ${listings.length} of ${total} listings in ${duration}ms`
    );

    // Return successful response with pagination
    return res.status(200).json({
      success: true,
      listings,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);

    // Return error response
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
      requestId,
    });
  } finally {
    // Close database connection
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log(`[${requestId}] Database connection closed`);
      } catch (error) {
        console.error(`[${requestId}] Error closing DB connection:`, error);
      }
    }
  }
}
