console.log("Simple test script starting...");

const mongoose = require("mongoose");

console.log("Mongoose required successfully");

async function test() {
  try {
    console.log("Checking environment...");
    console.log("MONGODB_URI:", process.env.MONGODB_URI || "NOT SET");

    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/topdial";
    console.log("Using URI:", uri);

    console.log("Attempting connection...");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB!");

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Collections:",
      collections.map((c) => c.name)
    );

    await mongoose.disconnect();
    console.log("Disconnected successfully");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test().catch(console.error);
