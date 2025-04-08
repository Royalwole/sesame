import formidable from "formidable";
import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure API route to handle file uploads
export const config = {
  api: {
    bodyParser: false,
    // Increase size limit for large images
    responseLimit: "50mb",
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  let dbConnection = false;

  try {
    // Get authenticated user
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication required" });
    }

    // Parse form data with robust error handling
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      multiples: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Find user in database
    const user = await User.findOne({ clerkId: auth.userId });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Process uploaded images
    let images = [];
    if (files.images) {
      const imageFiles = Array.isArray(files.images)
        ? files.images
        : [files.images];
      console.log(`Processing ${imageFiles.length} uploaded images`);

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Process each image file
      for (const file of imageFiles) {
        try {
          const uniqueFilename = `${uuidv4()}${path.extname(
            file.originalFilename || ".jpg"
          )}`;
          const imagePath = path.join(uploadDir, uniqueFilename);

          // Copy file from temp to uploads directory
          await fs.promises.copyFile(file.filepath, imagePath);

          // Add image data
          images.push({
            url: `/uploads/${uniqueFilename}`,
            filename: uniqueFilename,
            originalName: file.originalFilename || "uploaded-image",
            size: file.size,
          });
        } catch (imgError) {
          console.error(
            `Error processing image: ${file.originalFilename}`,
            imgError
          );
          // Continue with other images
        }
      }
    }

    // Format features array
    let features = [];
    if (fields.features) {
      try {
        if (typeof fields.features === "string") {
          // Try to parse as JSON
          if (fields.features.startsWith("[")) {
            features = JSON.parse(fields.features);
          } else {
            // Or split by comma
            features = fields.features
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean);
          }
        }
      } catch (e) {
        console.error("Error parsing features:", e);
      }
    }

    // Create listing document with all fields
    const listing = new Listing({
      title: fields.title,
      description: fields.description || "",
      price: parseFloat(fields.price) || 0,
      bedrooms: parseInt(fields.bedrooms) || 0,
      bathrooms: parseInt(fields.bathrooms) || 0,
      propertyType: fields.propertyType || "house",
      listingType: fields.listingType || "sale",
      address: fields.address || "",
      city: fields.city || "",
      state: fields.state || "",
      country: fields.country || "Nigeria",
      features,
      images,
      status: fields.status || "published",
      createdBy: user._id,
    });

    // Save to database
    await listing.save();

    // Return success
    return res.status(201).json({
      success: true,
      message: "Listing created successfully",
      listing: {
        ...listing.toObject(),
        _id: listing._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
