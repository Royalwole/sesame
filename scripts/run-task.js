#!/usr/bin/env node

/**
 * Task Runner Script
 *
 * This script allows scheduled tasks to be executed from command line or scheduled jobs.
 * It handles environment setup, task discovery, execution, and logging.
 *
 * Usage:
 *   node scripts/run-task.js <task-name> [options]
 *
 * Examples:
 *   node scripts/run-task.js process-expired-permissions
 *   node scripts/run-task.js process-expired-resource-permissions --verbose
 */

// Load environment variables
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const { logger } = require("../lib/error-logger");

// Get task name from command line
const taskName = process.argv[2];

if (!taskName) {
  console.error("Error: Task name is required");
  console.error("Usage: node run-task.js <task-name>");
  process.exit(1);
}

// Optional command line arguments
const verbose = process.argv.includes("--verbose");
const dryRun = process.argv.includes("--dry-run");

// Find task module
const taskPath = path.resolve(__dirname, `../lib/tasks/${taskName}.js`);

// Verify task exists
if (!fs.existsSync(taskPath)) {
  console.error(`Error: Task "${taskName}" not found at ${taskPath}`);
  process.exit(1);
}

// Log start
logger.info(`Starting scheduled task: ${taskName}`, {
  taskName,
  timestamp: new Date().toISOString(),
  dryRun,
});

console.log(
  `[${new Date().toISOString()}] Executing task: ${taskName}${dryRun ? " (DRY RUN)" : ""}`
);

async function runTask() {
  try {
    // Import task module
    const taskModule = require(taskPath);

    // Determine which function to call
    let taskFunction;
    if (typeof taskModule === "function") {
      taskFunction = taskModule;
    } else if (taskModule.default && typeof taskModule.default === "function") {
      taskFunction = taskModule.default;
    } else if (
      taskName.startsWith("process-expired") &&
      taskModule.processExpiredPermissions
    ) {
      taskFunction = taskModule.processExpiredPermissions;
    } else if (
      taskName.startsWith("process-expired-resource") &&
      taskModule.processExpiredResourcePermissions
    ) {
      taskFunction = taskModule.processExpiredResourcePermissions;
    } else if (
      taskName.startsWith("process-expired-resource") &&
      taskModule.processAllExpiredResourcePermissions
    ) {
      taskFunction = taskModule.processAllExpiredResourcePermissions;
    } else if (taskModule.run) {
      taskFunction = taskModule.run;
    } else if (taskModule.execute) {
      taskFunction = taskModule.execute;
    } else if (taskModule.main) {
      taskFunction = taskModule.main;
    } else {
      throw new Error(`Could not identify task function in module ${taskName}`);
    }

    // Execute the task
    const result = await taskFunction({ dryRun, verbose });

    // Log completion
    logger.info(`Task ${taskName} completed successfully`, {
      taskName,
      result,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `[${new Date().toISOString()}] Task ${taskName} completed successfully`
    );

    if (verbose) {
      console.log("Result:", result);
    }

    process.exit(0);
  } catch (error) {
    // Log error
    logger.error(`Task ${taskName} failed`, {
      taskName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    console.error(
      `[${new Date().toISOString()}] Task ${taskName} failed: ${error.message}`
    );
    console.error(error.stack);

    process.exit(1);
  }
}

runTask();
