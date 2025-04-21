// Environment variable utilities for both client and server
// The dotenv package only works on the server side

// Don't try to import dotenv on client side
const isServer = typeof window === "undefined";

// Load environment variables from .env file (server-side only)
export function loadEnvConfig() {
  // On the server side, we can use dotenv
  if (isServer) {
    try {
      // Dynamic import to avoid client-side issues
      const dotenv = require("dotenv");
      const path = require("path");

      const result = dotenv.config({
        path: path.resolve(process.cwd(), ".env"),
      });

      if (result.error) {
        console.error("Error loading .env file:", result.error);
        return false;
      }

      console.log(
        "✅ Environment variables loaded from .env file (server-side)"
      );
    } catch (err) {
      console.error("Failed to load .env file:", err);
      return false;
    }
  } else {
    // Client-side: Next.js automatically injects env vars prefixed with NEXT_PUBLIC_
    console.log("📱 Client-side environment check");
  }

  return true;
}

// Safe environment variable getter that works on both client and server
export function getEnv(key, fallback = "") {
  // In the browser, we can only access NEXT_PUBLIC_ variables
  if (!isServer && !key.startsWith("NEXT_PUBLIC_")) {
    console.warn(`Cannot access non-public env var '${key}' on the client`);
    return fallback;
  }

  // Return from process.env or fallback value
  return (
    (typeof process !== "undefined" && process.env && process.env[key]) ||
    fallback
  );
}

// Environment detection utilities
export const isDev = process.env.NODE_ENV !== "production";
export const isProd = process.env.NODE_ENV === "production";
export const isTest = process.env.NODE_ENV === "test";
