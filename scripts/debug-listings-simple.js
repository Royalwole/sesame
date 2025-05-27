const mongoose = require("mongoose");

// Connect to MongoDB directly
async function connectToMongoDB() {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/topdial";
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");
}

// Define Listing schema inline to avoid import issues
const listingSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  bedrooms: Number,
  bathrooms: Number,
  squareFeet: Number,
  propertyType: String,
  listingType: String,
  address: String,
  city: String,
  state: String,
  country: String,
  status: String,
  images: [String],
  features: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

async function debugListings() {
  try {
    console.log("🔍 Starting simple listings debug...");

    // Connect to database
    await connectToMongoDB();

    // 1. Check total listings
    const totalListings = await Listing.countDocuments();
    console.log(`📊 Total listings: ${totalListings}`);

    // 2. Check by status
    const publishedCount = await Listing.countDocuments({
      status: "published",
    });
    const draftCount = await Listing.countDocuments({ status: "draft" });
    const pendingCount = await Listing.countDocuments({ status: "pending" });
    const noStatusCount = await Listing.countDocuments({
      status: { $exists: false },
    });

    console.log(`📈 Status breakdown:
    - Published: ${publishedCount}
    - Draft: ${draftCount}
    - Pending: ${pendingCount}
    - No status: ${noStatusCount}`);

    // 3. Get recent listings
    const recentListings = await Listing.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title status price city images")
      .lean();

    console.log(`🏠 Recent listings (${recentListings.length}):`);
    recentListings.forEach((listing, index) => {
      console.log(
        `  ${index + 1}. "${listing.title}" - Status: ${listing.status || "NO STATUS"}`
      );
    });

    // 4. Fix missing status
    if (noStatusCount > 0) {
      console.log(`🔧 Fixing ${noStatusCount} listings without status...`);
      const result = await Listing.updateMany(
        { status: { $exists: false } },
        { $set: { status: "published" } }
      );
      console.log(`✅ Fixed ${result.modifiedCount} listings`);
    }

    // 5. Create sample if empty
    if (totalListings === 0) {
      console.log("📝 Creating sample listing...");
      const sample = new Listing({
        title: "Debug Test Property",
        description: "Test property for debugging listings display",
        price: 300000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1200,
        propertyType: "house",
        listingType: "sale",
        address: "456 Debug Avenue",
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        status: "published",
        images: ["https://via.placeholder.com/400x300?text=Debug+Property"],
        features: ["Air Conditioning", "Parking"],
      });

      await sample.save();
      console.log("✅ Sample listing created");
    }

    // 6. Final check
    const finalPublished = await Listing.countDocuments({
      status: "published",
    });
    console.log(`\n🎯 Final: ${finalPublished} published listings available`);

    // 7. Test API (if server is running)
    console.log("\n🌐 Testing API endpoint...");
    try {
      const fetch = (await import("node-fetch")).default;
      const response = await fetch(
        "http://localhost:3001/api/listings?limit=3"
      );
      const data = await response.json();

      if (data.success) {
        console.log(
          `✅ API working - ${data.listings?.length || 0} listings returned`
        );
      } else {
        console.log("❌ API error:", data.message);
      }
    } catch (apiError) {
      console.log(
        "⚠️  API test skipped (server may not be running):",
        apiError.message
      );
    }

    console.log("\n✅ Debug complete!");
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run debug
debugListings().catch(console.error);
