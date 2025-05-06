import { withAuth } from "../../../lib/withAuth";
import { connectDB } from "../../../lib/db";
import User from "../../../models/User";

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await connectDB();
      const userId = req.user._id;

      const user = await User.findById(userId).select("notifications");

      // Sort notifications by timestamp descending (most recent first)
      const notifications = (user?.notifications || []).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      return res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch notifications",
      });
    }
  }

  if (req.method === "POST") {
    // Mark notifications as read
    try {
      await connectDB();
      const userId = req.user._id;
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({
          success: false,
          error: "notificationIds must be an array",
        });
      }

      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "notifications.$[elem].read": true,
          },
        },
        {
          arrayFilters: [
            {
              "elem._id": { $in: notificationIds },
            },
          ],
        }
      );

      return res.status(200).json({
        success: true,
        message: "Notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update notifications",
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: "Method not allowed",
  });
}

export default withAuth({
  handler,
  role: "agent",
});
