import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let dbConnection = false;

  try {
    // Get authentication info from Clerk
    const auth = getAuth(req);

    // Return basic auth info even if not authenticated
    if (!auth?.userId) {
      return res.status(200).json({
        success: true,
        isAuthenticated: false,
        clerk: { userId: null },
        database: { connected: false, user: null },
      });
    }

    // Try to connect to database
    try {
      await connectDB();
      dbConnection = true;

      // Find user in database
      const user = await User.findOne({ clerkId: auth.userId }).lean();

      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        clerk: { userId: auth.userId },
        database: {
          connected: true,
          userFound: !!user,
          user: user
            ? {
                _id: user._id,
                clerkId: user.clerkId,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
              }
            : null,
        },
      });
    } catch (dbError) {
      console.error("Database error in auth status check:", dbError);
      return res.status(200).json({
        success: true,
        isAuthenticated: true,
        clerk: { userId: auth.userId },
        database: {
          connected: false,
          error: dbError.message,
          user: null,
        },
      });
    }
  } catch (error) {
    console.error("Auth status check error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}

// Debug endpoint to check auth status
export function debugHandler(req, res) {
  const { userId, sessionId, session } = getAuth(req);

  res.status(200).json({
    authenticated: !!userId,
    userId,
    sessionId,
    sessionClaims: session?.claims || null,
    headers: {
      authorization: req.headers.authorization ? "Present" : "Missing",
      cookie: req.headers.cookie ? "Present" : "Missing",
    },
  });
}
