/**
 * MongoDB connection test utility
 * Run with: node scripts/test-mongodb.js
 */

// Use dynamic import to support top-level await
(async () => {
  try {
    console.log("================================");
    console.log("MongoDB Connection Test Utility");
    console.log("================================\n");

    // Import dependencies
    const { connectDB, disconnectDB, checkDBConnection, getConnectionStatus } =
      await import("../lib/db.js");
    const mongoose = (await import("mongoose")).default;

    // Step 1: Check environment
    console.log("Environment Information:");
    console.log(`- NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
    console.log(
      `- MongoDB URI: ${process.env.MONGODB_URI ? "set" : "not set"}`
    );

    if (!process.env.MONGODB_URI) {
      console.warn("\n⚠️  Warning: MONGODB_URI environment variable not set");
      console.log("Will use default: mongodb://localhost:27017/topdial_dev\n");
    }

    // Step 2: Attempt connection
    console.log("\nConnecting to MongoDB...");
    const startTime = Date.now();

    try {
      await connectDB();
      const connectionTime = Date.now() - startTime;
      console.log(`✅ Connected successfully in ${connectionTime}ms`);

      // Get connection status details
      const status = getConnectionStatus();
      console.log("\nConnection Details:");
      console.log(
        `- Connection state: ${["Disconnected", "Connected", "Connecting", "Disconnecting"][mongoose.connection.readyState]}`
      );
      console.log(`- Database name: ${mongoose.connection.name}`);
      console.log(`- Host: ${mongoose.connection.host}`);
      console.log(`- Port: ${mongoose.connection.port}`);

      // Step 3: Check connection with ping
      console.log("\nPinging database server...");
      const pingResult = await mongoose.connection.db.admin().ping();
      console.log(`✅ Ping successful: ${JSON.stringify(pingResult)}`);

      // Step 4: List collections
      console.log("\nCollections in database:");
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();

      if (collections.length === 0) {
        console.log("No collections found in database");
      } else {
        collections.forEach((collection, i) => {
          console.log(`${i + 1}. ${collection.name} (${collection.type})`);
        });
      }

      // Step 5: Get database statistics
      console.log("\nDatabase Statistics:");
      const stats = await mongoose.connection.db.stats();
      console.log(`- Collections: ${stats.collections}`);
      console.log(`- Objects: ${stats.objects}`);
      console.log(`- Storage size: ${formatBytes(stats.storageSize)}`);
      console.log(`- Indexes: ${stats.indexes}`);
      console.log(`- Index size: ${formatBytes(stats.indexSize)}`);

      console.log("\n✅ MongoDB connection test completed successfully");
    } catch (error) {
      console.error("\n❌ Failed to connect to MongoDB:");
      console.error("  " + error.message);

      if (error.name === "MongoServerSelectionError") {
        console.log("\nPossible reasons:");
        console.log("1. MongoDB server is not running");
        console.log("2. Connection string is incorrect");
        console.log("3. Network issue preventing connection");
        console.log("4. Authentication failed");
      }

      process.exit(1);
    } finally {
      // Step 6: Close connection
      console.log("\nClosing connection...");
      await disconnectDB();
      console.log("Connection closed");
    }
  } catch (error) {
    console.error("\n❌ An unexpected error occurred:");
    console.error(error);
    process.exit(1);
  }
})();

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
}
