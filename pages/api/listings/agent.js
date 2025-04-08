import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { withErrorHandling } from "../../../lib/api-utils";
import {
  sendSuccess,
  sendError,
  sendUnauthorized,
} from "../../../lib/api-response";
import { requireAgentAuth } from "../../../middlewares/authMiddleware";

const handler = async (req, res) => {
  if (req.method !== "GET") {
    return sendError(res, "Method not allowed", 405);
  }

  let dbConnection = false;

  try {
    // Get authenticated user
    const auth = getAuth(req);
    if (!auth?.userId) {
      return sendUnauthorized(res);
    }

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Get user from database
    const user = await User.findOne({ clerkId: auth.userId });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Fetch listings created by the agent
    const listings = await Listing.find({ createdBy: user._id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Get total count for pagination
    const total = await Listing.countDocuments({ createdBy: user._id });
    const pages = Math.ceil(total / limit);

    // Return listings and pagination info
    return sendSuccess(
      res,
      {
        listings,
        pagination: { total, page, limit, pages },
      },
      "Agent listings retrieved"
    );
  } catch (error) {
    console.error("Error in agent listings API:", error);
    return sendServerError(res, error.message);
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
};

export default requireAgentAuth(handler);
