/**
 * Utility functions for debugging form submissions
 */

/**
 * Safely extract basic info about image files for logging
 * @param {Array} files - Array of image files or file-like objects
 * @returns {Array} - Array of simplified file info objects for logging
 */
export function getFileInfo(files) {
  if (!Array.isArray(files)) return [];

  return files.map((file, index) => {
    try {
      // Handle File objects
      if (file instanceof File) {
        return {
          index,
          name: file.name,
          size: Math.round(file.size / 1024) + "KB",
          type: file.type,
        };
      }
      // Handle objects with file property
      else if (file?.file instanceof File) {
        return {
          index,
          name: file.file.name,
          size: Math.round(file.file.size / 1024) + "KB",
          type: file.file.type,
          fileType: "nested",
        };
      }
      // Handle other objects
      else if (typeof file === "object" && file !== null) {
        return {
          index,
          type: file.type || "unknown",
          size: file.size ? Math.round(file.size / 1024) + "KB" : "unknown",
          keys: Object.keys(file),
          objectType: file.constructor?.name || typeof file,
        };
      }
      // Default case
      return {
        index,
        type: typeof file,
        isValid: false,
      };
    } catch (e) {
      return { index, error: e.message };
    }
  });
}

/**
 * Log FormData contents for debugging
 * @param {FormData} formData - The FormData object to log
 */
export function logFormData(formData) {
  if (!(formData instanceof FormData)) {
    console.log("Not a FormData object:", formData);
    return;
  }

  console.log("FormData contents:");
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(
        `${key}: File - ${value.name} (${Math.round(value.size / 1024)}KB)`
      );
    } else if (value instanceof Blob) {
      console.log(`${key}: Blob - ${Math.round(value.size / 1024)}KB`);
    } else {
      // Truncate long values
      const valueStr = String(value);
      const displayValue =
        valueStr.length > 100 ? valueStr.substring(0, 100) + "..." : valueStr;
      console.log(`${key}: ${displayValue}`);
    }
  }
}
