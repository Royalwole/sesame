/**
 * Fix script for Next.js build issues
 * Resolves the "Cannot find module './chunks/vendor-chunks/next.js'" error
 * Run with: node scripts/fix-nextjs.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Print header
console.log(
  `${colors.magenta}=== Next.js Build Issue Fixer ===${colors.reset}`
);
console.log(
  `${colors.yellow}This script will help fix common Next.js build issues${colors.reset}\n`
);

// Paths to clean
const pathsToClean = [".next", "node_modules/.cache"];

// Function to check if a command exists
function commandExists(command) {
  try {
    if (process.platform === "win32") {
      // On Windows, use where command
      execSync(`where ${command}`, { stdio: "ignore" });
    } else {
      // On Unix-based systems, use which command
      execSync(`which ${command}`, { stdio: "ignore" });
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Determine available package managers
const packageManagers = [];
if (commandExists("npm")) packageManagers.push("npm");
if (commandExists("yarn")) packageManagers.push("yarn");
if (commandExists("pnpm")) packageManagers.push("pnpm");

// Use readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Determine package manager to use
function getPackageManager() {
  return new Promise((resolve) => {
    if (packageManagers.length === 0) {
      console.error(
        `${colors.red}No supported package manager found (npm, yarn, or pnpm)${colors.reset}`
      );
      resolve("npm"); // Default to npm
      return;
    }

    if (packageManagers.length === 1) {
      console.log(
        `${colors.cyan}Using ${packageManagers[0]} as the package manager${colors.reset}`
      );
      resolve(packageManagers[0]);
      return;
    }

    rl.question(
      `${colors.cyan}Multiple package managers found. Which one would you like to use? (${packageManagers.join("/")}): ${colors.reset}`,
      (answer) => {
        const packageManager = packageManagers.includes(answer)
          ? answer
          : packageManagers[0];
        resolve(packageManager);
      }
    );
  });
}

// Clean build directories
function cleanDirectories() {
  console.log(
    `${colors.yellow}Step 1: Cleaning build directories...${colors.reset}`
  );

  for (const dirPath of pathsToClean) {
    const fullPath = path.join(process.cwd(), dirPath);

    if (fs.existsSync(fullPath)) {
      console.log(`  Deleting ${dirPath}...`);
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`  ${colors.green}✓ Deleted ${dirPath}${colors.reset}`);
      } catch (error) {
        console.error(
          `  ${colors.red}× Failed to delete ${dirPath}: ${error.message}${colors.reset}`
        );
      }
    } else {
      console.log(
        `  ${colors.yellow}${dirPath} not found, skipping${colors.reset}`
      );
    }
  }
}

// Fix package.json if needed
function fixPackageJson() {
  console.log(
    `${colors.yellow}Step 2: Checking package.json...${colors.reset}`
  );

  const pkgPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.error(`  ${colors.red}× package.json not found!${colors.reset}`);
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

    let needsUpdate = false;

    // Check if next dependency has issues
    if (pkg.dependencies && pkg.dependencies.next) {
      const nextVersion = pkg.dependencies.next;

      if (
        nextVersion.startsWith("13.") ||
        nextVersion.includes("beta") ||
        nextVersion.includes("alpha")
      ) {
        console.log(
          `  ${colors.yellow}Found potentially problematic Next.js version: ${nextVersion}${colors.reset}`
        );
        pkg.dependencies.next = "^14.0.4";
        needsUpdate = true;
        console.log(
          `  ${colors.green}✓ Updated Next.js version to ^14.0.4${colors.reset}`
        );
      }
    }

    // Check if postinstall script exists
    if (!pkg.scripts || !pkg.scripts.postinstall) {
      if (!pkg.scripts) pkg.scripts = {};
      pkg.scripts.postinstall = "node scripts/post-install.js";
      needsUpdate = true;
      console.log(`  ${colors.green}✓ Added postinstall script${colors.reset}`);
    }

    if (needsUpdate) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log(`  ${colors.green}✓ package.json updated${colors.reset}`);
    } else {
      console.log(
        `  ${colors.green}✓ No package.json updates needed${colors.reset}`
      );
    }
  } catch (error) {
    console.error(
      `  ${colors.red}× Error processing package.json: ${error.message}${colors.reset}`
    );
  }
}

// Create post install helper
function createPostInstallScript() {
  console.log(
    `${colors.yellow}Step 3: Creating post-install helper...${colors.reset}`
  );

  const scriptDir = path.join(process.cwd(), "scripts");

  if (!fs.existsSync(scriptDir)) {
    try {
      fs.mkdirSync(scriptDir, { recursive: true });
      console.log(
        `  ${colors.green}✓ Created scripts directory${colors.reset}`
      );
    } catch (error) {
      console.error(
        `  ${colors.red}× Failed to create scripts directory: ${error.message}${colors.reset}`
      );
      return;
    }
  }

  const postInstallPath = path.join(scriptDir, "post-install.js");

  // Write the post-install script
  const scriptContent = `/**
 * Post-install script to ensure Next.js builds correctly
 * This addresses common issues like missing vendor chunks
 */

