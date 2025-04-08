/**
 * This script fixes listings that might have incorrect status
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Define Listing schema similar to the model
const listingSchema = new mongoose.Schema(
  {
    title: String,
    status: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    // ... other fields not needed for this script
  },
  { timestamps: true }
);

async function fixListings() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    // Get Listing model
    const Listing =
      mongoose.models.Listing || mongoose.model("Listing", listingSchema);

    // Find listings without a status
    const missingStatusCount = await Listing.countDocuments({
      status: { $exists: false },
    });
    console.log(`Found ${missingStatusCount} listings with missing status`);

    if (missingStatusCount > 0) {
      // Update listings without a status to "published"
      const updateResult = await Listing.updateMany(
        { status: { $exists: false } },
        { $set: { status: "published" } }
      );
      console.log(
        `Updated ${updateResult.modifiedCount} listings to published status`
      );
    }

    // Count draft listings
    const draftCount = await Listing.countDocuments({ status: "draft" });
    console.log(`Found ${draftCount} draft listings`);

    // Count published listings
    const publishedCount = await Listing.countDocuments({
      status: "published",
    });
    console.log(`Found ${publishedCount} published listings`);

    // Show total listings
    const totalCount = await Listing.countDocuments();
    console.log(`Total listings: ${totalCount}`);

    console.log("Listing status cleanup completed!");
  } catch (error) {
    console.error("Error fixing listings:", error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
}

// Call the function if this file is executed directly
if (process.argv[1] === import.meta.url) {
  fixListings();
}
