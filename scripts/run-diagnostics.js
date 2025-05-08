/**
 * Unified diagnostics and fix script
 * Runs all validation scripts and fixes common issues
 *
 * Run with: node scripts/run-diagnostics.js [options]
 * Options:
 *   --fix: Fix common issues automatically
 *   --modules: Check module imports
 *   --webpack: Check webpack configuration
 *   --all: Run all checks (default)
 *   --help: Show help
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes("--fix"),
  modules: args.includes("--modules"),
  webpack: args.includes("--webpack"),
  help: args.includes("--help"),
};

// If no specific check is requested, run all checks
if (!options.modules && !options.webpack && !options.help) {
  options.modules = true;
  options.webpack = true;
}

// Show help if requested
if (options.help) {
  console.log("Unified diagnostics and fix script");
  console.log("Usage: node scripts/run-diagnostics.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  --fix: Fix common issues automatically");
  console.log("  --modules: Check module imports");
  console.log("  --webpack: Check webpack configuration");
  console.log("  --all: Run all checks (default)");
  console.log("  --help: Show this help");
  process.exit(0);
}

// Print header
console.log("=".repeat(60));
console.log("TopDial Diagnostics Tool");
console.log(`${new Date().toISOString()}`);
console.log("=".repeat(60));
console.log("");

/**
 * Run a command safely and handle errors
 */
function runCommand(command, options = {}) {
  const { ignoreErrors = false, silent = false } = options;

  try {
    if (!silent) console.log(`Running: ${command}`);
    const output = execSync(command, {
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
    });
    return { success: true, output };
  } catch (error) {
    if (!ignoreErrors && !silent) {
      console.error(`Error running command: ${command}`);
      console.error(error.message);
    }
    return { success: false, error };
  }
}

/**
 * Check if a Node.js module is installed
 */
function isModuleInstalled(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check for common file permission issues
 */
function checkFilePermissions() {
  console.log("Checking file permissions...");

  const scriptsDir = path.join(process.cwd(), "scripts");
  const fixPermissionsCount = { success: 0, failed: 0 };

  try {
    const files = fs.readdirSync(scriptsDir);

    for (const file of files) {
      if (
        file.endsWith(".js") ||
        file.endsWith(".sh") ||
        file.endsWith(".bat")
      ) {
        const filePath = path.join(scriptsDir, file);

        try {
          // On Unix systems, make scripts executable
          if (os.platform() !== "win32") {
            fs.chmodSync(filePath, "755");
            fixPermissionsCount.success++;
          }
        } catch (error) {
          console.warn(
            `Could not set permissions for ${file}: ${error.message}`
          );
          fixPermissionsCount.failed++;
        }
      }
    }

    console.log(`Fixed permissions for ${fixPermissionsCount.success} files`);
    if (fixPermissionsCount.failed > 0) {
      console.warn(
        `Failed to fix permissions for ${fixPermissionsCount.failed} files`
      );
    }
  } catch (error) {
    console.error(`Error checking file permissions: ${error.message}`);
  }
}

/**
 * Run module validation
 */
async function checkModules() {
  console.log("\nChecking modules...");

  // Run the validate-modules script
  const result = runCommand("node scripts/validate-modules.js");

  if (!result.success) {
    console.warn("Module validation failed. Running dependency fixes...");

    if (options.fix) {
      console.log("\nAttempting to fix dependency issues...");
      runCommand("node scripts/fix-dependencies.js");
    } else {
      console.log("\nTo fix dependency issues, run with --fix option");
    }
  }

  return result.success;
}

/**
 * Check webpack configuration
 */
function checkWebpack() {
  console.log("\nChecking webpack configuration...");

  // Examine next.config.js
  try {
    const nextConfigPath = path.join(process.cwd(), "next.config.js");
    const configContent = fs.readFileSync(nextConfigPath, "utf8");

    const checks = {
      webpackConfig:
        configContent.includes("webpack:") ||
        configContent.includes("webpack ="),
      fallbacks: configContent.includes("fallback"),
      svgr: configContent.includes("@svgr/webpack"),
      moduleRules: configContent.includes("module.rules"),
      experimental: configContent.includes("experimental"),
    };

    console.log("Next.js webpack configuration:");
    Object.entries(checks).forEach(([check, result]) => {
      console.log(`- ${check}: ${result ? "✅ Found" : "⚠️ Not found"}`);
    });

    if (!checks.webpackConfig && options.fix) {
      console.warn(
        "No webpack configuration found. Adding basic configuration..."
      );
      // This would require updating the next.config.js file
      console.log(
        "Please manually add webpack configuration to next.config.js"
      );
    }

    // Check if @svgr/webpack is installed
    const svgrInstalled = isModuleInstalled("@svgr/webpack");
    console.log(
      `- @svgr/webpack module: ${svgrInstalled ? "✅ Installed" : "❌ Not installed"}`
    );

    if (!svgrInstalled && options.fix) {
      console.log("Installing @svgr/webpack...");
      runCommand("npm install @svgr/webpack --save-dev");
    }

    return Object.values(checks).some((val) => val);
  } catch (error) {
    console.error(`Error checking webpack configuration: ${error.message}`);
    return false;
  }
}

/**
 * Check for Parse/Syntax errors in key files
 */
function checkForParseErrors() {
  console.log("\nChecking for syntax errors in key files...");

  const filesToCheck = [
    "./lib/module-resolver.js",
    "./lib/next-module-helper.js",
    "./scripts/validate-modules.js",
    "./pages/api/debug/module-diagnostics.js",
  ];

  let hasErrors = false;

  for (const file of filesToCheck) {
    const filePath = path.join(process.cwd(), file);

    if (fs.existsSync(filePath)) {
      const result = runCommand(`node --check ${filePath}`, { silent: true });

      if (result.success) {
        console.log(`✅ ${file}: No syntax errors`);
      } else {
        console.error(`❌ ${file}: Syntax errors found`);
        console.error(result.error.message);
        hasErrors = true;
      }
    } else {
      console.warn(`⚠️ ${file}: File not found`);
    }
  }

  return !hasErrors;
}

// Run all the diagnostic functions
async function runDiagnostics() {
  // Check for parse errors first
  const noParseErrors = checkForParseErrors();

  if (!noParseErrors && !options.fix) {
    console.error(
      "\n⚠️ Syntax errors found. Run with --fix to attempt repairs"
    );
    return;
  }

  // Check file permissions
  if (options.fix) {
    checkFilePermissions();
  }

  // Run checks based on options
  let results = {
    modules: true,
    webpack: true,
  };

  if (options.modules) {
    results.modules = await checkModules();
  }

  if (options.webpack) {
    results.webpack = checkWebpack();
  }

  // Print summary
  console.log("\n=".repeat(60));
  console.log("Diagnostics Summary");
  console.log("=".repeat(60));

  if (options.modules) {
    console.log(`Modules: ${results.modules ? "✅ OK" : "❌ Issues found"}`);
  }

  if (options.webpack) {
    console.log(`Webpack: ${results.webpack ? "✅ OK" : "❌ Issues found"}`);
  }

  const allOk = Object.values(results).every((r) => r);

  if (allOk) {
    console.log("\n✅ All checks passed!");
  } else {
    console.log(
      "\n⚠️ Some checks failed. Review the output above for details."
    );

    if (!options.fix) {
      console.log("Run with --fix option to attempt automatic fixes.");
    }
  }
}

// Run the diagnostics
runDiagnostics().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
