import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";

/**
 * Validates an image file before upload
 * @param {File} file - The file object to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result {valid, error}
 */
export const validateImage = (file, options = {}) => {
  const {
    maxSizeMB = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  } = options;

  // Check if file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Debug file info
  console.log(
    `📋 Validating file: ${file.name}, ${file.size} bytes, ${file.type}`
  );

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    console.log(`❌ Invalid file type: ${file.type}`);
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file size (convert MB to bytes)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    console.log(
      `❌ File too large: ${file.size} bytes (max ${maxSizeBytes} bytes)`
    );
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  console.log(`✅ File validation passed: ${file.name}`);
  return { valid: true };
};

/**
 * Uploads a single image to Vercel Blob Storage
 *
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export async function uploadImage(file, options = {}) {
  try {
    const { folder = "uploads", metadata = {} } = options;

    console.log(`🔵 Starting upload for ${file.name} to Vercel Blob`);

    // Check environment variables
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("❌ Missing BLOB_READ_WRITE_TOKEN environment variable");
      throw new Error("Missing required Vercel Blob configuration");
    }

    // Generate a unique filename with original extension
    const extension = file.name.split(".").pop().toLowerCase();
    const filename = `${uuidv4()}.${extension}`;
    const path = join(folder, filename);

    console.log(`🔵 Generated path: ${path}`);

    // Create a buffer from file data for Node.js environments
    let fileData;
    if (typeof Buffer !== "undefined" && file instanceof Buffer) {
      fileData = file;
    } else {
      // For formidable File objects or browser File objects
      fileData = file;
    }

    // Upload to Vercel Blob with explicit content type
    console.log(`🔵 Uploading to Vercel Blob...`);
    const blob = await put(path, fileData, {
      contentType: file.type,
      access: "public",
      addRandomSuffix: false,
      metadata,
    });

    console.log(`✅ Upload successful: ${blob.url}`);
    return {
      success: true,
      url: blob.url,
      filename,
      contentType: file.type,
      size: file.size,
    };
  } catch (error) {
    console.error("❌ Image upload failed:", error);
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
}

/**
 * Uploads multiple images to Vercel Blob Storage
 *
 * @param {Array<File>} files - The files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload results
 */
export async function uploadMultipleImages(files, options = {}) {
  try {
    console.log(`🔵 Starting upload for ${files.length} images to Vercel Blob`);
    const results = [];
    const errors = [];

    // Process each file
    for (const file of files) {
      console.log(`🔵 Processing file: ${file.name}`);

      // Validate file before upload
      const validation = validateImage(file);
      if (!validation.valid) {
        console.log(
          `❌ Validation failed for ${file.name}: ${validation.error}`
        );
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      const result = await uploadImage(file, options);
      if (result.success) {
        console.log(`✅ Upload succeeded for ${file.name}: ${result.url}`);
        results.push(result);
      } else {
        console.log(`❌ Upload failed for ${file.name}: ${result.error}`);
        errors.push(`${file.name}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };
  } catch (error) {
    console.error("❌ Multiple image upload failed:", error);
    return {
      success: false,
      results: [],
      errors: [error.message || "Upload failed"],
    };
  }
}

export default {
  uploadImage,
  uploadMultipleImages,
  validateImage,
};
