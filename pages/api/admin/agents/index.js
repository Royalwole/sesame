import { connectDB, disconnectDB } from "../../../../lib/db";
import User from "../../../../models/User";
import { requireAdmin } from "../../../../middlewares/authMiddleware";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    // Find pending agent applications
    const pendingAgents = await User.find({
      role: "agent",
      approved: false,
    }).sort({ "agentDetails.applicationDate": -1 });

    // Find approved agents
    const approvedAgents = await User.find({
      role: "agent",
      approved: true,
    }).sort({ lastName: 1, firstName: 1 });

    return res.status(200).json({
      pendingAgents,
      approvedAgents,
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return res.status(500).json({
      error: "Failed to fetch agents",
      message: error.message,
    });
  } finally {
    await disconnectDB();
  }
}

export default requireAdmin(handler);
