/**
 * Module validation script
 * Checks that all modules can be imported and validates webpack configuration
 * Run with: node scripts/validate-modules.js
 */

const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execPromise = promisify(exec);

// Core modules to test
const CORE_MODULES = [
  // Next.js core
  "next",
  "react",
  "react-dom",

  // Key libraries
  "mongoose",
  // Replace the generic firebase with specific submodules that are actually used
  "firebase/app",
  "firebase/storage",
  "@clerk/nextjs",

  // Project modules - use absolute paths for reliability
  "./lib/db.js",
  "./lib/firebase-config.js",
  "./lib/blob.js",
];

// File extensions to search for
const EXT_PATTERN = /\.(js|jsx|mjs)$/;

// Directories to ignore
const IGNORE_DIRS = ["node_modules", ".next", "out", ".git", "public"];

/**
 * Validate if a module can be required
 */
async function validateModule(moduleName) {
  try {
    // For project modules, use absolute path
    const modulePath = moduleName.startsWith("./")
      ? path.join(process.cwd(), moduleName)
      : moduleName;

    // Instead of dynamic import, use require.resolve to check if module exists
    const tempFile = path.join(process.cwd(), "temp-module-check.js");

    // Create a temporary file that will check if module can be resolved
    await fs.writeFile(
      tempFile,
      `
      try {
        require.resolve('${moduleName.replace(/\\/g, "\\\\")}');
        console.log(JSON.stringify({ success: true, module: '${moduleName}' }));
      } catch (error) {
        console.log(JSON.stringify({ 
          success: false, 
          module: '${moduleName}', 
          error: error.message 
        }));
      }
      `
    );

    // Execute the temporary file
    const { stdout } = await execPromise(`node ${tempFile}`);

    // Clean up
    await fs.unlink(tempFile).catch(() => {});

    // Parse the result
    try {
      return JSON.parse(stdout.trim());
    } catch (parseError) {
      return {
        success: false,
        module: moduleName,
        error: `Failed to parse result: ${parseError.message}. Output: ${stdout}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      module: moduleName,
      error: error.message,
    };
  }
}

async function findImports(directory) {
  const results = {
    files: 0,
    imports: [],
    errors: [],
  };

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory() && !IGNORE_DIRS.includes(entry.name)) {
        // Recursively scan subdirectories
        const subResults = await findImports(fullPath);
        results.files += subResults.files;
        results.imports = [...results.imports, ...subResults.imports];
        results.errors = [...results.errors, ...subResults.errors];
      } else if (entry.isFile() && EXT_PATTERN.test(entry.name)) {
        results.files++;

        try {
          // Read file content
          const content = await fs.readFile(fullPath, "utf8");

          // Find import statements
          const importRegex =
            /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
          let match;

          while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];

            // Track only relative imports or specific packages
            if (
              importPath.startsWith(".") ||
              importPath.startsWith("@/") ||
              !importPath.includes("/")
            ) {
              results.imports.push({
                file: fullPath.replace(process.cwd(), ""),
                import: importPath,
              });
            }
          }
        } catch (error) {
          results.errors.push({
            file: fullPath.replace(process.cwd(), ""),
            error: error.message,
          });
        }
      }
    }
  } catch (error) {
    results.errors.push({
      directory,
      error: error.message,
    });
  }

  return results;
}

async function checkWebpackConfig() {
  console.log("Checking Next.js webpack configuration...");

  try {
    // Check if webpack config exists in next.config.js
    const nextConfigPath = path.join(process.cwd(), "next.config.js");
    const configContent = await fs.readFile(nextConfigPath, "utf8");

    const hasWebpackConfig =
      configContent.includes("webpack:") || configContent.includes("webpack =");

    if (!hasWebpackConfig) {
      console.warn("⚠️ No webpack configuration found in next.config.js");
    } else {
      console.log("✅ Webpack configuration found in next.config.js");

      // Check for common webpack configurations
      const hasFallbacks = configContent.includes("fallback");
      const hasResolve = configContent.includes("resolve");
      const hasSvgr = configContent.includes("@svgr/webpack");

      console.log(
        `✅ Fallbacks configuration: ${hasFallbacks ? "Found" : "Not Found"}`
      );
      console.log(
        `✅ Resolve configuration: ${hasResolve ? "Found" : "Not Found"}`
      );
      console.log(
        `✅ SVGR webpack configuration: ${hasSvgr ? "Found" : "Not Found"}`
      );
    }

    return hasWebpackConfig;
  } catch (error) {
    console.error("❌ Error checking webpack configuration:", error.message);
    return false;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("Module and Webpack Validation Tool");
  console.log("=".repeat(60));
  console.log("Testing core module imports...");

  const moduleResults = [];
  for (const module of CORE_MODULES) {
    const result = await validateModule(module);
    moduleResults.push(result);

    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${module}`);
  }

  const failedModules = moduleResults.filter((r) => !r.success);

  // Check webpack configuration
  await checkWebpackConfig();

  console.log("\nScanning for imports in project files...");
  const importResults = await findImports(process.cwd());

  console.log(
    `\nFound ${importResults.files} files with ${importResults.imports.length} imports`
  );

  if (importResults.errors.length > 0) {
    console.log(
      `\n❌ Found ${importResults.errors.length} errors while scanning files:`
    );
    importResults.errors.forEach((err) => {
      console.log(`- ${err.file || err.directory}: ${err.error}`);
    });
  }

  if (failedModules.length > 0) {
    console.log("\n❌ Some core modules failed to import:");
    failedModules.forEach((module) => {
      console.log(`- ${module.module}: ${module.error}`);
    });

    console.log("\nRecommendations:");
    console.log("1. Check that all dependencies are installed (npm install)");
    console.log("2. Verify module names and paths in your import statements");
    console.log("3. Run npm run fix-deps to fix common dependency issues");
  } else {
    console.log("\n✅ All core modules imported successfully");
  }

  console.log("\nTop imported modules:");
  const importCounts = {};
  importResults.imports.forEach((imp) => {
    importCounts[imp.import] = (importCounts[imp.import] || 0) + 1;
  });

  Object.entries(importCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([module, count]) => {
      console.log(`- ${module}: ${count} imports`);
    });

  console.log("\n=".repeat(60));
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exit(1);
});
