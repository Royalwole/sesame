/**
 * Simple image compression utility for browser environments
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum size in MB
 * @param {number} options.maxWidthOrHeight - Maximum width or height in pixels
 * @returns {Promise<File>} - A promise that resolves to the compressed file
 */
export default async function imageCompression(file, options = {}) {
  const { maxSizeMB = 1, maxWidthOrHeight = 1920 } = options;

  // Skip compression if file is already smaller than target size
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    // Create image from file
    const img = new Image();
    img.onload = () => {
      // Get original dimensions
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions to maintain aspect ratio
      if (width > height) {
        if (width > maxWidthOrHeight) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        }
      } else {
        if (height > maxWidthOrHeight) {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      // Create canvas with new dimensions
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Draw image onto canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Determine quality based on file size
      let quality = 0.7; // Default

      if (file.size > 5 * 1024 * 1024) quality = 0.5;
      else if (file.size > 2 * 1024 * 1024) quality = 0.6;
      else if (file.size < 500 * 1024) quality = 0.85;

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas to Blob conversion failed"));
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () =>
      reject(new Error("Failed to load image for compression"));

    // Create object URL from file
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Clean up object URL after image is loaded or on error
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      img.onload();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };
  });
}
