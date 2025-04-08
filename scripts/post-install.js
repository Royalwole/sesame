/**
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
    console.log(`Created directory: ${dir}`);
  } catch (err) {
    console.warn(`Could not create directory ${dir}: ${err.message}`);
  }
}

// Ensure the .next directory exists for development
ensureDirectoryExists(nextDir);
ensureDirectoryExists(serverDir);
ensureDirectoryExists(chunksDir);
ensureDirectoryExists(vendorDir);

console.log('Post-install setup complete!');
