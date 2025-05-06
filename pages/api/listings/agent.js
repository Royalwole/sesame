import { withAuth } from "../../../lib/withAuth";
import { connectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();

    // Get the agent's ID from the authenticated user
    const agentId = req.user._id;

    // Fetch all listings for this agent
    const listings = await Listing.find({
      agent: agentId,
    }).sort({ createdAt: -1 }); // Most recent first

    // Return the listings and let the frontend calculate stats
    return res.status(200).json({
      success: true,
      listings,
    });
  } catch (error) {
    console.error("Error fetching agent listings:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch listings",
    });
  }
}

// Export with auth middleware that requires agent role
export default withAuth({
  handler,
  role: "agent",
});
