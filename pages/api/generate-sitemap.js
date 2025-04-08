import { connectDB, disconnectDB } from "../../lib/db";
import Listing from "../../models/Listing";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  // Only allow this in development mode or with a special API key
  const apiKey = req.headers["x-api-key"];
  if (
    process.env.NODE_ENV !== "development" &&
    apiKey !== process.env.SITEMAP_API_KEY
  ) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  let dbConnection = false;

  try {
    await connectDB();
    dbConnection = true;

    // Get all published listings
    const listings = await Listing.find({ status: "published" })
      .select("_id updatedAt")
      .lean();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://topdial.com";

    // Static pages
    const staticPages = [
      "",
      "/listings",
      "/about",
      "/contact",
      "/auth/sign-in",
      "/auth/sign-up",
    ];

    // Create XML
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    staticPages.forEach((page) => {
      xmlContent += `  <url>
    <loc>${siteUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>
`;
    });

    // Add dynamic listing pages
    listings.forEach((listing) => {
      xmlContent += `  <url>
    <loc>${siteUrl}/listings/${listing._id}</loc>
    <lastmod>${new Date(listing.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    });

    // Close XML
    xmlContent += `</urlset>`;

    // Write to file
    const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
    fs.writeFileSync(sitemapPath, xmlContent);

    res.status(200).json({ success: true, count: listings.length });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
