import { getSession } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import Listing from "../../../models/Listing";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const requestId = `agent_listings_${Math.random()
    .toString(36)
    .substring(2, 10)}`;
  let dbConnection = false;

  try {
    const session = await getSession({ req });
    if (!session) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Find user by Clerk ID
    const user = await User.findOne({ clerkId: session.user.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found",
        details: "Please sync your profile first",
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    // Get listings count
    const total = await Listing.countDocuments({ agentId: user._id });

    // Fetch listings with explicit filter on agent ID
    const listings = await Listing.find({ agentId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(
      `[${requestId}] Found ${listings.length} listings for agent ${user._id}`
    );

    // Disable caching
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({
      success: true,
      listings,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent listings",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
