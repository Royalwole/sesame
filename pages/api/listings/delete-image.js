import { deleteFromStorage } from "../../../lib/storage";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: "Image path is required" });
    }

    const result = await deleteFromStorage(path);

    if (!result.success) {
      throw new Error(result.error || "Failed to delete image");
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Image deletion error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
