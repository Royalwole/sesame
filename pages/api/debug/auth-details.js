import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";

export default async function handler(req, res) {
  try {
    // Get auth data
    console.log("AUTH DEBUG: Request headers", {
      authorization: req.headers.authorization ? "Present" : "Missing",
      cookie: req.headers.cookie ? "Present" : "Missing",
    });

    const auth = getAuth(req);
    console.log("AUTH DEBUG: Auth object from Clerk", auth);

    const { userId, sessionId } = auth || {};
    // Avoid using the deprecated session property

    let dbUser = null;

    // If we have a userId, try to find the user in the database
    if (userId) {
      try {
        await connectDB();
        dbUser = await User.findOne({ clerkId: userId }).lean();
      } catch (dbError) {
        console.error("Database error during auth check:", dbError);
      } finally {
        await disconnectDB();
      }
    }

    // Return detailed auth status for debugging
    return res.status(200).json({
      authenticated: !!userId,
      userId,
      sessionId,
      // Avoid using session data directly
      cookies: req.cookies || {},
      headers: {
        authorization: req.headers.authorization ? "Present" : "Missing",
        cookie: req.headers.cookie ? "Present" : "Missing",
      },
      dbUser: dbUser
        ? {
            _id: dbUser._id.toString(),
            role: dbUser.role,
            approved: dbUser.approved,
            email: dbUser.email,
          }
        : null,
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return res.status(500).json({
      error: "Auth test failed",
      message: error.message,
      stack: error.stack,
    });
  }
}
