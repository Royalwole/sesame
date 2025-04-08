import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  try {
    // Get auth data
    const auth = getAuth(req);
    const { userId, sessionId } = auth;

    // Return auth status
    return res.status(200).json({
      authenticated: !!userId,
      userId,
      sessionId,
      headers: {
        authorization: req.headers.authorization ? "Present" : "Missing",
        cookie: req.headers.cookie ? "Present" : "Missing",
      },
    });
  } catch (error) {
    console.error("Auth test error:", error);
    return res.status(500).json({
      error: "Auth test failed",
      message: error.message,
    });
  }
}
