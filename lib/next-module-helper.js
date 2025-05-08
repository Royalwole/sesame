/**
 * Next.js Module Helper (Minimal Version)
 */

// Simple flag to prevent multiple initializations
let isInitialized = false;

/**
 * Safe monitoring function that won't interfere with React rendering
 */
export function monitorWebpackCompilation() {
  // Skip if not in browser or already initialized
  if (typeof window === "undefined" || isInitialized) return;

  // Mark as initialized
  isInitialized = true;

  // Just log a message without any webpack manipulation
  console.log("Next.js development environment detected");
}

/**
 * Registry of safe module imports
 */
const moduleRegistry = {
  react: () => import("react"),
  "react-dom": () => import("react-dom"),
  "next/router": () => import("next/router"),
  "next/image": () => import("next/image"),
  "next/link": () => import("next/link"),
};

/**
 * Safe module loading function
 */
export async function loadModule(name) {
  if (typeof window === "undefined") return null;

  try {
    if (moduleRegistry[name]) {
      return await moduleRegistry[name]();
    }
    return null;
  } catch (err) {
    console.error(`Error loading module: ${name}`);
    return null;
  }
}

/**
 * Import map for module aliasing
 */
export function createImportMap(initialMap = {}) {
  const aliases = { ...initialMap };

  return {
    resolve(name) {
      return aliases[name] || name;
    },

    add(newAliases) {
      Object.assign(aliases, newAliases);
      return this;
    },

    async load(name) {
      return loadModule(this.resolve(name));
    },
  };
}

export default {
  monitorWebpackCompilation,
  loadModule,
  createImportMap,
};
