import { connectDB } from "../db";
import User from "../../models/User";
import { refreshAgentStats } from "../stats-updater";

export async function refreshAllAgentStats() {
  try {
    await connectDB();

    // Find all agents
    const agents = await User.find({
      role: "agent",
      "agentDetails.approved": true,
    }).select("_id");

    // Process each agent's stats
    const results = await Promise.all(
      agents.map((agent) => refreshAgentStats(agent._id))
    );

    const successCount = results.filter(Boolean).length;

    console.log(
      `Stats refresh completed. Updated ${successCount}/${agents.length} agents`
    );

    return {
      success: true,
      total: agents.length,
      updated: successCount,
    };
  } catch (error) {
    console.error("Error refreshing agent stats:", error);
    throw error;
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  refreshAllAgentStats()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Stats refresh failed:", error);
      process.exit(1);
    });
}
