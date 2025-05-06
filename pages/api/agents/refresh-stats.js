import { withAuth } from "../../../lib/withAuth";
import { refreshAllAgentStats } from "../../../lib/tasks/refresh-stats";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const result = await refreshAllAgentStats();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error refreshing stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to refresh stats",
    });
  }
}

// Only allow admin users to trigger manual refresh
export default withAuth({
  handler,
  role: "admin",
});
