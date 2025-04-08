import { put } from "@vercel/blob";
import formidable from "formidable";
import { createReadStream } from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    // If no BLOB token, fail fast
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: "Missing BLOB_READ_WRITE_TOKEN environment variable",
      });
    }

    console.log("🔵 Testing Vercel Blob Upload");

    if (req.method === "GET") {
      // Just test the configuration without uploading
      return res.status(200).json({
        success: true,
        message: "Vercel Blob configured correctly",
        blobToken: process.env.BLOB_READ_WRITE_TOKEN ? "Present" : "Missing",
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("🔵 Parsing form data");

    const form = new formidable.IncomingForm({
      keepExtensions: true,
    });

    const [_fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("❌ Form parsing error:", err);
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    if (!files.testImage) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imageFile = files.testImage;
    console.log("📋 Image file details:", {
      name: imageFile.originalFilename,
      size: imageFile.size,
      type: imageFile.mimetype,
      path: imageFile.filepath,
    });

    console.log("🔵 Uploading to Vercel Blob...");

    try {
      const stream = createReadStream(imageFile.filepath);
      const blob = await put(`test/${imageFile.originalFilename}`, stream, {
        access: "public",
        contentType: imageFile.mimetype,
      });

      console.log("✅ Upload successful:", blob);

      return res.status(200).json({
        success: true,
        message: "Test upload successful",
        url: blob.url,
      });
    } catch (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return res.status(500).json({
        success: false,
        error: "Upload failed",
        details: uploadError.message,
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
}
