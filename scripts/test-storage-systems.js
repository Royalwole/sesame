/**
 * Test script to verify storage system communication
 * Tests connectivity and operations for both MongoDB and Firebase Storage
 *
 * Run with: node scripts/test-storage-systems.js
 */

// Use dynamic import to support top-level await
(async () => {
  try {
    console.log("\n================================================");
    console.log("TopDial Storage Systems Communication Test");
    console.log("================================================\n");

    console.log("Loading dependencies...");
    const { connectDB, disconnectDB, checkDBConnection, getConnectionStatus } =
      await import("../lib/db.js");
    const { uploadToBlob, deleteFromBlob, checkBlobConnection } = await import(
      "../lib/blob.js"
    );
    const { getFirebaseStatus } = await import("../lib/firebase-config.js");
    const mongoose = (await import("mongoose")).default;
    const fs = (await import("fs")).promises;
    const path = (await import("path")).default;

    // Create test data
    console.log("\nPreparing test data...");
    const tempDir = path.join(process.cwd(), "temp");
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (err) {
      // Ignore if directory exists
    }

    const testFilePath = path.join(tempDir, "test-file.txt");
    const testContent = `Test file created at ${new Date().toISOString()}`;
    await fs.writeFile(testFilePath, testContent);
    console.log("✅ Test file created");

    // Test MongoDB Connection
    console.log("\n----- MongoDB Connection Test -----");
    let dbSuccess = false;

    try {
      console.log("Connecting to MongoDB...");
      const startTime = Date.now();
      await connectDB();
      const connectionTime = Date.now() - startTime;
      console.log(`✅ Connected successfully in ${connectionTime}ms`);
      dbSuccess = true;

      // Get connection details
      const status = getConnectionStatus();
      console.log("\nConnection Details:");
      console.log(
        `- Connection state: ${["Disconnected", "Connected", "Connecting", "Disconnecting"][status.readyState]}`
      );
      console.log(`- Database name: ${status.database}`);
      console.log(`- Host: ${status.host}`);

      // Test basic database operation
      console.log("\nTesting database read operation...");
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      console.log(
        `✅ Read operation successful. Found ${collections.length} collections`
      );
      console.log(
        `- Collections: ${collections
          .map((c) => c.name)
          .slice(0, 5)
          .join(", ")}${collections.length > 5 ? "..." : ""}`
      );
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      if (error.name === "MongoServerSelectionError") {
        console.error("\nPossible reasons:");
        console.error("1. MongoDB server is not running");
        console.error("2. Connection string is incorrect");
        console.error("3. Network issue preventing connection");
        console.error("4. Authentication failed");
      }
    }

    // Test Firebase Storage
    console.log("\n----- Firebase Storage Test -----");
    let firebaseSuccess = false;
    let uploadedFilePath = null;

    try {
      console.log("Checking Firebase configuration...");
      const firebaseStatus = getFirebaseStatus();

      if (!firebaseStatus.isInitialized) {
        console.error(
          "❌ Firebase is not properly initialized:",
          firebaseStatus.error
        );
        console.log("\nConfiguration Status:");
        Object.entries(firebaseStatus.config).forEach(([key, value]) => {
          console.log(`- ${key}: ${value ? "✓" : "✗"}`);
        });
      } else {
        console.log("✅ Firebase initialized successfully");

        // Check connectivity
        console.log("\nTesting Firebase Storage connection...");
        const connectionStatus = await checkBlobConnection();

        if (connectionStatus.isConnected) {
          console.log(
            `✅ Firebase Storage connected (${connectionStatus.status})`
          );
          firebaseSuccess = true;

          // Test file upload
          console.log("\nTesting Firebase Storage upload...");
          const fileBuffer = await fs.readFile(testFilePath);
          const fileStat = await fs.stat(testFilePath);

          const file = {
            buffer: fileBuffer,
            name: "test-upload.txt",
            type: "text/plain",
            size: fileStat.size,
          };

          const uploadResult = await uploadToBlob(file, "test-upload.txt", {
            folder: "test",
            metadata: {
              createdBy: "test-script",
              purpose: "connectivity-test",
            },
          });

          if (uploadResult.success) {
            console.log("✅ File upload successful");
            console.log(`- File URL: ${uploadResult.url}`);
            console.log(`- File path: ${uploadResult.path}`);
            uploadedFilePath = uploadResult.path;

            // Test file delete
            if (uploadedFilePath) {
              console.log("\nTesting Firebase Storage delete...");
              const deleteResult = await deleteFromBlob(uploadedFilePath);

              if (deleteResult.success) {
                console.log("✅ File deletion successful");
              } else {
                console.error(`❌ File deletion failed: ${deleteResult.error}`);
              }
            }
          } else {
            console.error(`❌ File upload failed: ${uploadResult.error}`);
          }
        } else {
          console.error(
            `❌ Firebase Storage connection failed: ${connectionStatus.message}`
          );
          if (connectionStatus.error) {
            console.error(
              `  Error: ${connectionStatus.error.code} - ${connectionStatus.error.message}`
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Firebase Storage test failed:", error.message);
    }

    // Clean up
    console.log("\n----- Cleaning Up -----");

    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      try {
        console.log("Closing MongoDB connection...");
        await disconnectDB();
        console.log("✅ MongoDB connection closed");
      } catch (err) {
        console.error("❌ Error closing MongoDB connection:", err.message);
      }
    }

    // Clean up test file
    try {
      await fs.unlink(testFilePath);
      console.log("✅ Test file deleted");
    } catch (err) {
      console.error("❌ Error deleting test file:", err.message);
    }

    // Summary
    console.log("\n================================================");
    console.log("Test Summary");
    console.log("================================================");
    console.log(`MongoDB: ${dbSuccess ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Firebase: ${firebaseSuccess ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(
      `Overall Status: ${dbSuccess && firebaseSuccess ? "✅ ALL SYSTEMS OPERATIONAL" : "❌ SOME SYSTEMS FAILING"}`
    );
    console.log(
      "\nIf any tests failed, check your environment configuration and network connectivity."
    );

    // Exit with appropriate code
    process.exit(dbSuccess && firebaseSuccess ? 0 : 1);
  } catch (error) {
    console.error("\n❌ An unexpected error occurred:");
    console.error(error);
    process.exit(1);
  }
})();
