import ListingDebugger from "../../../lib/listing-debugger";

export default async function handler(req, res) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only endpoint" });
  }

  // Return the current logs
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      logs: ListingDebugger.getLogs(),
      count: ListingDebugger.getLogs().length,
    });
  }

  // Clear the logs
  if (req.method === "DELETE") {
    ListingDebugger.clearLogs();
    return res.status(200).json({
      success: true,
      message: "Logs cleared",
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
