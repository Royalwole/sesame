import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  let dbConnection = false;

  try {
    await connectDB();
    dbConnection = true;

    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const city = req.query.city || "";
    const propertyType = req.query.propertyType || "";
    const listingType = req.query.listingType || "";
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

    // Build query
    const query = {
      status: "published",
      price: { $gte: minPrice, $lte: maxPrice },
    };

    if (search) {
      query.$text = { $search: search };
    }

    if (city) {
      query.city = { $regex: new RegExp(city, "i") };
    }

    if (propertyType) {
      query.propertyType = propertyType;
    }

    if (listingType) {
      query.listingType = listingType;
    }

    // Execute query
    const listings = await Listing.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "title address city price bedrooms bathrooms images createdAt listingType propertyType"
      )
      .lean();

    // Transform data for mobile app
    const formattedListings = listings.map((listing) => ({
      id: listing._id.toString(),
      title: listing.title,
      location: `${listing.address}, ${listing.city}`,
      price: listing.price,
      imageUrl: listing.images?.[0]?.url || null,
      bedrooms: listing.bedrooms || 0,
      bathrooms: listing.bathrooms || 0,
      propertyType: listing.propertyType,
      listingType: listing.listingType,
      createdAt: listing.createdAt,
    }));

    const total = await Listing.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: formattedListings,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in mobile listings API:", error);
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
