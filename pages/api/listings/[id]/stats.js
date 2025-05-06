import { connectDB } from "../../../../lib/db";
import Listing from "../../../../models/Listing";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Listing ID is required",
    });
  }

  try {
    await connectDB();

    // Fetch listing with views and inquiries
    const listing = await Listing.findById(id).select("views inquiries");

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: "Listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      views: listing.views || 0,
      inquiries: listing.inquiries || 0,
    });
  } catch (error) {
    console.error("Error fetching listing stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch listing stats",
    });
  }
}
