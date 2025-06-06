﻿/**
 * Simple health check endpoint for the API
 *
 * This endpoint is used by the API resilience layer to determine if the
 * server is up and available. It returns a simple 200 status code with
 * additional information about the database connection if available.
 */

import { checkDBConnection } from "../../lib/db";

export default async function handler(req, res) {
  // Basic health status
  const healthStatus = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  // Check if this is a detailed health check
  if (req.query.detail === "true") {
    try {
      // Check database connection status
      const dbStatus = await checkDBConnection();
      healthStatus.database = dbStatus;
    } catch (error) {
      healthStatus.database = {
        status: "error",
        error: error.message,
      };
    }

    // Add environment information
    healthStatus.environment = process.env.NODE_ENV || "development";
  }

  // Add cache control headers to prevent caching
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Return success
  res.status(200).json(healthStatus);
}
