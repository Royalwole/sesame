/**
 * Database setup and diagnostic script
 * Run with: node scripts/db-setup.js
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

// Log current environment
console.log("Environment:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("- MONGODB_URI:", process.env.MONGODB_URI ? "(set)" : "(not set)");
console.log("- MONGODB_DB:", process.env.MONGODB_DB || "not set");
console.log("");

async function checkDatabaseConnection() {
  console.log("Testing database connection...");

  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/topdial_dev";

    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    console.log("✅ Database connection successful!");
    console.log("- Connection state:", mongoose.connection.readyState);
    console.log("- Database name:", mongoose.connection.name);

    // Check if we can perform a simple operation
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      `- Collections: ${collections.map((c) => c.name).join(", ") || "none"}`
    );

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("- Error:", error.message);
    if (error.name === "MongoServerSelectionError") {
      console.error(
        "- This error typically means the MongoDB server is unreachable."
      );
      console.error("- Please check that your MongoDB server is running.");
    }

    return false;
  } finally {
    try {
      await mongoose.disconnect();
      console.log("Disconnected from database.");
    } catch (e) {
      // Ignore disconnection errors
    }
  }
}

async function setupEnvironmentFile() {
  console.log("\nChecking for environment variables...");
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envExamplePath = path.resolve(process.cwd(), ".env.example");

  let needsEnvFile = false;

  if (!process.env.MONGODB_URI) {
    console.log("⚠️ MONGODB_URI is not set in your environment.");
    needsEnvFile = true;
  }

  if (needsEnvFile) {
    try {
      // Check if .env.local exists
      const envExists = fs.existsSync(envPath);
      if (!envExists) {
        console.log("Creating .env.local file with default values...");

        const template = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/topdial_dev
# MONGODB_DB=topdial

# Clerk Authentication (fill these in with your actual values)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# App Configuration
NODE_ENV=development
`;

        fs.writeFileSync(envPath, template);
        console.log(
          "✅ Created .env.local file. Please update it with your actual values."
        );
      } else {
        console.log(
          "⚠️ .env.local file exists but MONGODB_URI is not defined or not loaded."
        );
        console.log(
          "Please check your .env.local file and make sure MONGODB_URI is properly set."
        );
      }
    } catch (error) {
      console.error("❌ Error creating .env.local file:", error.message);
    }
  } else {
    console.log("✅ Environment variables are properly set.");
  }
}

// Run main function
async function main() {
  console.log("=== TopDial Database Setup & Diagnostic Tool ===\n");

  // Check and setup environment file if needed
  await setupEnvironmentFile();

  // Test database connection
  console.log("\nTesting database connection...");
  const isConnected = await checkDatabaseConnection();

  console.log("\n=== Summary ===");
  if (isConnected) {
    console.log("✅ Database connection is working properly.");
  } else {
    console.log(
      "❌ Database connection failed. Please check your configuration."
    );
    console.log("Suggestions:");
    console.log("1. Make sure MongoDB is running");
    console.log("2. Check MONGODB_URI in your .env.local file");
    console.log(
      "3. Try using a MongoDB Atlas connection string if your local connection fails"
    );
    console.log("4. For development, you can use a local MongoDB instance:");
    console.log(
      "   - Install MongoDB: https://www.mongodb.com/try/download/community"
    );
    console.log(
      "   - Start MongoDB locally and set MONGODB_URI=mongodb://localhost:27017/topdial_dev"
    );
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Setup script error:", error);
  process.exit(1);
});
