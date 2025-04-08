/**
 * Comprehensive image processing utilities
 */

/**
 * Compress an image file for upload
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeMB = 2,
  } = options;

  // Skip processing if file is already smaller than target size or not an image
  if (
    !file ||
    !file.type.startsWith("image/") ||
    file.size <= maxSizeMB * 1024 * 1024
  ) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        // Calculate dimensions
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
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

        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with appropriate quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // Return original on failure
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        // Return original on error
        resolve(file);
      };
    };

    reader.onerror = () => {
      // Return original on error
      resolve(file);
    };
  });
}

/**
 * Check if a file is an image based on MIME type
 * @param {File} file - File to check
 * @returns {Boolean} - True if file is an image
 */
function isImageFile(file) {
  return file && file.type && file.type.startsWith("image/");
}

/**
 * Format file size for display
 * @param {Number} bytes - File size in bytes
 * @returns {String} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Process image using HTML Canvas for compression
 * @param {File} file - Image file
 * @param {Object} options - Processing options
 * @returns {Promise<File>} - Processed file
 */
async function processImageWithCanvas(file, options) {
  const {
    maxWidth,
    maxHeight,
    quality: initialQuality,
    maxSizeMB,
    minQuality,
  } = options;

  return new Promise((resolve, reject) => {
    // Create file reader
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = function (event) {
      // Create image element
      const img = new Image();
      img.src = event.target.result;

      img.onload = function () {
        // Calculate dimensions while preserving aspect ratio
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // Draw image to canvas
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Try progressive compression until target size is met
        const attemptCompression = (currentQuality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas to Blob conversion failed"));
                return;
              }

              // If output is small enough or we've reached minimum quality, return result
              if (
                blob.size <= maxSizeMB * 1024 * 1024 ||
                currentQuality <= minQuality
              ) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type || "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Try again with lower quality
                const nextQuality = Math.max(minQuality, currentQuality - 0.1);
                console.log(`Retrying with quality: ${nextQuality.toFixed(1)}`);
                attemptCompression(nextQuality);
              }
            },
            file.type,
            currentQuality
          );
        };

        // Start compression with initial quality
        attemptCompression(initialQuality);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

/**
 * Calculate dimensions while preserving aspect ratio
 * @param {Number} origWidth - Original width
 * @param {Number} origHeight - Original height
 * @param {Number} maxWidth - Maximum width
 * @param {Number} maxHeight - Maximum height
 * @returns {Object} - New dimensions { width, height }
 */
function calculateDimensions(origWidth, origHeight, maxWidth, maxHeight) {
  let width = origWidth;
  let height = origHeight;

  // First check if we need to scale width
  if (width > maxWidth) {
    height = Math.round(height * (maxWidth / width));
    width = maxWidth;
  }

  // Then check if we still need to scale height
  if (height > maxHeight) {
    width = Math.round(width * (maxHeight / height));
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Process multiple images in batch
 * @param {Array<File>} files - Array of image files
 * @param {Object} options - Compression options
 * @returns {Promise<Array<File>>} - Processed image files
 */
export async function processImageBatch(files, options = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const results = [];

  for (const file of files) {
    try {
      const processedFile = await compressImage(file, options);
      results.push(processedFile);
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      // Still include the original file if processing fails
      results.push(file);
    }
  }

  return results;
}

/**
 * Generate a data URL for image preview
 * @param {File} file - Image file
 * @returns {Promise<string>} - Data URL for image preview
 */
export function generateImagePreview(file) {
  return new Promise((resolve, reject) => {
    if (!file || !isImageFile(file)) {
      reject(new Error("Invalid image file"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
  });
}
