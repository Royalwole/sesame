/**
 * Resource Permission Expiration Processor
 *
 * This script identifies and removes expired resource-level permissions.
 * It should be run as a scheduled task (e.g., daily) to ensure resource permissions
 * are properly removed when they expire.
 */

import { processExpiredResourcePermissions } from "../resource-permissions";
import { logger } from "../error-logger";
import { connectDB, disconnectDB } from "../db";

/**
 * Process expired resource permissions
 * @returns {Promise<Object>} Results of the processing
 */
export async function processAllExpiredResourcePermissions() {
  logger.info("Starting expired resource permissions processing job");

  try {
    // Ensure DB connection
    await connectDB();

    // Run the processing function
    const results = await processExpiredResourcePermissions();

    logger.info("Completed expired resource permissions processing", results);

    return {
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error processing expired resource permissions", {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await disconnectDB();
  }
}

// Allow direct execution from command line
if (require.main === module) {
  processAllExpiredResourcePermissions()
    .then((results) => {
      console.log("Completed processing expired resource permissions:");
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error processing expired resource permissions:", error);
      process.exit(1);
    });
}
