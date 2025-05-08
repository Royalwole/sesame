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
  const nextCachePath = path.join(__dirname, "..", ".next");

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

  // Also clean Next.js cache for a fresh start
  if (fs.existsSync(nextCachePath)) {
    console.log("Cleaning .next directory...");
    try {
      rimraf.sync(nextCachePath);
      console.log("✅ Cleaned .next directory");
    } catch (error) {
      console.error("Failed to clean .next directory:", error.message);
      runCommand('rmdir /s /q "' + nextCachePath + '"');
    }
  }

  // Step 4: Clear npm cache
  console.log("Clearing npm cache...");
  runCommand("npm cache clean --force");

  // Check for problematic lock files
  const packageLockPath = path.join(__dirname, "..", "package-lock.json");
  if (fs.existsSync(packageLockPath)) {
    console.log("Removing package-lock.json for clean reinstall...");
    try {
      fs.unlinkSync(packageLockPath);
      console.log("✅ Removed package-lock.json");
    } catch (error) {
      console.error("Failed to remove package-lock.json:", error.message);
    }
  }

  // Step 5: Reinstall dependencies
  console.log("Reinstalling dependencies...");
  const installSuccess = runCommand("npm install");

  // Step 6: Fix Next.js to a compatible version
  if (installSuccess) {
    console.log("Installing specific package versions for compatibility...");
    runCommand("npm install next@latest --save-exact");
    runCommand("npm install react@latest react-dom@latest");

    // Install core modules for webpack
    console.log("Ensuring webpack-related modules are installed...");
    runCommand("npm install @svgr/webpack --save-dev");
  }

  // Step 7: Fix module resolution issues
  console.log("🔧 Fixing module resolution issues...");

  // Check for common module issues
  const modulesToCheck = [
    { name: "firebase/app", fix: "npm install firebase@latest" },
    { name: "mongoose", fix: "npm install mongoose@latest" },
    { name: "@clerk/nextjs", fix: "npm install @clerk/nextjs@latest" },
    { name: "formidable", fix: "npm install formidable@latest" },
  ];

  for (const module of modulesToCheck) {
    try {
      console.log(`Checking ${module.name}...`);
      require.resolve(module.name);
      console.log(`✅ ${module.name} is properly installed`);
    } catch (error) {
      console.log(
        `⚠️ Module resolution issue with ${module.name}, attempting to fix...`
      );
      runCommand(module.fix);
    }
  }

  console.log("🎉 Dependency cleanup completed!");
  console.log("Next steps:");
  console.log('1. Run "npm run dev" to test your application');
  console.log(
    "2. If issues persist, try running 'node scripts/validate-modules.js' to diagnose module problems"
  );
  console.log(
    "3. For webpack issues, ensure your next.config.js has the proper webpack configuration"
  );
}, 2000);

/**
 * Additional fixes for common module import issues
 */
console.log("=== TopDial Module and Webpack Fixer ===\n");

// Required packages for proper module and webpack functioning
const requiredPackages = [
  "micro",
  "react-intersection-observer",
  "lru-cache",
  "dotenv",
  "@svgr/webpack",
  "sharp",
];

// React + Next.js compatibility pairs
const compatibilityPairs = [
  { nextVersion: "12.0.0", reactVersion: "17.0.2" },
  { nextVersion: "13.0.0", reactVersion: "18.2.0" },
  { nextVersion: "14.0.0", reactVersion: "18.2.0" },
  { nextVersion: "15.0.0", reactVersion: "18.2.0" },
];

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

// Check React and Next.js compatibility
function checkReactNextCompatibility() {
  const { dependencies } = getInstalledPackages();

  if (!dependencies.next || !dependencies.react) {
    console.log("⚠️ Could not find Next.js or React in dependencies");
    return;
  }

  const nextVersion = dependencies.next.replace(/[\^~]/g, "");
  const reactVersion = dependencies.react.replace(/[\^~]/g, "");

  console.log(
    `Current versions: Next.js ${nextVersion}, React ${reactVersion}`
  );

  // Check if major.minor versions are compatible
  const nextMajor = parseInt(nextVersion.split(".")[0]);
  let isCompatible = false;
  let recommendedReactVersion = "";

  for (const pair of compatibilityPairs) {
    const pairNextMajor = parseInt(pair.nextVersion.split(".")[0]);
    if (nextMajor === pairNextMajor) {
      isCompatible = reactVersion.startsWith(pair.reactVersion.split(".")[0]);
      recommendedReactVersion = pair.reactVersion;
      break;
    }
  }

  if (!isCompatible) {
    console.log(`⚠️ Your React and Next.js versions might not be compatible.`);
    console.log(
      `Recommended: For Next.js ${nextMajor}.x, use React ${recommendedReactVersion}`
    );

    if (recommendedReactVersion) {
      const fixCommand = `npm install react@${recommendedReactVersion} react-dom@${recommendedReactVersion} --save-exact`;
      console.log(`To fix, run: ${fixCommand}`);
    }
  } else {
    console.log("✅ React and Next.js versions are compatible");
  }
}

// Check if jsconfig.json has proper paths configuration
function checkJsConfig() {
  const jsconfigPath = path.join(process.cwd(), "jsconfig.json");

  if (!fs.existsSync(jsconfigPath)) {
    console.log(
      "⚠️ No jsconfig.json found. This could cause module resolution issues."
    );
    return;
  }

  try {
    const jsconfig = JSON.parse(fs.readFileSync(jsconfigPath, "utf8"));

    if (!jsconfig.compilerOptions) {
      console.log("⚠️ jsconfig.json missing compilerOptions.");
      return;
    }

    if (!jsconfig.compilerOptions.paths) {
      console.log(
        "⚠️ jsconfig.json missing path aliases. This helps with module resolution."
      );
      return;
    }

    if (!jsconfig.compilerOptions.baseUrl) {
      console.log(
        "⚠️ jsconfig.json missing baseUrl. This is required for path aliases."
      );
      return;
    }

    console.log("✅ jsconfig.json has proper module path configuration");
  } catch (error) {
    console.error("Error parsing jsconfig.json:", error.message);
  }
}

// Run the main functions
installMissingPackages();
checkReactNextCompatibility();
checkJsConfig();
