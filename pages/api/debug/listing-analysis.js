import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only endpoint" });
  }

  let dbConnection = false;

  try {
    await connectDB();
    dbConnection = true;

    // Get auth info if available
    const auth = getAuth(req);
    const clerkId = auth?.userId;

    // Find user if authenticated
    let user = null;
    if (clerkId) {
      user = await User.findOne({ clerkId }).lean();
    }

    // System analysis
    const analysis = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL === "1",
        blobConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
      database: {
        connected: true,
      },
      authentication: {
        authenticated: !!clerkId,
        userId: clerkId || null,
        userFound: !!user,
        isAgent: user?.role === "agent" && user?.approved,
        role: user?.role || "none",
      },
      listings: {
        count: await Listing.countDocuments(),
        schema: Object.keys(Listing.schema.paths),
        validationRules: Object.entries(Listing.schema.paths)
          .filter(([_, path]) => path.validators && path.validators.length > 0)
          .reduce((acc, [key, path]) => {
            acc[key] = path.validators.map((v) => ({
              type: v.type?.name || "custom",
              message: v.message,
            }));
            return acc;
          }, {}),
      },
    };

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Error in listing analysis:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
