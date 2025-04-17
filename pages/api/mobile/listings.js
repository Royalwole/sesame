import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";

export default async function handler(req, res) {
  // Set JSON content type header early to ensure proper response format
  res.setHeader("Content-Type", "application/json");

  let dbConnection = false;

  try {
    // Add connection debugging
    console.log("Attempting to connect to database...");

    // Connect to the database with a timeout
    const connectionPromise = connectDB();

    // Add a timeout to the connection attempt
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), 10000)
    );

    // Race the connection against the timeout
    await Promise.race([connectionPromise, timeoutPromise]);
    dbConnection = true;
    console.log("Successfully connected to database");

    // Get query parameters with proper defaults
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

    console.log(
      "Executing query with filters:",
      JSON.stringify(query, null, 2)
    );

    try {
      // Add dummy data if in development and there are no listings
      const count = await Listing.countDocuments(query);

      if (count === 0 && process.env.NODE_ENV === "development") {
        console.log("No listings found, adding sample data for development");
        const dummyListings = generateDummyListings();
        await Listing.insertMany(dummyListings);
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
        title: listing.title || "Untitled Property",
        location: `${listing.address || ""}, ${listing.city || ""}`.trim(),
        price: listing.price || 0,
        imageUrl: listing.images?.[0]?.url || null,
        bedrooms: listing.bedrooms || 0,
        bathrooms: listing.bathrooms || 0,
        propertyType: listing.propertyType || "other",
        listingType: listing.listingType || "sale",
        createdAt: listing.createdAt || new Date(),
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
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return res.status(500).json({
        success: false,
        error: "Database operation failed",
        message: dbError.message,
      });
    }
  } catch (error) {
    console.error("Error in mobile listings API:", error);

    // Ensure we haven't sent headers already
    if (!res.headersSent) {
      // Always return a proper JSON error response
      return res.status(500).json({
        success: false,
        error: "Server error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  } finally {
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log("Database connection closed");
      } catch (e) {
        console.error("Error disconnecting from database:", e);
      }
    }
  }
}

// Helper function to generate dummy listings data for development
function generateDummyListings() {
  const cities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"];
  const propertyTypes = ["house", "apartment", "land", "commercial", "office"];
  const listingTypes = ["rent", "sale", "lease", "shortlet"];

  return Array.from({ length: 20 }, (_, i) => ({
    title: `${propertyTypes[i % propertyTypes.length].charAt(0).toUpperCase() + propertyTypes[i % propertyTypes.length].slice(1)} ${i + 1} in ${cities[i % cities.length]}`,
    address: `${i + 1} Sample Street`,
    city: cities[i % cities.length],
    price: Math.floor(Math.random() * 900000) + 100000, // Random price between 100k and 1M
    bedrooms: Math.floor(Math.random() * 5) + 1,
    bathrooms: Math.floor(Math.random() * 3) + 1,
    status: "published",
    propertyType: propertyTypes[i % propertyTypes.length],
    listingType: listingTypes[i % listingTypes.length],
    createdAt: new Date(),
    description: "This is a sample property listing for development purposes.",
    images: [
      {
        url: `https://source.unsplash.com/random/800x600?house,property&sig=${i}`,
        alt: "Property Image",
      },
    ],
  }));
}
