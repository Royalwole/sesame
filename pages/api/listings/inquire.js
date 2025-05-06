import { connectDB } from "../../../lib/db";
import Message from "../../../models/Message";
import { updateStats } from "../../../lib/stats-updater";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { listingId, name, email, phone, message } = req.body;

  if (!listingId || !email || !message) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  try {
    await connectDB();

    // Create the inquiry message
    const newMessage = await Message.create({
      listing: listingId,
      name,
      email,
      phone,
      message,
      type: "inquiry",
    });

    // Update stats with the new message ID
    await updateStats("inquiry", listingId, { messageId: newMessage._id });

    return res.status(200).json({
      success: true,
      message: "Inquiry sent successfully",
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send inquiry",
    });
  }
}
