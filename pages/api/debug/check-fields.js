export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only endpoint" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // This function only parses JSON, not form data
  const data = req.body;

  // Extract all fields and log them
  const extractedFields = {};
  const errors = [];

  // Check required fields
  const requiredFields = ["address", "city", "state", "title", "price"];

  for (const field of requiredFields) {
    if (
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      errors.push({
        field,
        message: `${field} is required`,
      });
    }
    extractedFields[field] = data[field];
  }

  // Return the parsed fields and validation status
  return res.status(errors.length > 0 ? 400 : 200).json({
    success: errors.length === 0,
    fields: extractedFields,
    errors: errors.length > 0 ? errors : undefined,
  });
}
