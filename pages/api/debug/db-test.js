import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";

export default async function handler(_req, res) {
  // Changed req to _req to indicate unused
  try {
    console.log("🔵 Testing database connection");
    await connectDB();
    console.log("✅ Database connection successful");

    // Test retrieving a count of listings
    const count = await Listing.countDocuments();
    console.log(`✅ Found ${count} listings in the database`);

    // Get the most recent listing
    const latestListing = await Listing.findOne()
      .sort({ created_at: -1 })
      .limit(1);

    return res.status(200).json({
      success: true,
      message: "Database connection successful",
      listingsCount: count,
      latestListing: latestListing
        ? {
            id: latestListing._id,
            title: latestListing.title,
            createdAt: latestListing.created_at,
            status: latestListing.status,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Database connection error:", error);
    return res.status(500).json({
      success: false,
      error: "Database connection failed",
      message: error.message,
    });
  } finally {
    try {
      await disconnectDB();
      console.log("✅ Database connection closed");
    } catch (err) {
      console.error("❌ Error closing database connection:", err);
    }
  }
}
