import { IncomingForm } from "formidable";
import { uploadMultipleImages } from "../../../lib/uploadImage";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true,
    });

    // Parse the form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Get the folder from fields or use default
    const folder = fields.folder?.[0] || "listings";

    // Convert files to array if single file
    const fileArray = Array.isArray(files.images)
      ? files.images
      : [files.images];

    // Upload images to Firebase Storage
    const result = await uploadMultipleImages(fileArray, { folder });

    if (!result.success) {
      throw new Error(result.errors[0] || "Upload failed");
    }

    return res.status(200).json({
      success: true,
      images: result.results,
      totalUploaded: result.totalUploaded,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
