#!/usr/bin/env node

/**
 * Initialize Permission Bundles
 *
 * This script initializes the default permission bundles in the system.
 * It can be run during deployment or system setup to ensure the basic
 * bundle structure exists.
 */

require("dotenv").config();
const fetch = require("node-fetch");
const { logger } = require("../lib/error-logger");
const { initializeDefaultBundles } = require("../lib/permission-bundles");

async function main() {
  console.log("Initializing default permission bundles...");

  try {
    // Method 1: Using the API (if running the server)
    if (process.env.USE_API === "true") {
      await initializeViaAPI();
    }
    // Method 2: Direct database access (more reliable for setup scripts)
    else {
      await initializeDirect();
    }

    console.log("Permission bundles initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing permission bundles:", error);
    logger.error("Permission bundle initialization failed", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

async function initializeViaAPI() {
  console.log("Initializing permission bundles via API...");

  // Get admin token for API access
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (!adminToken) {
    throw new Error(
      "ADMIN_API_TOKEN environment variable is required when USE_API=true"
    );
  }

  // Get API URL, defaulting to localhost if not specified
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const url = `${apiBaseUrl}/api/admin/permission-bundles`;

  // Call the API
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ initialize: true }),
  });

  // Parse and validate response
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || `API returned error status: ${response.status}`
    );
  }

  console.log(`Created ${data.createdCount} bundles via API`);
  return data;
}

async function initializeDirect() {
  console.log("Initializing permission bundles directly...");

  // Call the library function directly
  const result = await initializeDefaultBundles();

  console.log(`Created ${result} bundles directly`);
  return { success: true, createdCount: result };
}

// Run the script
main();
