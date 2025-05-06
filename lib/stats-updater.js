import { connectDB } from "./db";
import Listing from "../models/Listing";
import User from "../models/User";

/**
 * Updates both listing and agent stats when a view or inquiry occurs
 */
export async function updateStats(type, listingId, data = {}) {
  const session = await connectDB().startSession();

  try {
    await session.withTransaction(async () => {
      // Get the listing and its agent
      const listing = await Listing.findById(listingId);
      if (!listing) {
        throw new Error("Listing not found");
      }

      // Update listing stats based on type
      switch (type) {
        case "view":
          listing.views = (listing.views || 0) + 1;
          break;
        case "inquiry":
          listing.inquiries = (listing.inquiries || 0) + 1;
          if (data.messageId) {
            listing.inquiryMessages.push(data.messageId);
          }
          break;
        default:
          throw new Error("Invalid stats update type");
      }

      await listing.save({ session });

      // Update agent's aggregate stats
      if (listing.agent) {
        const updateQuery = {
          $inc: {
            [`agentStats.total${type === "view" ? "Views" : "Inquiries"}`]: 1,
          },
          $set: {
            "agentStats.lastUpdated": new Date(),
          },
        };

        await User.findByIdAndUpdate(listing.agent, updateQuery, { session });
      }
    });

    return true;
  } catch (error) {
    console.error("Error updating stats:", error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Updates agent's overall stats (to be used periodically or on-demand)
 */
export async function refreshAgentStats(agentId) {
  try {
    const [aggregateStats] = await Listing.aggregate([
      { $match: { agent: agentId } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalInquiries: { $sum: "$inquiries" },
        },
      },
    ]);

    if (!aggregateStats) {
      return false;
    }

    await User.findByIdAndUpdate(agentId, {
      $set: {
        agentStats: {
          ...aggregateStats,
          lastUpdated: new Date(),
        },
      },
    });

    return true;
  } catch (error) {
    console.error("Error refreshing agent stats:", error);
    throw error;
  }
}
