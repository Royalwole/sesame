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
