const fs = require("fs");
const path = require("path");

/**
 * Removes duplicate .js files when a .jsx file exists for the same page
 */
async function removeDuplicatePages() {
  console.log("Starting removal of duplicate page files...");

  // List of duplicate files to check and remove (.js versions)
  const duplicateFiles = [
    "pages/_app.js",
    "pages/_document.js",
    "pages/_error.js",
    "pages/auth/[[...clerk]].js",
    "pages/dashboard/index.js",
    "pages/dashboard/profile.js",
    "pages/dashboard/user.js",
    "pages/debug/db-status.js",
    "pages/debug/storage-status.js",
    "pages/auth/sign-in/[[...index]].js",
    "pages/dashboard/admin/agents.js",
    "pages/dashboard/agent/index.js",
  ];

  // Counter for removed files
  let removedCount = 0;
  let skippedCount = 0;

  for (const filePath of duplicateFiles) {
    const fullPath = path.join(process.cwd(), filePath);
    const correspondingJsxPath = fullPath.replace(".js", ".jsx");

    try {
      // Check if both the .js and .jsx files exist
      if (fs.existsSync(fullPath) && fs.existsSync(correspondingJsxPath)) {
        // Remove the .js file
        await fs.promises.unlink(fullPath);
        console.log(`✅ Removed: ${filePath}`);
        removedCount++;
      } else if (!fs.existsSync(fullPath)) {
        console.log(`⏭️ Skipped: ${filePath} (file doesn't exist)`);
        skippedCount++;
      } else if (!fs.existsSync(correspondingJsxPath)) {
        console.log(
          `⚠️ Warning: ${filePath} doesn't have a corresponding .jsx file`
        );
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error removing ${filePath}:`, error.message);
    }
  }

  console.log(
    `\nDone! Removed ${removedCount} duplicate .js files. Skipped ${skippedCount} files.`
  );
  console.log("Next.js should no longer show duplicate page warnings.");
}

removeDuplicatePages();
