import { connectDB } from "../db";
import { checkMilestones } from "./milestone-tracker";
import { sendMilestoneEmail } from "./email-notifications";
import User from "../../models/User";

export async function updateAgentStats(userId, newStats) {
  try {
    await connectDB();

    // Get user and update their stats
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update agent stats
    user.agentStats = {
      ...newStats,
      lastUpdated: new Date(),
    };

    // Check for milestone achievements
    const achievedMilestones = await checkMilestones(userId, {
      views: newStats.totalViews,
      inquiries: newStats.totalInquiries,
      activeListings: newStats.totalListings,
    });

    // If milestones were achieved, send email notification
    if (achievedMilestones && achievedMilestones.length > 0) {
      await sendMilestoneEmail(user, achievedMilestones);
    }

    // Save updates
    await user.save();

    return {
      success: true,
      stats: user.agentStats,
      milestones: achievedMilestones,
    };
  } catch (error) {
    console.error("Error updating agent stats:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getAgentStats(userId) {
  try {
    await connectDB();
    const user = await User.findById(userId).select("agentStats notifications");

    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      stats: user.agentStats,
      unreadNotifications:
        user.notifications?.filter((n) => !n.read).length || 0,
    };
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
