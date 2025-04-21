import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure API route to handle larger file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "50mb",
  },
};

export default async function handler(req, res) {
  const { id } = req.query;
  let dbConnection = false;
  const startTime = Date.now();
  const requestId = `${startTime}-${Math.random().toString(36).substring(2, 10)}`;

  // Enhanced request logging
  console.log(
    `[${startTime}] [RequestID:${requestId}] API Request: ${req.method} /api/listings/${id}`
  );

  // Additional ID validation beyond the basic ObjectId check
  if (!id || typeof id !== "string") {
    console.error(`[${requestId}] Invalid listing ID format: ${id}`);
    return res.status(400).json({
      success: false,
      message: "Invalid listing ID format",
      errorDetail: "The listing ID is missing or has an invalid format",
      requestId,
    });
  }

  // Improved ObjectId validation with detailed logging
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error(
      `[${requestId}] Invalid MongoDB ObjectID: ${id}, pattern match: ${/^[0-9a-fA-F]{24}$/.test(id)}`
    );
    return res.status(400).json({
      success: false,
      message: "Invalid listing ID",
      errorDetail: "The provided ID is not a valid MongoDB ObjectID",
      requestId,
    });
  }

  try {
    // Connect to database
    await connectDB();
    dbConnection = true;

    // Get authenticated user
    const auth = getAuth(req);

    // GET request - fetch listing
    if (req.method === "GET") {
      try {
        console.log(`[API:${requestId}] Listing request for ID: ${id}`);

        // Create a fresh ObjectId for exact matching
        const objectId = new mongoose.Types.ObjectId(id);
        console.log(
          `[API:${requestId}] Querying with ObjectId: ${objectId.toString()}`
        );

        // Use findById for better performance and cleaner code
        let listing;
        try {
          listing = await Listing.findById(objectId)
            .populate("createdBy", "firstName lastName email phone")
            .lean();
        } catch (dbErr) {
          console.error(
            `[${requestId}] Database error fetching listing: ${dbErr.message}`
          );
          return res.status(500).json({
            success: false,
            message: "Database error while fetching listing",
            errorDetail: dbErr.message,
            requestId,
          });
        }

        // Handle not found case gracefully with detailed logging
        if (!listing) {
          console.error(
            `[API:${requestId}] No listing found with ID: ${id}. Checking database connection...`
          );

          // Double check that DB is connected
          const dbStatus = mongoose.connection.readyState;
          const dbStatusText =
            ["disconnected", "connected", "connecting", "disconnecting"][
              dbStatus
            ] || "unknown";

          return res.status(404).json({
            success: false,
            error: "Listing not found",
            message: "The requested listing does not exist or has been removed",
            requestId,
            _debug:
              process.env.NODE_ENV === "development"
                ? {
                    dbStatus: dbStatusText,
                    queriedId: id,
                  }
                : undefined,
          });
        }

        // Ensure the returned ID matches exactly what was requested to catch caching issues
        const returnedId = listing._id.toString();

        if (returnedId !== id) {
          console.error(
            `[API:${requestId}] ID mismatch! Requested: ${id}, Found: ${returnedId}`
          );
          return res.status(500).json({
            success: false,
            error: "Data integrity error",
            message: "Found listing ID does not match requested ID",
            requestId,
            details: {
              requested: id,
              found: returnedId,
            },
          });
        }

        // Additional null check for critical listing fields
        if (!listing.title || !listing.price) {
          console.error(
            `[${requestId}] Retrieved listing has missing critical fields: ${JSON.stringify(
              {
                hasTitle: !!listing.title,
                hasPrice: !!listing.price,
              }
            )}`
          );
        }

        console.log(
          `[API:${requestId}] Successfully found listing: ${listing.title}`
        );

        // Ensure consistent string representation for all MongoDB ObjectIds
        const stringifiedListing = JSON.parse(JSON.stringify(listing));

        // Set strong cache control headers to prevent caching issues
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Surrogate-Control", "no-store");

        // Add a unique response ID to help with debugging
        res.setHeader("X-Response-ID", requestId);

        // Now handle permissions checking
        if (auth?.userId) {
          // Check if user is admin or owner
          const user = await User.findOne({ clerkId: auth.userId }).lean();

          if (!user) {
            return res.status(404).json({ error: "User not found", requestId });
          }

          const isAdmin = user.role === "admin";
          const isOwner =
            listing.createdBy &&
            listing.createdBy._id &&
            user._id &&
            listing.createdBy._id.toString() === user._id.toString();

          if (!isAdmin && !isOwner && listing.status !== "published") {
            return res.status(403).json({
              error: "Access denied",
              message: "You don't have permission to view this listing",
              requestId,
            });
          }
        } else if (listing.status !== "published") {
          return res.status(403).json({
            error: "Access denied",
            message: "This listing is not publicly available",
            requestId,
          });
        }

        // Increment view counter for public access
        if (!auth?.userId && listing.status === "published") {
          await Listing.findByIdAndUpdate(objectId, { $inc: { views: 1 } });
        }

        // Include debug information in development mode
        const responseData = {
          success: true,
          listing: stringifiedListing,
          meta: {
            requestId,
            timestamp: Date.now(),
          },
        };

        if (process.env.NODE_ENV === "development") {
          responseData._debug = {
            requestedId: id,
            foundId: returnedId,
            exact_match: id === returnedId,
            title: listing.title,
          };
        }

        return res.status(200).json(responseData);
      } catch (error) {
        console.error(
          `[API:${requestId}] Error fetching listing ${id}:`,
          error
        );
        return res.status(500).json({
          success: false,
          error: "Server error",
          message: "An error occurred while retrieving the listing",
          requestId,
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }

    // PUT request - update listing (enhanced)
    else if (req.method === "PUT") {
      // Authentication required
      if (!auth?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log(`[API] Updating listing ${id} by user ${auth.userId}`);

      try {
        // Find user
        const user = await User.findOne({ clerkId: auth.userId }).lean();
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Create a fresh ObjectId from the string ID to avoid comparison issues
        const objectId = new mongoose.Types.ObjectId(id);

        // Find listing using consistent method
        const listing = await Listing.findOne({ _id: objectId });
        if (!listing) {
          return res.status(404).json({
            error: "Listing not found",
            details: "The listing you are trying to update could not be found",
          });
        }

        // Check authorization - user must be the owner or an admin
        const isAdmin = user.role === "admin";
        const isOwner = listing.createdBy.toString() === user._id.toString();

        if (!isAdmin && !isOwner) {
          return res.status(403).json({
            error: "Access denied",
            message: "You don't have permission to update this listing",
          });
        }

        // Parse formdata if it's multipart (for image uploads)
        let updateData = req.body;
        let newImages = [];
        let fields = {}; // Initialize fields to prevent undefined reference

        // Handle formdata with images
        if (req.headers["content-type"]?.includes("multipart/form-data")) {
          try {
            const form = new formidable.IncomingForm({
              keepExtensions: true,
              multiples: true,
              maxFileSize: 15 * 1024 * 1024, // 15MB per file
              maxFields: 100,
              maxTotalFileSize: 50 * 1024 * 1024, // 50MB total
            });

            // Log form parsing attempt
            console.log(`[API:${id}] Processing multipart form data`);

            const [parsedFields, files] = await new Promise(
              (resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                  if (err) {
                    console.error(`[API:${id}] Form parsing error:`, err);
                    reject(err);
                    return;
                  }
                  resolve([fields, files]);
                });
              }
            );

            // Safely assign fields to our variable
            fields = parsedFields || {};

            // Process fields with safer parsing
            updateData = Object.fromEntries(
              Object.entries(fields).map(([key, value]) => {
                // Try to parse JSON values
                if (
                  typeof value === "string" &&
                  (value.startsWith("[") || value.startsWith("{"))
                ) {
                  try {
                    return [key, JSON.parse(value)];
                  } catch (e) {
                    return [key, value]; // Keep as string if parsing fails
                  }
                }
                return [key, value];
              })
            );

            console.log(
              `[API:${id}] Processed ${Object.keys(updateData).length} fields`
            );

            // Process files with improved error handling
            if (files.images) {
              // Log that we're starting image processing
              console.log(
                `[API:${id}] Starting to process ${
                  Array.isArray(files.images) ? files.images.length : 1
                } images`
              );

              // Detailed logging of image files
              const imageFiles = Array.isArray(files.images)
                ? files.images
                : [files.images];
              console.log(
                `[API:${id}] Image files received:`,
                imageFiles.map((f) => ({
                  name: f.originalFilename || "unnamed",
                  size: Math.round(f.size / 1024) + "KB",
                  type: f.mimetype,
                }))
              );

              // Process images in batches
              const BATCH_SIZE = 3;
              const MAX_IMAGES = 10;
              const imagesToProcess = imageFiles.slice(0, MAX_IMAGES);

              // Process each file
              for (let i = 0; i < imagesToProcess.length; i += BATCH_SIZE) {
                const batch = imagesToProcess.slice(i, i + BATCH_SIZE);
                console.log(
                  `[API:${id}] Processing batch ${i / BATCH_SIZE + 1} with ${
                    batch.length
                  } images`
                );

                // Process batch in parallel
                const batchResults = await Promise.all(
                  batch.map(async (file) => {
                    try {
                      if (!file || !file.filepath) {
                        console.error(`[API:${id}] Invalid file object:`, file);
                        return null;
                      }

                      // Generate a unique filename
                      const filename = `${uuidv4()}${path.extname(
                        file.originalFilename || ".jpg"
                      )}`;

                      // Define upload paths
                      const uploadDir = path.join(
                        process.cwd(),
                        "public",
                        "uploads"
                      );
                      if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                      }

                      const uploadPath = path.join(uploadDir, filename);

                      // Copy file
                      await fs.promises.copyFile(file.filepath, uploadPath);

                      return {
                        url: `/uploads/${filename}`,
                        filename,
                        originalName: file.originalFilename || "uploaded-image",
                        size: file.size,
                      };
                    } catch (imgError) {
                      console.error(
                        `[API:${id}] Error processing image:`,
                        imgError
                      );
                      return null;
                    }
                  })
                );

                // Add successful results to newImages
                newImages.push(...batchResults.filter(Boolean));
              }

              console.log(
                `[API:${id}] Successfully processed ${newImages.length} new images`
              );
            }
          } catch (formError) {
            console.error(`[API:${id}] Form processing error:`, formError);
            return res.status(400).json({
              error: "Form processing error",
              message: formError.message,
              details:
                process.env.NODE_ENV === "development"
                  ? formError.stack
                  : undefined,
            });
          }
        }

        // Normalize numeric values
        if (updateData.price !== undefined) {
          updateData.price = Number(updateData.price);
        }
        if (updateData.bedrooms !== undefined) {
          updateData.bedrooms = Number(updateData.bedrooms);
        }
        if (updateData.bathrooms !== undefined) {
          updateData.bathrooms = Number(updateData.bathrooms);
        }

        // Convert features from string to array if needed
        if (typeof updateData.features === "string") {
          updateData.features = updateData.features
            .split(",")
            .map((feature) => feature.trim())
            .filter((feature) => feature !== "");
        }

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.createdBy;
        delete updateData.createdAt;

        // Add new images if any were uploaded - preserve existing ones
        if (newImages.length > 0) {
          // Preserve existing images unless explicitly told to replace them
          const preserveImages = fields.preserveImages !== "false";
          const updatedImages = preserveImages
            ? [...(listing.images || []), ...newImages]
            : newImages;

          console.log(
            `[API:${id}] ${
              preserveImages
                ? "Preserving existing images + "
                : "Replacing with "
            }${newImages.length} new images. Total: ${updatedImages.length}`
          );
          updateData.images = updatedImages;
        }

        // FIX: Add robust image processing
        // Handle preserved images
        let preservedImageIds = [];
        try {
          if (fields.preservedImageIds) {
            // Parse the JSON string to get the array of IDs
            if (typeof fields.preservedImageIds === "string") {
              preservedImageIds = JSON.parse(fields.preservedImageIds);
            } else if (Array.isArray(fields.preservedImageIds)) {
              preservedImageIds = fields.preservedImageIds;
            }
            console.log(
              `[API:${id}] Parsed preservedImageIds:`,
              preservedImageIds
            );
          } else {
            console.log(`[API:${id}] No preservedImageIds provided`);
          }
        } catch (parseError) {
          console.error(
            `[API:${id}] Error parsing preservedImageIds:`,
            parseError
          );
          preservedImageIds = [];
        }

        // If preservedImageIds is explicitly provided, use it to filter existing images
        if (
          Array.isArray(preservedImageIds) &&
          listing.images &&
          listing.images.length > 0
        ) {
          const preservedImages = listing.images.filter((img) =>
            preservedImageIds.includes(img._id.toString())
          );

          // Update with preserved images plus any new ones
          updateData.images = [...preservedImages, ...newImages];

          console.log(
            `[API:${id}] Preserved ${preservedImages.length} existing images and added ${newImages.length} new ones`
          );
        } else if (newImages.length > 0) {
          // If no preserved images specified but we have new ones, replace all images
          updateData.images = newImages;
          console.log(
            `[API:${id}] Replacing all images with ${newImages.length} new ones`
          );
        } else {
          // Don't modify images if nothing new is provided and no preservation info
          delete updateData.images;
          console.log(`[API:${id}] No changes to images`);
        }

        // Update the listing
        const updatedListing = await Listing.findOneAndUpdate(
          { _id: objectId },
          { $set: updateData },
          { new: true, runValidators: true }
        ).lean();

        if (!updatedListing) {
          return res.status(500).json({
            error: "Update failed",
            message: "Failed to update the listing",
          });
        }

        console.log(`Successfully updated listing ${id}`);

        // Standardize ID to string in response
        const responseData = {
          ...updatedListing,
          _id: updatedListing._id.toString(),
        };

        // Send clearer success response
        return res.status(200).json({
          success: true,
          message: "Listing updated successfully",
          listing: responseData,
          updateInfo: {
            fieldsUpdated: Object.keys(updateData).length,
            imagesAdded: newImages.length,
          },
        });
      } catch (error) {
        console.error(`Error updating listing ${id}:`, error);
        return res.status(500).json({
          error: "Server error",
          message:
            error.message || "An error occurred while updating the listing",
          details:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
      }
    }

    // DELETE request - delete listing
    else if (req.method === "DELETE") {
      // Authentication required
      if (!auth?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Find user
      const user = await User.findOne({ clerkId: auth.userId }).lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find listing
      const listing = await Listing.findById(id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      // Check authorization - user must be the owner or an admin
      const isAdmin = user.role === "admin";
      const isOwner = listing.createdBy.toString() === user._id.toString();

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          error: "Access denied",
          message: "You don't have permission to delete this listing",
        });
      }

      // Delete the listing
      await Listing.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: "Listing deleted successfully",
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error(
      `[${requestId}] Unexpected error in listings/[id] API:`,
      error
    );
    return res.status(500).json({
      success: false,
      message: "Server error",
      errorDetail: error.message,
      requestId,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
