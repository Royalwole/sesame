import { connectDB, disconnectDB } from "../../../../../lib/db";
import User from "../../../../../models/User";
import { requireAdmin } from "../../../../../middlewares/authMiddleware";
import { clerkClient } from "@clerk/nextjs/server";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Agent ID is required" });
  }

  try {
    await connectDB();

    // Find the agent
    const agent = await User.findById(id);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (agent.role !== "agent") {
      return res.status(400).json({ error: "User is not an agent" });
    }

    if (agent.approved) {
      return res.status(400).json({ error: "Agent is already approved" });
    }

    // Update the approval status
    agent.approved = true;
    agent.agentDetails.approvalDate = new Date();
    await agent.save();

    // Also update Clerk user metadata
    await clerkClient.users.updateUser(agent.clerkId, {
      publicMetadata: {
        role: "agent",
        approved: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Agent approved successfully",
      agent: {
        id: agent._id,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        approved: agent.approved,
      },
    });
  } catch (error) {
    console.error("Error approving agent:", error);
    return res.status(500).json({
      error: "Failed to approve agent",
      message: error.message,
    });
  } finally {
    await disconnectDB();
  }
}

export default requireAdmin(handler);
