import { storage } from "../../../lib/firebase-config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import formidable from "formidable";
import { createReadStream, readFileSync } from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    // If no Firebase Storage bucket, fail fast
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      return res.status(500).json({
        error:
          "Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable",
      });
    }

    console.log("🔵 Testing Firebase Storage Upload");

    if (req.method === "GET") {
      // Just test the configuration without uploading
      return res.status(200).json({
        success: true,
        message: "Firebase Storage configured correctly",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
          ? "Present"
          : "Missing",
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

    console.log("🔵 Uploading to Firebase Storage...");

    try {
      // Read the file content into a buffer
      const fileBuffer = readFileSync(imageFile.filepath);

      // Create a storage reference with the file name
      const storageRef = ref(storage, `test/${imageFile.originalFilename}`);

      // Upload the file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, fileBuffer, {
        contentType: imageFile.mimetype,
      });

      // Get the download URL
      const url = await getDownloadURL(snapshot.ref);

      console.log("✅ Upload successful:", {
        url,
        path: `test/${imageFile.originalFilename}`,
      });

      return res.status(200).json({
        success: true,
        message: "Test upload successful",
        url: url,
        path: `test/${imageFile.originalFilename}`,
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
