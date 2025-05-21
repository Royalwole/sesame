import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import { connectToDatabase } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  let dbConnection = false;

  try {
    // Extract query parameters
    const {
      excludeId,
      propertyType,
      city,
      state,
      minPrice,
      maxPrice,
      limit = 3,
    } = req.query;

    // Build query object
    const query = {
      status: "published",
    };

    // Exclude current listing
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Add property type filter if provided
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Add location filters if provided
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");

    // Add price range if provided
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Find similar listings
    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Format the response
    const formattedListings = listings.map((listing) => ({
      ...listing,
      _id: listing._id.toString(),
    }));

    // Return the results
    return res.status(200).json({
      success: true,
      listings: formattedListings,
    });
  } catch (error) {
    console.error("Error fetching similar listings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching similar listings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}

export async function getSimilarListings(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id, location, propertyType, limit = 4 } = req.query;

    const db = await connectToDatabase();
    const listings = db.collection("listings");

    // Build query for similar listings
    const query = {
      _id: { $ne: id }, // Exclude current listing
      status: "for_sale", // Only active listings
    };

    // Add optional filters
    if (location) {
      query["location.city"] = location;
    }
    if (propertyType) {
      query.propertyType = propertyType;
    }

    const results = await listings.find(query).limit(parseInt(limit)).toArray();

    return res.status(200).json({
      success: true,
      listings: results || [],
    });
  } catch (error) {
    console.error("Similar listings error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch similar listings",
    });
  }
}
