/**
 * Helper utility for importing components to handle extension resolution
 * Use this if you encounter extension resolution issues with direct imports
 *
 * Example usage:
 * import { importComponent, lazyComponent } from '../lib/module-loader';
 *
 * // For synchronous imports:
 * const MyComponent = importComponent('./components/MyComponent');
 *
 * // For React.lazy compatible imports:
 * const LazyComponent = lazyComponent(() => import('./components/MyComponent'));
 */

/**
 * Synchronous import resolution helper with fallbacks for various extensions
 * @param {string} path - Base path to the component without extension
 * @returns {Object} - The imported component module
 */
export function importComponent(path) {
  // First try direct import (if the path already includes an extension)
  if (/\.(js|jsx|ts|tsx)$/.test(path)) {
    return safeRequire(path);
  }

  // Try different extensions in order of preference
  const extensions = [".jsx", ".js", ".tsx", ".ts"];

  for (const ext of extensions) {
    const module = safeRequire(`${path}${ext}`);
    if (module) return module;
  }

  // Last resort, try without extension
  const directModule = safeRequire(path);
  if (directModule) return directModule;

  // If we get here, we couldn't find the module
  console.error(`Failed to import component: ${path}`);
  throw new Error(`Component not found: ${path}`);
}

/**
 * Helper for React.lazy compatible dynamic imports with extension fallbacks
 * @param {Function} importFn - Import function like () => import('./path')
 * @returns {Function} - Enhanced import function with extension fallbacks
 */
export function lazyComponent(importFn) {
  return React.lazy(() => {
    try {
      return importFn();
    } catch (e) {
      // Extract path from the import function string representation
      const fnStr = importFn.toString();
      const match = fnStr.match(/import\(['"](.+)['"]\)/);

      if (!match) {
        console.error("Failed to parse import path from function", e);
        throw e;
      }

      const basePath = match[1];
      const extensions = [".jsx", ".js", ".tsx", ".ts"];

      // Try with different extensions
      let lastError = e;
      for (const ext of extensions) {
        try {
          const altPath = basePath.replace(/\.\w+$|$/, ext);
          return import(/* @vite-ignore */ altPath);
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      console.error(`Failed to lazy load component: ${basePath}`, lastError);
      throw lastError;
    }
  });
}

/**
 * Safe require helper that doesn't throw on module not found
 * @param {string} path - Path to require
 * @returns {Object|null} - The module or null if not found
 */
function safeRequire(path) {
  try {
    return require(path);
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      return null;
    }
    throw e;
  }
}
