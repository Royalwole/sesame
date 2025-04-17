/**
 * Middleware for ensuring proper JSON responses from API routes
 */

export function withJsonResponse(handler) {
  return async (req, res) => {
    // Set JSON content type
    res.setHeader("Content-Type", "application/json");

    // Override the res.send method to ensure it always returns valid JSON
    const originalSend = res.send;
    res.send = function (body) {
      // Make sure we're sending a string
      let responseBody = body;

      // If it's not a string already, stringify it
      if (typeof body !== "string") {
        try {
          responseBody = JSON.stringify(body);
        } catch (err) {
          console.error("Failed to stringify response:", err);
          responseBody = JSON.stringify({
            error: "Internal server error",
            message: "Failed to format response",
          });
          res.status(500);
        }
      } else if (!body.startsWith("{") && !body.startsWith("[")) {
        // If it's a string but not JSON, wrap it
        responseBody = JSON.stringify({ message: body });
      }

      return originalSend.call(this, responseBody);
    };

    try {
      // Call the original handler
      return await handler(req, res);
    } catch (error) {
      console.error("API route error:", error);

      // Ensure we haven't already sent a response
      if (!res.writableEnded) {
        return res.status(500).json({
          error: "Internal server error",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Something went wrong",
        });
      }
    }
  };
}
