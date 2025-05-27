import { getPublicListings } from "../../../lib/listing-api";

export default async function handler(req, res) {
  try {
    console.log("Debug SSR: Starting getPublicListings call...");

    const result = await getPublicListings({}, 1, 12);

    console.log("Debug SSR: getPublicListings result:", {
      success: result.success,
      listingsCount: result.listings?.length || 0,
      firstListing: result.listings?.[0]?.title || "No listings",
    });

    res.status(200).json({
      success: true,
      message: "Server-side listings fetch test",
      result: {
        listingsCount: result.listings?.length || 0,
        firstListing: result.listings?.[0]?.title || "No listings",
        hasListings:
          Array.isArray(result.listings) && result.listings.length > 0,
        pagination: result.pagination,
        fullResult: result,
      },
    });
  } catch (error) {
    console.error("Debug SSR error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
