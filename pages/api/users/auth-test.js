import { getAuth } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";

export default async function handler(req, res) {
  // Log every header except sensitive data
  console.log(
    "Headers:",
    Object.keys(req.headers).reduce((acc, key) => {
      if (
        !key.includes("secret") &&
        !key.includes("auth") &&
        !key.includes("cookie")
      ) {
        acc[key] = req.headers[key];
      } else {
        acc[key] = "[REDACTED]";
      }
      return acc;
    }, {})
  );

  // Get auth information
  let authData = null;
  try {
    const auth = getAuth(req);
    authData = {
      userId: auth?.userId,
      sessionId: auth?.sessionId,
      // Avoid direct reference to deprecated session property
      hasSession: !!auth?.sessionId,
    };
    console.log("Auth data:", authData);
  } catch (authError) {
    console.error("Error retrieving auth data:", authError);
    return res.status(401).json({
      error: "Authentication failed",
      message: authError.message,
      suggestion: "Make sure you're signed in and cookies are enabled",
    });
  }

  // Try to get user from database
  let user = null;
  try {
    if (authData?.userId) {
      await connectDB();
      user = await User.findOne({ clerkId: authData.userId });
      console.log("User found:", user ? "Yes" : "No");
    }
  } catch (dbError) {
    console.error("Database error:", dbError);
  } finally {
    await disconnectDB();
  }

  return res.status(200).json({
    success: true,
    authData,
    user: user
      ? {
          id: user._id.toString(),
          role: user.role,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        }
      : null,
    message: "This endpoint can be used to test authentication",
  });
}
