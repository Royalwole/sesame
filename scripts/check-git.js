/**
 * Pre-husky installation check
 * Verifies git repository exists before installing husky
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Check if .git directory exists
const gitPath = path.join(process.cwd(), ".git");
const isGitRepo = fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory();

// If this isn't a git repository, exit cleanly - don't try to install husky
if (!isGitRepo) {
  console.log(
    "\x1b[33m%s\x1b[0m",
    "No Git repository detected. Skipping Husky installation."
  );
  process.exit(0);
}

// Otherwise, try to install husky
try {
  console.log("Git repository found, installing Husky hooks...");
  execSync("husky install", { stdio: "inherit" });
} catch (error) {
  console.error("\x1b[31m%s\x1b[0m", "Failed to install Husky:");
  console.error(error.message);

  // Don't fail the overall install process
  process.exit(0);
}
