import { validateForm, ValidationSchemas } from "../lib/validation";
import { sendValidationError } from "../lib/api-response";

/**
 * Create a validation middleware using a schema
 * @param {Object} schema - Validation schema
 * @param {String} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} - Express middleware
 */
export function validateRequest(schema, source = "body") {
  return (req, res, next) => {
    const data = req[source];
    const { errors, isValid } = validateForm(data, schema);

    if (!isValid) {
      return sendValidationError(res, errors);
    }

    next();
  };
}

/**
 * Predefined validation middlewares for common endpoints
 */
export const validateListing = validateRequest(ValidationSchemas.listing);
export const validateUser = validateRequest(ValidationSchemas.user);
export const validateContact = validateRequest(ValidationSchemas.contact);

/**
 * Validate specific fields in a request
 * @param {Array<String>} fields - Fields to validate
 * @param {Object} schema - Validation schema
 * @param {String} source - Request property to validate
 * @returns {Function} - Express middleware
 */
export function validateFields(
  fields,
  schema = ValidationSchemas.listing,
  source = "body"
) {
  return (req, res, next) => {
    const data = req[source];
    const fieldSchema = {};

    // Create a subset schema with only the specified fields
    fields.forEach((field) => {
      if (schema[field]) {
        fieldSchema[field] = schema[field];
      }
    });

    const { errors, isValid } = validateForm(data, fieldSchema);

    if (!isValid) {
      return sendValidationError(res, errors);
    }

    next();
  };
}
