import { connectDB, disconnectDB } from "../../../lib/db";
import { checkBlobConnection, uploadToBlob } from "../../../lib/blob";

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Test API endpoint for storage systems
 * Tests both MongoDB and Vercel Blob connectivity
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      success: true,
      tests: [
        {
          name: "MongoDB Connection",
          description: "Tests connectivity to the MongoDB database",
          endpoint: "/api/test/storage",
          method: "POST",
          params: { test: "db" },
        },
        {
          name: "Vercel Blob Test",
          description: "Tests connectivity to Vercel Blob storage",
          endpoint: "/api/test/storage",
          method: "POST",
          params: { test: "blob" },
        },
      ],
    });
  }

  // Get test parameter
  const testType = req.query.test || "all";
  const results = {};

  try {
    // Test MongoDB connection if requested
    if (testType === "db" || testType === "all") {
      try {
        console.log("[STORAGE TEST] Testing MongoDB connection...");
        const startTime = Date.now();
        const connection = await connectDB();
        const pingResult = await connection.connection.db.admin().ping();
        const elapsedTime = Date.now() - startTime;

        results.mongodb = {
          success: pingResult?.ok === 1,
          latency: elapsedTime,
          status: "connected",
          collections: await connection.connection.db
            .listCollections()
            .toArray()
            .then((cols) => cols.map((c) => c.name)),
        };

        if (testType === "db") {
          // Only disconnect if we're only testing DB
          await disconnectDB();
        }
      } catch (dbError) {
        results.mongodb = {
          success: false,
          error: dbError.message,
          status: "error",
        };
      }
    }

    // Test Vercel Blob connection if requested
    if (testType === "blob" || testType === "all") {
      try {
        console.log("[STORAGE TEST] Testing Vercel Blob connection...");
        const blobStatus = await checkBlobConnection();

        results.blob = {
          success: blobStatus.isConnected,
          status: blobStatus.status,
          message: blobStatus.message,
          isConfigured: blobStatus.status !== "not-configured",
        };
      } catch (blobError) {
        results.blob = {
          success: false,
          error: blobError.message,
          status: "error",
        };
      }
    }

    // Clean up
    if (testType === "all" && results.mongodb?.success) {
      await disconnectDB();
    }

    // Return results
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[STORAGE TEST] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
