/**
 * Clean build script to resolve Next.js build issues
 * Run with: node scripts/clean-build.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

// Paths to clean
const pathsToClean = [".next", "node_modules/.cache"];

// Optional deep clean paths (only used with --deep flag)
const deepCleanPaths = ["node_modules"];

// Check if deep clean was requested
const isDeepClean = process.argv.includes("--deep");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

console.log("=== TopDial Clean Build Tool ===\n");

// Step 1: Delete build folders
console.log("Step 1: Cleaning build directories...");
const cleanPaths = [...pathsToClean, ...(isDeepClean ? deepCleanPaths : [])];

cleanPaths.forEach((dirPath) => {
  const fullPath = path.join(process.cwd(), dirPath);

  if (fs.existsSync(fullPath)) {
    console.log(`  Deleting ${dirPath}...`);
    rimraf.sync(fullPath);
  } else {
    console.log(`  ${dirPath} not found, skipping`);
  }
});

// Step 2: Run npm commands
console.log("\nStep 2: Reinstalling dependencies and rebuilding...");

try {
  if (isDeepClean) {
    console.log("  Running npm install (this may take a while)...");
    execSync(`${npmCommand} install`, { stdio: "inherit" });
  } else {
    // For regular clean, just clear cache
    console.log("  Clearing npm cache...");
    execSync(`${npmCommand} cache clean --force`, { stdio: "inherit" });
  }

  // Always run the build
  console.log("  Building the application...");
  execSync(`${npmCommand} run build`, { stdio: "inherit" });

  console.log("\n✅ Build cleaned and rebuilt successfully!");
  console.log("\nNext steps:");
  console.log('1. Run "npm run dev" to start the development server');
  console.log(
    '2. If issues persist, try running with --deep flag: "node scripts/clean-build.js --deep"'
  );
} catch (error) {
  console.error("\n❌ Error during rebuild process:");
  console.error(error.message);
  process.exit(1);
}
