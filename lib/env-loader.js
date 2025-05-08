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

// Keep track of whether we've already loaded the environment
let isEnvLoaded = false;
let cachedEnvConfig = null;

/**
 * Load environment variables from .env files
 * This ensures they're available for utilities that don't
 * automatically get Next.js environment variables
 */
export function loadEnvConfig(
  dir = process.cwd(),
  dev = process.env.NODE_ENV !== "production"
) {
  // Skip if we're in the browser or already loaded
  if (typeof window !== "undefined") {
    return { loadedEnvs: {}, loadedFiles: [] };
  }

  // Return cached config if already loaded
  if (isEnvLoaded && cachedEnvConfig) {
    return cachedEnvConfig;
  }

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
  const loadedFiles = [];

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

        loadedFiles.push(envFile);
        console.log(`Loaded environment from ${envFile}`);
      }
    } catch (error) {
      console.error(
        `Error loading environment from ${envFile}:`,
        error.message
      );
    }
  }

  isEnvLoaded = true;
  cachedEnvConfig = { loadedEnvs, loadedFiles };
  return cachedEnvConfig;
}

// Only auto-load in server context, not during HMR on client
export const envConfig =
  typeof window === "undefined"
    ? loadEnvConfig()
    : { loadedEnvs: {}, loadedFiles: [] };
