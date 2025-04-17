import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate the user
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Parse the multipart form data
    const form = formidable({ multiples: true });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file[0];
    const folder = fields.folder?.[0] || "uploads";

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate a unique path for the file
    const userId = auth.userId;
    const timestamp = Date.now();
    const fileExt = file.originalFilename.split(".").pop();
    const filePath = `${folder}/${userId}/${timestamp}-${file.newFilename}.${fileExt}`;

    // Read the file content
    const content = await fs.promises.readFile(file.filepath);

    // Upload to Vercel Blob
    const { url, pathname } = await put(filePath, content, {
      access: "public",
      contentType: file.mimetype,
    });

    // Return success response
    return res.status(200).json({
      success: true,
      url,
      pathname,
      filename: file.originalFilename,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (error) {
    console.error("Blob upload error:", error);
    return res.status(500).json({ error: "Upload failed: " + error.message });
  }
}
