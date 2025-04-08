import { connectDB, disconnectDB } from "../../../lib/db";
import { requireAdmin } from "../../../middlewares/authMiddleware";
import User from "../../../models/User";
import Listing from "../../../models/Listing";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    const { type, id, reason } = req.body;

    if (!type || !id) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "Type and ID are required",
      });
    }

    // Handle user suspension
    if (type === "user") {
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Cannot suspend admin accounts
      if (user.role === "admin") {
        return res.status(403).json({ error: "Cannot suspend admin accounts" });
      }

      if (user.suspended) {
        return res.status(400).json({ error: "User is already suspended" });
      }

      // Suspend user
      user.suspended = true;
      user.suspensionReason = reason || "No reason provided";
      await user.save();

      return res.status(200).json({ message: "User suspended successfully" });
    }

    // Handle listing suspension
    else if (type === "listing") {
      const listing = await Listing.findById(id);

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      if (listing.status === "suspended") {
        return res.status(400).json({ error: "Listing is already suspended" });
      }

      // Suspend listing
      listing.status = "suspended";
      listing.suspensionReason = reason || "No reason provided";
      await listing.save();

      return res
        .status(200)
        .json({ message: "Listing suspended successfully" });
    } else {
      return res
        .status(400)
        .json({
          error: "Invalid type",
          details: 'Type must be "user" or "listing"',
        });
    }
  } catch (error) {
    console.error("Error suspending item:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  } finally {
    await disconnectDB();
  }
};

export default requireAdmin(handler);
