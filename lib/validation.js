/**
 * Central validation utility for consistent form validation across the application
 */

/**
 * Validate a form object against a validation schema
 * @param {Object} data - The form data to validate
 * @param {Object} schema - Validation schema with field rules
 * @returns {Object} - Validation result with errors and isValid flag
 */
export function validateForm(data, schema) {
  const errors = {};
  let isValid = true;

  // Process each field in the schema
  Object.entries(schema).forEach(([field, rules]) => {
    // Get the field value, handling nested fields with dot notation
    const value = getNestedValue(data, field);

    // Apply each validation rule for the field
    if (rules.required && isEmpty(value)) {
      errors[field] =
        rules.requiredMessage || `${formatFieldName(field)} is required`;
      isValid = false;
    } else if (value !== undefined && value !== null && value !== "") {
      // Only validate non-empty fields beyond required check

      // Type validations
      if (rules.type === "number" && !isValidNumber(value)) {
        errors[field] =
          rules.typeMessage ||
          `${formatFieldName(field)} must be a valid number`;
        isValid = false;
      } else if (rules.type === "email" && !isValidEmail(value)) {
        errors[field] =
          rules.typeMessage ||
          `${formatFieldName(field)} must be a valid email address`;
        isValid = false;
      }

      // Min/max validations for numbers
      if (rules.min !== undefined && Number(value) < rules.min) {
        errors[field] =
          rules.minMessage ||
          `${formatFieldName(field)} must be at least ${rules.min}`;
        isValid = false;
      }
      if (rules.max !== undefined && Number(value) > rules.max) {
        errors[field] =
          rules.maxMessage ||
          `${formatFieldName(field)} must be no more than ${rules.max}`;
        isValid = false;
      }

      // Length validations for strings
      if (
        rules.minLength !== undefined &&
        String(value).length < rules.minLength
      ) {
        errors[field] =
          rules.minLengthMessage ||
          `${formatFieldName(field)} must be at least ${
            rules.minLength
          } characters`;
        isValid = false;
      }
      if (
        rules.maxLength !== undefined &&
        String(value).length > rules.maxLength
      ) {
        errors[field] =
          rules.maxLengthMessage ||
          `${formatFieldName(field)} must be no more than ${
            rules.maxLength
          } characters`;
        isValid = false;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] =
          rules.patternMessage ||
          `${formatFieldName(field)} is not in a valid format`;
        isValid = false;
      }

      // Custom validation
      if (rules.validate) {
        const customError = rules.validate(value, data);
        if (customError) {
          errors[field] = customError;
          isValid = false;
        }
      }
    }
  });

  return { errors, isValid };
}

/**
 * Get a nested value from an object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {String} path - Path to the value using dot notation
 * @returns {*} - Value at the path or undefined
 */
function getNestedValue(obj, path) {
  return path
    .split(".")
    .reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
}

/**
 * Check if a value is empty (undefined, null, empty string, or empty array)
 * @param {*} value - Value to check
 * @returns {Boolean} - True if the value is empty
 */
function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Format a field name for error messages (convert camelCase to words)
 * @param {String} field - Field name
 * @returns {String} - Formatted field name
 */
function formatFieldName(field) {
  // Handle nested fields (take the last part after dot)
  const baseName = field.includes(".") ? field.split(".").pop() : field;

  // Convert camelCase to space-separated words and capitalize first letter
  return baseName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Check if a value is a valid number
 * @param {*} value - Value to check
 * @returns {Boolean} - True if the value is a valid number
 */
function isValidNumber(value) {
  return !isNaN(Number(value));
}

/**
 * Check if a value is a valid email
 * @param {String} value - Value to check
 * @returns {Boolean} - True if the value is a valid email
 */
function isValidEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(value).toLowerCase());
}

/**
 * Create common validation schemas for reuse
 */
export const ValidationSchemas = {
  listing: {
    title: {
      required: true,
      maxLength: 100,
    },
    description: {
      required: true,
      minLength: 20,
    },
    price: {
      required: true,
      type: "number",
      min: 0,
    },
    propertyType: {
      required: true,
    },
    listingType: {
      required: true,
    },
    bedrooms: {
      type: "number",
      min: 0,
    },
    bathrooms: {
      type: "number",
      min: 0,
    },
    address: {
      required: true,
    },
    city: {
      required: true,
    },
    state: {
      required: true,
    },
  },
  user: {
    name: {
      required: true,
      maxLength: 100,
    },
    email: {
      required: true,
      type: "email",
    },
    phone: {
      pattern: /^[+\d\s()-]{7,20}$/,
      patternMessage: "Please enter a valid phone number",
    },
  },
  contact: {
    name: {
      required: true,
    },
    email: {
      required: true,
      type: "email",
    },
    message: {
      required: true,
      minLength: 10,
    },
  },
};

/**
 * Input validation utility functions
 * Used to validate and sanitize inputs throughout the application
 */

// Validation error
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Sanitize a string to prevent XSS
 */
export function sanitizeString(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate phone number
 */
export function isValidPhone(phone) {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(String(phone));
}

/**
 * Validate listing query parameters
 */
export function validateListingQuery(query) {
  if (!query) return;

  // Validate numeric parameters
  const numericParams = [
    "minPrice",
    "maxPrice",
    "bedrooms",
    "bathrooms",
    "page",
    "limit",
  ];
  numericParams.forEach((param) => {
    if (query[param] && !/^\d+$/.test(query[param])) {
      throw new ValidationError(`Invalid ${param}: Must be a positive number`);
    }
  });

  // Validate string parameters (prevent injection)
  const stringParams = ["type", "city", "state"];
  stringParams.forEach((param) => {
    if (query[param] && !/^[a-zA-Z0-9 ,\-]+$/i.test(query[param])) {
      throw new ValidationError(
        `Invalid ${param}: Contains invalid characters`
      );
    }
  });

  // Validate sort parameter
  if (query.sort && !/^[a-zA-Z0-9_\-]+(:(asc|desc))?$/.test(query.sort)) {
    throw new ValidationError("Invalid sort parameter");
  }

  return true;
}

/**
 * Validate user input for properties
 */
export function validatePropertyInput(property) {
  const errors = {};

  // Required fields
  if (!property.title || property.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters";
  }

  if (!property.price || isNaN(property.price)) {
    errors.price = "Valid price is required";
  } else if (property.price < 0) {
    errors.price = "Price cannot be negative";
  }

  // Validate location
  if (!property.location || !property.location.city) {
    errors.location = "City is required";
  }

  if (
    !property.type ||
    !["house", "apartment", "condo", "townhouse", "land"].includes(
      property.type
    )
  ) {
    errors.type = "Valid property type is required";
  }

  // If there are errors, throw them
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(JSON.stringify(errors));
  }

  return true;
}

/**
 * Sanitize property object
 */
export function sanitizeProperty(property) {
  return {
    ...property,
    title: sanitizeString(property.title),
    description: sanitizeString(property.description),
    location: property.location
      ? {
          city: sanitizeString(property.location.city),
          state: sanitizeString(property.location.state),
          address: sanitizeString(property.location.address),
        }
      : {},
  };
}
