/**
 * Simple API endpoint to verify API functionality and response time
 * Use this to diagnose if server is running properly
 */
export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    const isVercel = process.env.VERCEL === "1";
    const region = process.env.VERCEL_REGION || "unknown";

    res.status(200).json({
      status: "ok",
      environment: process.env.NODE_ENV,
      platform: isVercel ? "Vercel" : "Other",
      region: isVercel ? region : null,
      time: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error",
      message: error.message,
      responseTime: Date.now() - startTime,
    });
  }
}
