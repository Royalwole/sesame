import { updateStats } from "../../../lib/stats-updater";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { listingId } = req.body;

  if (!listingId) {
    return res.status(400).json({
      success: false,
      error: "Listing ID is required",
    });
  }

  try {
    await updateStats("view", listingId);

    return res.status(200).json({
      success: true,
      message: "View tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking listing view:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to track view",
    });
  }
}