console.log('Running post-install setup...');

const fs = require('fs');
const path = require('path');

// Create necessary Next.js directories if they don't exist
const nextDir = path.join(process.cwd(), '.next');
const serverDir = path.join(nextDir, 'server');
const chunksDir = path.join(serverDir, 'chunks');
const vendorDir = path.join(chunksDir, 'vendor-chunks');

// Create directories recursively
function ensureDirectoryExists(dir) {
  if (fs.existsSync(dir)) return;
  
  try {
    fs.mkdirSync(dir, { recursive: true });
    console.log(\`Created directory: \${dir}\`);
  } catch (err) {
    console.warn(\`Could not create directory \${dir}: \${err.message}\`);
  }
}

// Ensure the .next directory exists for development
ensureDirectoryExists(nextDir);
ensureDirectoryExists(serverDir);
ensureDirectoryExists(chunksDir);
ensureDirectoryExists(vendorDir);

console.log('Post-install setup complete!');
`;

  try {
    fs.writeFileSync(postInstallPath, scriptContent);
    console.log(
      `  ${colors.green}✓ Created post-install script${colors.reset}`
    );
  } catch (error) {
    console.error(
      `  ${colors.red}× Failed to create post-install script: ${error.message}${colors.reset}`
    );
  }
}

// Run the fix
async function runFix() {
  try {
    // Step 1: Clean directories
    cleanDirectories();

    // Step 2: Fix package.json
    fixPackageJson();

    // Step 3: Create post-install script
    createPostInstallScript();

    // Step 4: Run post-install script
    console.log(
      `${colors.yellow}Step 4: Running post-install script...${colors.reset}`
    );
    try {
      execSync("node scripts/post-install.js", { stdio: "inherit" });
    } catch (error) {
      console.error(
        `  ${colors.red}× Failed to run post-install script: ${error.message}${colors.reset}`
      );
    }

    // Step 5: Reinstall dependencies
    console.log(
      `${colors.yellow}Step 5: Reinstalling dependencies...${colors.reset}`
    );
    const packageManager = await getPackageManager();
    try {
      execSync(`${packageManager} install`, { stdio: "inherit" });
      console.log(`  ${colors.green}✓ Dependencies reinstalled${colors.reset}`);
    } catch (error) {
      console.error(
        `  ${colors.red}× Failed to reinstall dependencies: ${error.message}${colors.reset}`
      );
    }

    console.log(`\n${colors.green}✅ Fix complete!${colors.reset}`);
    console.log(`${colors.blue}Next steps:${colors.reset}`);
    console.log(
      `1. Run "${colors.cyan}npm run dev${colors.reset}" to start your development server`
    );
    console.log(
      `2. If issues persist, try running "${colors.cyan}npm run build${colors.reset}" first`
    );
  } catch (error) {
    console.error(
      `\n${colors.red}An error occurred during the fix process:${colors.reset}`
    );
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the fix
runFix();
