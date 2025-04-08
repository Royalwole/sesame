import { withErrorHandling } from "../lib/api-utils";
import { validateRequest } from "../middlewares/validation";
import { ValidationSchemas } from "../lib/validation";

/**
 * Creates an API handler with optional validation and error handling.
 *
 * @param {Function} handler - The API handler function to be wrapped.
 * @param {Object} [validationSchema] - Optional validation schema for request data.
 * @returns {Function} The wrapped handler function with validation (if provided) and error handling.
 */
export function createApiHandler(handler, validationSchema = null) {
  if (validationSchema) {
    // If a validation schema is provided, wrap the handler with validation middleware
    return withErrorHandling(validateRequest(validationSchema)(handler));
  }
  // If no validation schema is provided, wrap the handler with error handling only
  return withErrorHandling(handler);
}

/**
 * Creates a resource-specific API handler with validation and error handling.
 *
 * @param {string} resource - The name of the resource (e.g., 'listing', 'user').
 * @returns {Function} A function that takes a handler and returns the wrapped handler with resource-specific validation.
 */
export function createResourceApiHandler(resource) {
  // Retrieve the validation schema for the specified resource
  const schema = ValidationSchemas[resource];
  if (!schema) {
    // Throw an error if the validation schema for the resource is not defined
    throw new Error(`Validation schema for ${resource} is not defined`);
  }
  // Return a function that wraps the handler with the resource-specific validation schema
  return (handler) => createApiHandler(handler, schema);
}

// Prebuilt handlers for specific resources
export const listingApiHandler = createResourceApiHandler("listing");
export const userApiHandler = createResourceApiHandler("user");

// Example of how to add a new resource handler (e.g., for agents)
// export const agentApiHandler = createResourceApiHandler('agent');
