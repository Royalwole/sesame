/**
 * Comprehensive image processing utilities
 */

import { storage } from "./firebase-config";
import { ref, getDownloadURL } from "firebase/storage";

/**
 * Gets the appropriate image URL from Firebase Storage
 * @param {string} imagePath - The image path relative to storage
 * @param {string} fallbackPath - The fallback image path if the image doesn't exist
 * @returns {string} - The resolved image URL
 */
export const getImageUrl = async (
  imagePath,
  fallbackPath = "/images/placeholder-property.svg"
) => {
  if (!imagePath) return fallbackPath;

  // If it's already an absolute URL or data URL, return as is
  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath;
  }

  try {
    const storageRef = ref(storage, imagePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.warn(`Failed to get image URL for ${imagePath}:`, error);
    return fallbackPath;
  }
};

/**
 * Handle image loading errors
 * @param {Event} event - The error event
 */
export const handleImageError = (event) => {
  const imgElement = event.target;
  if (imgElement.getAttribute("data-error-handled")) return;

  imgElement.setAttribute("data-error-handled", "true");
  imgElement.src = "/images/placeholder-property.svg";
};

/**
 * Check if a file is an image
 * @param {File} file - File to check
 * @returns {boolean} - True if file is an image
 */
export const isImageFile = (file) => {
  return file && file.type && file.type.startsWith("image/");
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

/**
 * Compress an image file
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeMB = 2,
  } = options;

  // Skip if file is small enough
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        // Create canvas for compression
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
};

/**
 * Process multiple images in batch
 * @param {Array<File>} files - Array of image files
 * @param {Object} options - Processing options
 * @returns {Promise<Array<File>>} - Processed files
 */
export const processImageBatch = async (files, options = {}) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const processedFiles = [];
  for (const file of files) {
    if (isImageFile(file)) {
      const processed = await compressImage(file, options);
      processedFiles.push(processed);
    }
  }

  return processedFiles;
};

export default {
  getImageUrl,
  handleImageError,
  isImageFile,
  formatFileSize,
  compressImage,
  processImageBatch,
};
