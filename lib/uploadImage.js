import { v4 as uuidv4 } from "uuid";
import { uploadToStorage } from "./storage";

// Allowed image types
const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const maxSizeMB = 5;

/**
 * Validate image before upload
 */
export const validateImage = (file) => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
};

/**
 * Upload a single image to Firebase
 */
export async function uploadImage(file, options = {}) {
  try {
    const validation = validateImage(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const { folder = "listings" } = options;
    const extension = file.name.split(".").pop().toLowerCase();
    const filename = `${uuidv4()}.${extension}`;

    const result = await uploadToStorage(file, filename, {
      folder,
      metadata: {
        contentType: file.type,
        originalName: file.name,
      },
    });

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    return {
      success: true,
      url: result.url,
      path: result.path,
      filename,
      originalName: file.name,
      contentType: file.type,
      size: file.size,
    };
  } catch (error) {
    console.error("Image upload failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload multiple images to Firebase
 */
export async function uploadMultipleImages(files, options = {}) {
  try {
    const results = [];
    const errors = [];

    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      const result = await uploadImage(file, options);
      if (result.success) {
        results.push(result);
      } else {
        errors.push(`${file.name}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalUploaded: results.length,
      totalFailed: errors.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results: [],
      errors: [error.message],
      totalUploaded: 0,
      totalFailed: files.length,
    };
  }
}

export default {
  uploadImage,
  uploadMultipleImages,
  validateImage,
};
