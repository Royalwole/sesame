import {
  cleanupOrphanedImages,
  verifyImageRecords,
} from "../../../lib/image-cleanup";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Add basic security - require maintenance key
  const maintenanceKey = req.headers["x-maintenance-key"];
  if (maintenanceKey !== process.env.MAINTENANCE_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { task } = req.body;

    if (task === "cleanup") {
      const result = await cleanupOrphanedImages();
      return res.status(200).json(result);
    }

    if (task === "verify") {
      const result = await verifyImageRecords();
      return res.status(200).json(result);
    }

    if (task === "full") {
      const cleanupResult = await cleanupOrphanedImages();
      const verifyResult = await verifyImageRecords();

      return res.status(200).json({
        success: cleanupResult.success && verifyResult.success,
        cleanup: cleanupResult,
        verify: verifyResult,
      });
    }

    return res.status(400).json({
      error: 'Invalid task. Use "cleanup", "verify", or "full"',
    });
  } catch (error) {
    console.error("Maintenance task error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
