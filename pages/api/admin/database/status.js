import { withAuth } from "../../../../lib/withAuth";
import { connectToDatabase } from "../../../../lib/db";
import mongoose from "mongoose";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const client = db.client;

    // Get database stats
    const stats = await db.stats();

    // Get collection counts
    const collections = {};
    const collectionsList = await db.listCollections().toArray();

    for (const collection of collectionsList) {
      collections[collection.name] = await db
        .collection(collection.name)
        .countDocuments();
    }

    // Get connection stats
    const serverStatus = await db.command({ serverStatus: 1 });

    const status = {
      isConnected: mongoose.connection.readyState === 1,
      lastSync: new Date().toISOString(),
      collections,
      performance: {
        avgResponseTime: serverStatus.opcounters
          ? Math.round(
              (serverStatus.opcounters.query / serverStatus.uptime) * 1000
            )
          : null,
        activeConnections: serverStatus.connections
          ? serverStatus.connections.current
          : 0,
      },
    };

    res.status(200).json(status);
  } catch (error) {
    console.error("Database status error:", error);
    res.status(500).json({ error: "Failed to fetch database status" });
  }
}

export default withAuth(handler, { role: "admin" });
