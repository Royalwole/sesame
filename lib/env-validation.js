/**
 * Environment variable validation
 */
export function validateEnv() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "MONGODB_URI",
  ];

  // Fix: Log warnings instead of errors in production
  const logLevel = process.env.NODE_ENV === "production" ? "warn" : "error";
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) =>
      typeof process.env[envVar] === "undefined" || process.env[envVar] === ""
  );

  if (missingEnvVars.length > 0) {
    const message = `Missing required environment variables: ${missingEnvVars.join(
      ", "
    )}`;

    if (logLevel === "error") {
      console.error(`Error: ${message}`);
      console.error(
        "Please check your .env file and make sure all required variables are set."
      );
    } else {
      console.warn(`Warning: ${message}`);
    }

    // Only exit in development to avoid crashes in production
    if (process.env.NODE_ENV === "development") {
      // Use a timeout to ensure the message is logged before exiting
      setTimeout(() => process.exit(1), 100);
    }
    return false;
  }

  return true;
}

// Add function to get env variables with fallbacks
export function getEnv(key, defaultValue = "") {
  return process.env[key] || defaultValue;
}
