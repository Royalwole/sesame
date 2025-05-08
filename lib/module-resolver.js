/**
 * Module resolver utility
 * Helps debug and resolve module import issues
 */

// Track module resolution attempts to identify cyclical dependencies
const resolutionAttempts = new Map();

/**
 * Safe import wrapper that provides better error messages
 *
 * @param {string} modulePath - Path to the module to import
 * @param {Object} options - Import options
 * @returns {Promise<any>} - The imported module
 */
export async function safeImport(modulePath, options = {}) {
  const { fallback, silent = false } = options;

  try {
    if (resolutionAttempts.has(modulePath)) {
      const count = resolutionAttempts.get(modulePath);
      if (count > 3) {
        console.warn(
          `Potential circular dependency detected when importing: ${modulePath}`
        );
      }
      resolutionAttempts.set(modulePath, count + 1);
    } else {
      resolutionAttempts.set(modulePath, 1);
    }

    const module = await import(modulePath);
    resolutionAttempts.delete(modulePath);
    return module;
  } catch (error) {
    if (!silent) {
      console.error(`Error importing module "${modulePath}":`, error.message);
    }

    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}

/**
 * Check if a module exists and can be imported
 *
 * @param {string} modulePath - Path to the module to check
 * @returns {Promise<boolean>} - Whether the module can be imported
 */
export async function moduleExists(modulePath) {
  try {
    await import(modulePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get information about installed modules using fs instead of require
 * This avoids issues with mixed ESM/CommonJS modules
 *
 * @returns {Object} Module information
 */
export function getModuleInfo() {
  // Use a safer way to get version info that works in ESM context
  const getPackageVersion = (packageName) => {
    try {
      // For server environment
      if (typeof window === "undefined") {
        const fs = require("fs");
        const path = require("path");

        try {
          // Find package in node_modules
          const packagePath = path.resolve(
            process.cwd(),
            "node_modules",
            packageName,
            "package.json"
          );
          if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(
              fs.readFileSync(packagePath, "utf8")
            );
            return packageJson.version;
          }
        } catch (e) {
          console.warn(`Error reading ${packageName} package.json:`, e.message);
        }
      }

      // Fallback
      return "unknown";
    } catch (error) {
      return "unknown";
    }
  };

  // Special handling for Firebase which uses a modular architecture
  const getFirebaseVersion = () => {
    try {
      if (typeof window === "undefined") {
        const fs = require("fs");
        const path = require("path");

        // Check firebase/app module first (which is what we actually use)
        const fbAppPath = path.resolve(
          process.cwd(),
          "node_modules",
          "firebase",
          "app",
          "package.json"
        );
        if (fs.existsSync(fbAppPath)) {
          const packageJson = JSON.parse(fs.readFileSync(fbAppPath, "utf8"));
          return packageJson.version;
        }

        // Fallback to parent firebase package
        const fbPath = path.resolve(
          process.cwd(),
          "node_modules",
          "firebase",
          "package.json"
        );
        if (fs.existsSync(fbPath)) {
          const packageJson = JSON.parse(fs.readFileSync(fbPath, "utf8"));
          return packageJson.version;
        }
      }
      return "unknown";
    } catch (error) {
      return "unknown";
    }
  };

  return {
    nextVersion: getPackageVersion("next"),
    reactVersion: getPackageVersion("react"),
    firebaseVersion: getFirebaseVersion(), // Using the special Firebase version getter
    mongooseVersion: getPackageVersion("mongoose"),
    nodeVersion: process.version || "unknown",
    environment: process.env.NODE_ENV || "unknown",
  };
}

export default {
  safeImport,
  moduleExists,
  getModuleInfo,
};
