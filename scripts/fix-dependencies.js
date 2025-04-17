const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

console.log("🧹 Starting dependency cleanup process...");

// Function to run a command and handle errors
function runCommand(command) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`, error.message);
    return false;
  }
}

// Step 1: Kill any running Node processes (Windows specific)
console.log("Stopping any running Node.js processes...");
try {
  execSync("taskkill /f /im node.exe", { stdio: "ignore" });
  console.log("✅ Stopped Node.js processes");
} catch (error) {
  console.log("No Node.js processes were running or could not be stopped");
}

// Step 2: Wait a moment to ensure processes are terminated
console.log("Waiting for processes to fully terminate...");
setTimeout(() => {
  // Step 3: Clean the problematic directories
  const nextModulePath = path.join(__dirname, "..", "node_modules", "@next");

  if (fs.existsSync(nextModulePath)) {
    console.log("Cleaning @next directory...");
    try {
      rimraf.sync(nextModulePath);
      console.log("✅ Cleaned @next directory");
    } catch (error) {
      console.error("Failed to clean @next directory:", error.message);
      // Try an alternative method on Windows
      runCommand('rmdir /s /q "' + nextModulePath + '"');
    }
  }

  // Step 4: Clear npm cache
  console.log("Clearing npm cache...");
  runCommand("npm cache clean --force");

  // Step 5: Reinstall dependencies
  console.log("Reinstalling dependencies...");
  const installSuccess = runCommand("npm install");

  // Step 6: Update next.js to a compatible version
  if (installSuccess) {
    console.log("Updating Next.js to compatible version...");
    runCommand("npm install next@14.0.4 --save-exact");
  }

  console.log("🎉 Dependency cleanup completed!");
  console.log("Next steps:");
  console.log('1. Run "npm run dev" to test your application');
  console.log(
    "2. If issues persist, try restarting your computer and running this script again"
  );
}, 2000);

/**
 * Script to ensure all required dependencies are installed
 */

console.log("=== TopDial Dependency Fixer ===\n");

// Required packages that might be missing
const requiredPackages = ["micro", "react-intersection-observer", "lru-cache"];

// Read package.json to check installed dependencies
function getInstalledPackages() {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
    };
  } catch (error) {
    console.error("Error reading package.json:", error);
    return { dependencies: {}, devDependencies: {} };
  }
}

// Install missing packages
function installMissingPackages() {
  const { dependencies, devDependencies } = getInstalledPackages();
  const allDependencies = { ...dependencies, ...devDependencies };

  const missingPackages = requiredPackages.filter(
    (pkg) => !allDependencies[pkg]
  );

  if (missingPackages.length === 0) {
    console.log("✅ All required packages are already installed.");
    return true;
  }

  console.log(`Missing packages: ${missingPackages.join(", ")}`);
  console.log("\nInstalling missing packages...");

  try {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    execSync(`${npmCommand} install ${missingPackages.join(" ")}`, {
      stdio: "inherit",
    });
    console.log("\n✅ Missing packages installed successfully!");
    return true;
  } catch (error) {
    console.error("\n❌ Failed to install packages:", error.message);
    return false;
  }
}

// Run the main function
installMissingPackages();
