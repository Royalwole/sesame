/**
 * Server-side image processing utilities
 */
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp"; // You may need to install this: npm install sharp

// Default upload directory
const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Process an uploaded image file (from formidable)
 * @param {Object} file - File object from formidable
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processed image information
 */
export async function processUploadedImage(file, options = {}) {
  const {
    directory = DEFAULT_UPLOAD_DIR,
    maxWidth = 1920,
    maxHeight = 1200,
    quality = 80,
    format = "webp",
    generateThumbnail = true,
    thumbnailWidth = 300,
  } = options;

  if (!file || !file.filepath) {
    throw new Error("Invalid file object");
  }

  try {
    // Ensure upload directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Generate a unique filename
    const uniqueId = uuidv4();
    const filename = `${uniqueId}.${format}`;
    const thumbnailFilename = `${uniqueId}_thumb.${format}`;

    const outputPath = path.join(directory, filename);
    const thumbnailPath = path.join(directory, thumbnailFilename);

    // Convert image to webp format with compression
    const image = sharp(file.filepath);
    const metadata = await image.metadata();

    // Resize if larger than max dimensions while maintaining aspect ratio
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Process and save main image
    await image.toFormat(format, { quality }).toFile(outputPath);

    let hasThumbnail = false;

    // Generate thumbnail if requested
    if (generateThumbnail) {
      await sharp(file.filepath)
        .resize(thumbnailWidth, thumbnailWidth, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .toFormat(format, { quality })
        .toFile(thumbnailPath);

      hasThumbnail = true;
    }

    // Get file stats
    const stats = await fs.promises.stat(outputPath);

    // Return processed image info
    return {
      filename,
      thumbnailFilename: hasThumbnail ? thumbnailFilename : null,
      originalName: file.originalFilename || "image",
      size: stats.size,
      format,
      width: metadata.width,
      height: metadata.height,
      processedAt: new Date().toISOString(),
      contentType: `image/${format}`,
    };
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Process multiple images in batch
 * @param {Array<Object>} files - Array of file objects from formidable
 * @param {Object} options - Processing options
 * @returns {Promise<Array<Object>>} - Processed image information
 */
export async function processImageBatch(files, options = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const processedImage = await processUploadedImage(file, options);
      results.push(processedImage);
    } catch (error) {
      console.error(
        `Failed to process ${file.originalFilename || "image"}:`,
        error
      );
      errors.push({
        file: file.originalFilename || "unknown",
        error: error.message,
      });
    }
  }

  // Log batch results
  console.log(
    `Image batch processing complete: ${results.length} successful, ${errors.length} failed`
  );

  return {
    images: results,
    errors: errors.length > 0 ? errors : null,
    success: results.length > 0,
    total: results.length + errors.length,
    processed: results.length,
  };
}

/**
 * Delete an image and its thumbnail
 * @param {String} filename - Image filename to delete
 * @param {Object} options - Options for deletion
 * @returns {Promise<Boolean>} - Success status
 */
export async function deleteImage(filename, options = {}) {
  const { directory = DEFAULT_UPLOAD_DIR, includeThumbnail = true } = options;

  if (!filename) return false;

  try {
    const imagePath = path.join(directory, filename);

    // Delete main image if it exists
    if (fs.existsSync(imagePath)) {
      await fs.promises.unlink(imagePath);
    }

    // Delete thumbnail if requested
    if (includeThumbnail) {
      // Generate thumbnail filename from original
      const thumbFilename = filename.replace(/\.[^.]+$/, "_thumb$&");
      const thumbnailPath = path.join(directory, thumbFilename);

      if (fs.existsSync(thumbnailPath)) {
        await fs.promises.unlink(thumbnailPath);
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete image ${filename}:`, error);
    return false;
  }
}
