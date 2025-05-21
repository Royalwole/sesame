/**
 * Environment variables loader
 * Ensures environment variables are properly loaded for both server and client
 */

// IMPORTANT: Detect browser environment early with all possible checks
// This ensures no server-only code is ever included in client bundles
const isBrowser =
  typeof window !== "undefined" ||
  (typeof process !== "undefined" && process.browser) ||
  (typeof navigator !== "undefined" &&
    (navigator.product === "ReactNative" ||
      navigator.userAgent.includes("Node.js") === false));

// Create module placeholders - these will only be used in server context
// Webpack will completely exclude this code from browser bundles when properly configured
const serverModules = isBrowser
  ? null
  : (() => {
      // Only executed in a server environment
      try {
        return {
          dotenv: require("dotenv"),
          path: require("path"),
          fs: require("fs"),
        };
      } catch (e) {
        console.error("Failed to load server modules:", e);
        return { dotenv: null, path: null, fs: null };
      }
    })();

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
 *
 * IMPORTANT: This function will only execute its main logic on the server
 */
export function loadEnvConfig(
  dir = typeof process !== "undefined"
    ? process.cwd
      ? process.cwd()
      : ""
    : "",
  dev = typeof process !== "undefined"
    ? process.env?.NODE_ENV !== "production"
    : false
) {
  // Skip if we're in the browser - return empty object
  if (isBrowser) {
    return { loadedEnvs: {}, loadedFiles: [] };
  }

  // Return cached config if already loaded
  if (isEnvLoaded && cachedEnvConfig) {
    return cachedEnvConfig;
  }

  // Safety check - if server modules aren't available, return empty
  if (
    !serverModules ||
    !serverModules.fs ||
    !serverModules.path ||
    !serverModules.dotenv
  ) {
    console.warn("Server modules not available, cannot load env config");
    return { loadedEnvs: {}, loadedFiles: [] };
  }

  // Extract server modules for cleaner code
  const { fs, path, dotenv } = serverModules;

  // Since we're in a server environment, we can safely use these modules
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
    // Only execute this in a server environment
    try {
      const envFilePath = path.join(dir, envFile);

      if (fs.existsSync(envFilePath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envFilePath));

        // Add each variable to process.env if not already set
        Object.entries(envConfig).forEach(([key, value]) => {
          if (process.env[key] === undefined) {
            process.env[key] = value;
            loadedEnvs[key] = value;
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

/**
 * Get environment variables that are safe to use on the client
 * Filters out server-only environment variables
 * @returns {Object} Client-safe environment variables
 */
export function getClientEnv() {
  // Only include environment variables prefixed with NEXT_PUBLIC_
  const clientEnv = {};

  if (typeof process !== "undefined" && process.env) {
    try {
      Object.keys(process.env).forEach((key) => {
        if (key.startsWith("NEXT_PUBLIC_")) {
          clientEnv[key] = process.env[key];
        }
      });
    } catch (e) {
      console.warn("Error accessing process.env:", e.message);
    }
  }

  return clientEnv;
}

// Barrier function to ensure server-only code is never bundled for the browser
// Code inside this function will be tree-shaken away in browser bundles
function serverOnlyCode() {
  if (isBrowser) return { loadedEnvs: {}, loadedFiles: [] };
  return loadEnvConfig();
}

// Use a ternary with a condition that can be statically analyzed by Webpack
// This ensures the serverOnlyCode() function is completely removed from browser bundles
export const envConfig = isBrowser
  ? { loadedEnvs: {}, loadedFiles: [] }
  : serverOnlyCode();

// Export client-safe environment for browser usage
export const clientSafeEnv = getClientEnv();
