/**
 * Environment variables loader
 * Ensures environment variables are properly loaded for both server and client
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Environment configurations to check in priority order
const ENV_FILES = [
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  ".env.development",
  ".env.production",
  ".env",
];

/**
 * Load environment variables from .env files
 * This ensures they're available for utilities that don't
 * automatically get Next.js environment variables
 */
export function loadEnvConfig(
  dir = process.cwd(),
  dev = process.env.NODE_ENV !== "production"
) {
  const envFiles = ENV_FILES.filter((file) => {
    // Only include development files in dev mode
    if (file.includes("development") && !dev) {
      return false;
    }
    // Only include production files in production
    if (file.includes("production") && dev) {
      return false;
    }
    return true;
  });

  // Load each environment file in order
  const loadedEnvs = {};

  for (const envFile of envFiles) {
    const envFilePath = path.join(dir, envFile);

    try {
      if (fs.existsSync(envFilePath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

        // Add each variable to process.env if not already set
        Object.entries(envConfig).forEach(([key, value]) => {
          if (process.env[key] === undefined) {
            process.env[key] = value;
            loadedEnvs[key] = true;
          }
        });

        console.log(`Loaded environment from ${envFile}`);
      }
    } catch (error) {
      console.error(
        `Error loading environment from ${envFile}:`,
        error.message
      );
    }
  }

  return {
    loadedEnvs,
    loadedFiles: Object.values(envFiles).filter((file) =>
      fs.existsSync(path.join(dir, file))
    ),
  };
}

// Automatically load environment variables when imported
export const envConfig = loadEnvConfig();
