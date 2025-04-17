/**
 * Script to remove duplicate .js files when corresponding .jsx files exist
 * This script helps fix the "Duplicate page detected" warnings
 * Run with: node scripts/remove-duplicate-files.js
 */

const fs = require("fs");
const path = require("path");

// Define paths to check (recursive)
const directories = ["pages", "components"];

// Process each directory
function processDuplicates(baseDir) {
  console.log(`\n=== Processing directory: ${baseDir} ===`);
  let duplicatesFound = 0;
  let filesRemoved = 0;

  // Function to check directory recursively
  function checkDir(dir) {
    const fullPath = path.join(baseDir, dir);

    try {
      const files = fs.readdirSync(fullPath);

      // First, collect all base filenames (without extensions)
      const baseFiles = {};

      files.forEach((file) => {
        const fullFilePath = path.join(fullPath, file);

        // Skip directories for now - we'll process them recursively later
        if (fs.statSync(fullFilePath).isDirectory()) {
          return;
        }

        const ext = path.extname(file);
        const baseName = path.basename(file, ext);

        if (!baseFiles[baseName]) {
          baseFiles[baseName] = [];
        }

        baseFiles[baseName].push({
          name: file,
          path: fullFilePath,
          extension: ext,
        });
      });

      // Find duplicates (.js and .jsx with same base name)
      Object.entries(baseFiles).forEach(([baseName, filesList]) => {
        if (filesList.length > 1) {
          const jsxFile = filesList.find((f) => f.extension === ".jsx");
          const jsFile = filesList.find((f) => f.extension === ".js");

          if (jsxFile && jsFile) {
            duplicatesFound++;
            console.log(`Found duplicate: ${path.join(dir, baseName)}`);
            console.log(`  - Keeping: ${jsxFile.name}`);
            console.log(`  - Removing: ${jsFile.name}`);

            try {
              fs.unlinkSync(jsFile.path);
              filesRemoved++;
              console.log(`  ✓ Successfully removed ${jsFile.name}`);
            } catch (err) {
              console.log(`  ✗ Error removing ${jsFile.name}: ${err.message}`);
            }
          }
        }
      });

      // Process subdirectories
      files.forEach((file) => {
        const fullFilePath = path.join(fullPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
          checkDir(path.join(dir, file));
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${fullPath}: ${err.message}`);
    }
  }

  // Start processing from root
  checkDir("");

  return { duplicatesFound, filesRemoved };
}

// Main execution
console.log("=== Cleaning Up Duplicate Files (.js vs .jsx) ===");
console.log(
  "This script will remove .js files where a corresponding .jsx file exists"
);

let totalDuplicates = 0;
let totalRemoved = 0;

directories.forEach((dir) => {
  const { duplicatesFound, filesRemoved } = processDuplicates(dir);
  totalDuplicates += duplicatesFound;
  totalRemoved += filesRemoved;
});

// Summary
console.log("\n=== Summary ===");
console.log(`Total duplicates found: ${totalDuplicates}`);
console.log(`Total files removed: ${totalRemoved}`);

if (totalRemoved > 0) {
  console.log("\nRestart your development server to apply changes!");
}
