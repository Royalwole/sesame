import { connectDB, disconnectDB } from "../../../../lib/db";
import Listing from "../../../../models/Listing";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing listing ID" });
  }

  try {
    await connectDB();

    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.status(200).json(listing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return res.status(500).json({
      error: "Failed to fetch listing",
      message: error.message,
    });
  } finally {
    await disconnectDB();
  }
}
