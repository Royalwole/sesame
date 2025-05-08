/**
 * Next.js Module Helper
 * Provides utilities for working with Next.js module imports and webpack
 */

// Track if we've injected webpack event listeners
let webpackMonitorInjected = false;

/**
 * Intercept and monitor webpack compilation events
 * Call this in your _app.js or custom webpack config
 */
export function monitorWebpackCompilation() {
  // Only execute in browser and only once
  if (typeof window === "undefined" || webpackMonitorInjected) return;

  try {
    // Attach to webpack hot module replacement events
    if (module.hot) {
      webpackMonitorInjected = true;

      // Listen for build success events
      module.hot.addStatusHandler((status) => {
        if (status === "ready") {
          console.log("✅ [Webpack] Hot module replacement is ready");
        } else if (status === "idle") {
          console.log("✅ [Webpack] Build completed successfully");
        } else if (status === "check") {
          console.log("⏳ [Webpack] Checking for updates...");
        } else if (status === "apply") {
          console.log("🔄 [Webpack] Applying updates...");
        }
      });

      // Store build errors for the diagnostics API
      const originalErrorHandler = module.hot.errorHandler;
      module.hot.setOptionsAndForget({
        errorHandler: (err) => {
          console.error("❌ [Webpack] Hot module replacement error:", err);

          // Try to identify module issues
          if (err.message && err.message.includes("Cannot find module")) {
            const moduleMatch = err.message.match(
              /Cannot find module '([^']+)'/
            );
            if (moduleMatch && moduleMatch[1]) {
              console.error(`Missing module: ${moduleMatch[1]}`);
              console.error(`Try: npm install ${moduleMatch[1]}`);
            }
          }

          // Call original handler if it exists
          if (typeof originalErrorHandler === "function") {
            originalErrorHandler(err);
          }
        },
      });
    }
  } catch (error) {
    console.error("Failed to inject webpack monitors:", error);
  }
}

/**
 * Safely preload a module to ensure it's ready for use
 * @param {string} modulePath - Path to the module
 * @returns {Promise<boolean>} - Whether the module was successfully preloaded
 */
export async function preloadModule(modulePath) {
  // Skip if not in browser
  if (typeof window === "undefined") return true;

  try {
    await import(/* webpackPreload: true */ modulePath);
    return true;
  } catch (error) {
    console.error(`Failed to preload module "${modulePath}":`, error);
    return false;
  }
}

/**
 * Create a dynamic import with error handling
 * @param {string} modulePath - Path to the module
 * @param {Object} options - Import options
 * @returns {Promise<any>} - The imported module or fallback
 */
export async function dynamicImport(modulePath, options = {}) {
  const { fallback = {}, errorHandler } = options;

  try {
    return await import(modulePath);
  } catch (error) {
    if (errorHandler) {
      errorHandler(error, modulePath);
    } else {
      console.error(`Error importing "${modulePath}":`, error);
    }
    return fallback;
  }
}

/**
 * Create an import map to help with module resolution
 * @param {Object} importMap - Map of module aliases to actual paths
 * @returns {Object} - Functions to work with the import map
 */
export function createImportMap(importMap = {}) {
  const map = { ...importMap };

  return {
    /**
     * Get the actual path for an import
     * @param {string} importPath - The import path to resolve
     * @returns {string} - The resolved path
     */
    resolve(importPath) {
      return map[importPath] || importPath;
    },

    /**
     * Add entries to the import map
     * @param {Object} newEntries - New entries to add
     */
    addEntries(newEntries) {
      Object.assign(map, newEntries);
    },

    /**
     * Get all entries in the import map
     * @returns {Object} - The current import map
     */
    getEntries() {
      return { ...map };
    },

    /**
     * Import a module using the import map
     * @param {string} importPath - The import path to resolve and import
     * @param {Object} options - Import options
     * @returns {Promise<any>} - The imported module
     */
    async import(importPath, options = {}) {
      const resolvedPath = this.resolve(importPath);
      return dynamicImport(resolvedPath, options);
    },
  };
}

export default {
  monitorWebpackCompilation,
  preloadModule,
  dynamicImport,
  createImportMap,
};
