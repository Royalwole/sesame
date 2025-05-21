/**
 * This is a browser-safe version of env-loader that doesn't
 * attempt to import any Node.js modules on the client side.
 */

// Only include environment variables that are safe for the browser
export const clientSafeEnv = {};

// Add any NEXT_PUBLIC_ environment variables
if (typeof process !== "undefined" && process.env) {
  try {
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith("NEXT_PUBLIC_")) {
        clientSafeEnv[key] = process.env[key];
      }
    });
  } catch (e) {
    console.warn("Error accessing process.env:", e.message);
  }
}

// Dummy empty functions to maintain API compatibility
export function loadEnvConfig() {
  return { loadedEnvs: {}, loadedFiles: [] };
}

export function getClientEnv() {
  return clientSafeEnv;
}

export const envConfig = { loadedEnvs: {}, loadedFiles: [] };
