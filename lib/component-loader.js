/**
 * Component importing helper for consistent imports across the project
 * This utility ensures components are imported properly regardless of file extension
 */
import React from "react";

/**
 * Import a React component consistently
 * @param {string} path - Path to the component
 * @returns {React.ComponentType} - The imported component
 */
export function importReactComponent(path) {
  // Check if we're in a browser or Node environment
  const isClient = typeof window !== "undefined";

  // In client-side rendering, we can use dynamic imports
  if (isClient) {
    return React.lazy(() => dynamicImportWithFallback(path));
  } else {
    // For server-side rendering, we should use synchronous imports
    return requireWithFallback(path);
  }
}

/**
 * Dynamic import with extension fallbacks
 * @param {string} path - Module path
 * @returns {Promise<any>} - Imported module
 */
async function dynamicImportWithFallback(path) {
  try {
    return await import(path);
  } catch (e) {
    // Try various extensions
    const extensions = [".jsx", ".js", ".tsx", ".ts"];
    const basePathWithoutExt = path.replace(/\.\w+$/, "");

    for (const ext of extensions) {
      try {
        return await import(`${basePathWithoutExt}${ext}`);
      } catch (innerErr) {
        // Continue to next extension
      }
    }

    // If all attempts fail, throw the original error
    throw e;
  }
}

/**
 * Synchronous require with extension fallbacks
 * @param {string} path - Module path
 * @returns {any} - Required module
 */
function requireWithFallback(path) {
  try {
    return require(path);
  } catch (e) {
    // Try various extensions
    const extensions = [".jsx", ".js", ".tsx", ".ts"];
    const basePathWithoutExt = path.replace(/\.\w+$/, "");

    for (const ext of extensions) {
      try {
        return require(`${basePathWithoutExt}${ext}`);
      } catch (innerErr) {
        // Continue to next extension
      }
    }

    // If all attempts fail, throw the original error
    throw e;
  }
}

/**
 * Create a lazy-loadable component with proper error handling
 * @param {Function} importFn - Import function like () => import('./Component')
 * @returns {React.ComponentType} - Lazy-loaded component
 */
export function lazyComponent(importFn) {
  return React.lazy(() =>
    importFn().catch((e) => {
      console.error("Failed to load component:", e);
      return {
        default: () => <div className="error">Failed to load component</div>,
      };
    })
  );
}
