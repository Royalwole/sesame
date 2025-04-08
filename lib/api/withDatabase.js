import { connectDB, disconnectDB } from "../db";

/**
 * Higher-order function to handle database connections for API routes
 * Includes connection management, error handling, and timing
 *
 * @param {Function} handler - The API route handler function
 * @returns {Function} - Enhanced handler with database connection management
 */
export function withDatabase(handler) {
  return async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(
      `[API:${requestId}] Processing ${req.method} request to ${req.url}`
    );

    let dbConnection = false;
    const startTime = Date.now();

    try {
      // Connect to database with retries
      let connected = false;
      let retries = 0;
      const maxRetries = 3;

      while (!connected && retries < maxRetries) {
        try {
          console.log(
            `[API:${requestId}] Connecting to database (attempt ${retries + 1})...`
          );
          await connectDB();
          connected = true;
          dbConnection = true;
          console.log(`[API:${requestId}] Database connection successful`);
        } catch (dbError) {
          retries++;
          console.error(
            `[API:${requestId}] Database connection error (attempt ${retries}):`,
            dbError
          );

          if (retries >= maxRetries) {
            throw new Error(
              `Database connection failed after ${maxRetries} attempts: ${dbError.message}`
            );
          }

          // Wait before retrying with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 500 * Math.pow(2, retries))
          );
        }
      }

      // Set response header to track database connection time
      if (res.setHeader) {
        res.setHeader("X-DB-Connection-Time", `${Date.now() - startTime}ms`);
      }

      // Call the original handler with additional context
      return await handler(req, res, { requestId });
    } catch (error) {
      console.error(`[API:${requestId}] Error:`, error);

      // Determine if this is a database-related error
      const isDbError =
        error.message &&
        (error.message.includes("database") ||
          error.message.includes("mongo") ||
          error.name === "MongoError" ||
          error.name === "MongoNetworkError" ||
          error.name === "MongoServerSelectionError");

      // Return appropriate error response
      if (!res.headersSent) {
        res.status(isDbError ? 503 : 500).json({
          success: false,
          error: isDbError ? "Database connection error" : "Server error",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred",
        });
      }
    } finally {
      // Track request completion time
      const totalTime = Date.now() - startTime;
      console.log(`[API:${requestId}] Request completed in ${totalTime}ms`);

      // Disconnect from database if connected (but not in development to reuse the connection)
      if (dbConnection && process.env.NODE_ENV === "production") {
        try {
          await disconnectDB();
          console.log(`[API:${requestId}] Database disconnected successfully`);
        } catch (disconnectError) {
          console.error(
            `[API:${requestId}] Error disconnecting from database:`,
            disconnectError
          );
        }
      }
    }
  };
}
