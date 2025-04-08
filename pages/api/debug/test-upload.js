import { IncomingForm } from "formidable";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

// Configure API route to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// For development use only to test uploads
export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only endpoint" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = Date.now();
  const tempFiles = [];

  try {
    // Parse form
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Process image
    let uploadResults = [];

    if (files.image) {
      const file = Array.isArray(files.image) ? files.image[0] : files.image;

      if (file && file.filepath) {
        tempFiles.push(file.filepath);

        // Read file
        const fileBuffer = fs.readFileSync(file.filepath);

        // Upload to blob storage
        const blob = await put(
          `test/test-${Date.now()}.${path.extname(
            file.originalFilename || ".jpg"
          )}`,
          fileBuffer,
          {
            access: "public",
          }
        );

        uploadResults.push({
          success: true,
          originalName: file.originalFilename,
          size: file.size,
          url: blob.url,
          type: file.mimetype,
          uploadTime: Date.now() - startTime,
        });
      }
    }

    // Return status
    return res.status(200).json({
      success: true,
      message: "Test upload complete",
      duration: Date.now() - startTime,
      uploadResults,
    });
  } catch (error) {
    console.error("Test upload error:", error);
    return res.status(500).json({
      error: "Upload test failed",
      message: error.message,
    });
  } finally {
    // Clean up temp files
    for (const file of tempFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (e) {
        console.warn(`Cleanup error: ${e.message}`);
      }
    }
  }
}
