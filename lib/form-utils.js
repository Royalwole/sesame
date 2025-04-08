/**
 * Utilities for handling form data, especially with formidable and files
 */

/**
 * Process formidable field values, handling different field formats
 * @param {Object} fields - Fields object from formidable
 * @returns {Object} - Processed fields object
 */
export function processFormFields(fields) {
  const processedFields = {};

  for (const [key, value] of Object.entries(fields)) {
    // Handle array values (formidable sometimes returns arrays)
    if (Array.isArray(value)) {
      processedFields[key] = value[0];
    }
    // Handle object values with text property (sometimes happens with formidable)
    else if (value && typeof value === "object" && "text" in value) {
      processedFields[key] = value.text;
    }
    // Regular value
    else {
      processedFields[key] = value;
    }
  }

  return processedFields;
}

/**
 * Validate required form fields
 * @param {Object} data - Form data to validate
 * @param {Array} required - Array of required field names
 * @returns {Object} - Validation result with errors array
 */
export function validateRequiredFields(data, required = []) {
  const errors = [];

  for (const field of required) {
    if (
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      errors.push({
        field,
        message: `${field} is required`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate numeric fields to ensure they are proper numbers
 * @param {Object} data - Form data with numeric fields
 * @param {Array} numericFields - Array of field names that should be numbers
 * @returns {Object} - Object with validated numeric values
 */
export function validateNumericFields(data, numericFields = []) {
  const validated = {};
  const errors = [];

  for (const field of numericFields) {
    const value = data[field];
    if (value !== undefined && value !== "") {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push({
          field,
          message: `${field} must be a valid number`,
        });
        validated[field] = 0;
      } else {
        validated[field] = num;
      }
    } else {
      validated[field] = 0;
    }
  }

  return { validated, errors };
}

/**
 * Create a form state debugger to help troubleshoot form issues
 */
export function createFormDebugger(formName) {
  return {
    log: (message, data) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[${formName}] ${message}`, data);
      }
    },
    warn: (message, data) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[${formName}] ${message}`, data);
      }
    },
    error: (message, data) => {
      if (process.env.NODE_ENV === "development") {
        console.error(`[${formName}] ${message}`, data);
      }
    },
  };
}

/**
 * Creates a debounced version of a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Creates an optimized input change handler
 * @param {Function} setState - State update function
 * @returns {Function} - Optimized change handler
 */
export function createInputChangeHandler(setState) {
  return function handleInputChange(e) {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    setState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
}

/**
 * Process and optimize an image file before upload
 * @param {File} file - Image file to process
 * @param {Object} options - Processing options
 * @returns {Promise<File>} Processed image file
 */
export async function processImageForUpload(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    maxSizeMB = 2,
  } = options;

  // If file is small enough already, just return it
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate dimensions to maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality reduction
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with original name
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(optimizedFile);
            } else {
              // Fallback to original if compression fails
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
    };

    reader.onerror = () => reject(reader.error);
  });
}

/**
 * Normalizes form input values to appropriate types
 * Enhanced version combining both implementations
 * @param {Object} formData - Raw form data from a form
 * @returns {Object} Normalized data ready for submission
 */
export function normalizeFormData(formData) {
  if (!formData || typeof formData !== "object") return {};

  const normalized = { ...formData };

  // Convert numeric values - including squareFeet from first implementation
  ["price", "bedrooms", "bathrooms", "squareFeet"].forEach((field) => {
    if (normalized[field] !== undefined && normalized[field] !== "") {
      const num = Number(normalized[field]);
      normalized[field] = isNaN(num) ? normalized[field] : num;
    }
  });

  // Convert features from string to array if needed
  if (typeof normalized.features === "string") {
    normalized.features = normalized.features
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (!Array.isArray(normalized.features)) {
    normalized.features = [];
  }

  // Ensure propertyType is set - from first implementation
  if (!normalized.propertyType) {
    normalized.propertyType = "house"; // Default value
  }

  // Ensure listingType is set - from first implementation
  if (!normalized.listingType) {
    normalized.listingType = "sale"; // Default value
  }

  // Clean up any undefined or null values - from second implementation
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === undefined || normalized[key] === null) {
      delete normalized[key];
    }
  });

  return normalized;
}

/**
 * Safely extract image data from complex image objects
 * @param {Array} images - Array of image objects
 * @returns {Object} Structured image data
 */
export function extractImageData(images = []) {
  // Filter out invalid entries
  const validImages = Array.isArray(images)
    ? images.filter((img) => img && (img.url || img.preview))
    : [];

  // Separate existing from new images
  const existingImages = validImages
    .filter((img) => img.isExisting)
    .map((img) => ({
      _id: img._id || img.id,
      url: img.url || img.preview,
      filename: img.filename || "",
      originalName: img.originalName || img.name || "existing-image",
    }));

  // Extract preserved image IDs
  const preservedImageIds = existingImages
    .map((img) => img._id)
    .filter(Boolean);

  return {
    existingImages,
    preservedImageIds,
    count: existingImages.length,
  };
}

/**
 * Safely creates FormData for submission that handles errors gracefully
 * @param {Object} formData - Object containing form values
 * @param {Array} files - Array of files to append
 * @returns {FormData} - FormData object ready for submission
 */
export function createSafeFormData(formData, files = []) {
  const data = new FormData();

  // Add basic form fields with error handling
  Object.entries(formData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    try {
      if (
        typeof value === "object" &&
        !(value instanceof File) &&
        !(value instanceof Blob)
      ) {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value);
      }
    } catch (err) {
      console.warn(`Error adding field ${key} to FormData:`, err);
    }
  });

  // Add files with validation
  if (Array.isArray(files)) {
    files.forEach((file, index) => {
      try {
        // Handle direct file objects
        if (file instanceof File) {
          data.append("images", file);
        }
        // Handle objects with file property
        else if (file?.file instanceof File) {
          data.append("images", file.file);
        }
        // Skip invalid files
        else {
          console.warn(`Skipping invalid file at index ${index}`);
        }
      } catch (err) {
        console.warn(`Error adding file ${index} to FormData:`, err);
      }
    });

    // Add file count for validation
    data.append("imageCount", String(files.length));
  }

  return data;
}
