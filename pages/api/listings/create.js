import { IncomingForm } from "formidable";
import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import User from "../../../models/User";
import { getAuth, getSession } from "@clerk/nextjs/server";
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

// Helper function to extract single value from potential array
const extractValue = (field) => {
  if (Array.isArray(field)) {
    return field[0];
  }
  return field;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const requestId = `create_${Math.random().toString(36).substring(2, 10)}`;
  console.log(`[${requestId}] Starting listing creation`);
  let dbConnection = false;

  try {
    const session = await getSession({ req });
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    // Find user by clerkId with better error handling
    console.log(
      `[${requestId}] Looking up user with clerkId: ${session.user.id}`
    );
    await connectDB();
    dbConnection = true;

    const dbUser = await User.findOne({ clerkId: session.user.id });
    if (!dbUser) {
      console.error(
        `[${requestId}] User profile not found for clerkId: ${session.user.id}`
      );
      return res.status(400).json({
        success: false,
        error: "User profile not found",
        message: "Please try refreshing your profile before creating a listing",
      });
    }

    console.log(
      `[${requestId}] Found user: ${dbUser._id}, role: ${dbUser.role}`
    );

    // Parse form data with robust error handling
    const form = new IncomingForm({
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

    console.log("Received form fields:", Object.keys(fields));

    // Connect to database
    await connectDB();
    dbConnection = true;

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
          const storagePath = `uploads/${uniqueFilename}`;

          // Copy file from temp to uploads directory
          await fs.promises.copyFile(file.filepath, imagePath);

          // Add image data with required path field
          images.push({
            url: `/uploads/${uniqueFilename}`,
            path: storagePath, // Add the required path field
            filename: uniqueFilename,
            originalName: file.originalFilename || "uploaded-image",
            size: file.size,
            contentType: file.mimetype || "image/jpeg",
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
        const featuresValue = extractValue(fields.features);

        if (typeof featuresValue === "string") {
          // Try to parse as JSON
          if (featuresValue.startsWith("[")) {
            features = JSON.parse(featuresValue);
          } else {
            // Or split by comma
            features = featuresValue
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean);
          }
        } else if (Array.isArray(featuresValue)) {
          features = featuresValue;
        }
      } catch (e) {
        console.error("Error parsing features:", e);
      }
    }

    // Create listing document with all fields
    // Extract single values from potential arrays using the helper function
    const listing = new Listing({
      title: extractValue(fields.title),
      description: extractValue(fields.description) || "",
      price: parseFloat(extractValue(fields.price)) || 0,
      bedrooms: parseInt(extractValue(fields.bedrooms)) || 0,
      bathrooms: parseInt(extractValue(fields.bathrooms)) || 0,
      propertyType: extractValue(fields.propertyType) || "house",
      listingType: extractValue(fields.listingType) || "sale",
      address: extractValue(fields.address) || "",
      city: extractValue(fields.city) || "",
      state: extractValue(fields.state) || "",
      country: extractValue(fields.country) || "Nigeria",
      features,
      images,
      status: extractValue(fields.status) || "published",
      // Properly reference the user
      agentId: dbUser._id,
      createdBy: {
        _id: dbUser._id,
        name:
          dbUser.fullName ||
          `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim(),
        email: dbUser.email,
        profileImage: dbUser.profileImage,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Validate the listing before saving
    try {
      await listing.validate();
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: validationError.message,
      });
    }

    // Save to database
    await listing.save();

    console.log(
      `[${requestId}] Listing created successfully with ID: ${listing._id}`
    );

    // Return success with detailed response
    return res.status(201).json({
      success: true,
      message: "Listing created successfully",
      listing: {
        ...listing.toObject(),
        _id: listing._id.toString(),
      },
      requestId,
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
