import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import {
  sendSuccess,
  sendError,
  sendServerError,
  sendUnauthorized,
} from "../../../lib/api-response";
import { requireAuth } from "../../../middlewares/authMiddleware";

const handler = async (req, res) => {
  // Only allow GET and PATCH
  if (req.method !== "GET" && req.method !== "PATCH") {
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

    // Find the user
    const user = await User.findOne({ clerkId: auth.userId });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // GET request - return user profile
    if (req.method === "GET") {
      return sendSuccess(res, { user }, "User profile retrieved");
    }

    // PATCH request - update user profile
    if (req.method === "PATCH") {
      // Destructure only the fields we allow to be updated
      const { firstName, lastName, phone, bio } = req.body;

      // Update user fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.phone = phone || user.phone;
      user.bio = bio || user.bio;

      await user.save();

      return sendSuccess(res, { user }, "User profile updated");
    }
  } catch (error) {
    console.error("Error in profile API:", error);
    return sendServerError(res, error.message);
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
};

export default requireAuth(handler);
