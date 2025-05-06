import { connectDB } from "../db";
import User from "../../models/User";

const MILESTONE_KEY = "lastMilestoneStats";

export async function checkMilestones(userId, currentStats) {
  try {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) return null;

    // Get last recorded stats
    const lastStats = user[MILESTONE_KEY] || {
      views: 0,
      inquiries: 0,
      activeListings: 0,
    };

    // Define milestone thresholds
    const milestones = {
      views: [100, 500, 1000, 5000, 10000],
      inquiries: [10, 50, 100, 500, 1000],
      activeListings: [5, 10, 25, 50, 100],
    };

    const achievedMilestones = [];

    // Check each stat type for milestones
    Object.entries(milestones).forEach(([type, thresholds]) => {
      const currentValue = currentStats[type] || 0;
      const lastValue = lastStats[type] || 0;

      // Find milestones achieved since last check
      thresholds.forEach((threshold) => {
        if (currentValue >= threshold && lastValue < threshold) {
          achievedMilestones.push({
            type,
            value: threshold,
            timestamp: new Date(),
          });
        }
      });
    });

    if (achievedMilestones.length > 0) {
      // Update last milestone stats
      await User.findByIdAndUpdate(userId, {
        [MILESTONE_KEY]: currentStats,
        $push: {
          notifications: {
            $each: achievedMilestones.map((milestone) => ({
              type: "milestone",
              message: `Congratulations! You've reached ${milestone.value} ${milestone.type}!`,
              timestamp: milestone.timestamp,
            })),
          },
        },
      });
    }

    return achievedMilestones;
  } catch (error) {
    console.error("Error checking milestones:", error);
    return null;
  }
}
