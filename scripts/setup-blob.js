/**
 * Helper script to set up Vercel Blob storage for TopDial
 * Run with: node scripts/setup-blob.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

console.log(`${colors.cyan}=== TopDial Vercel Blob Setup ===${colors.reset}`);
console.log(
  `${colors.yellow}This script will help you set up Vercel Blob storage for file uploads${colors.reset}\n`
);

// Check if @vercel/blob is installed
function checkBlobPackage() {
  console.log(
    `${colors.blue}Checking for @vercel/blob package...${colors.reset}`
  );

  try {
    // Check if @vercel/blob exists in package.json
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    const hasBlobDependency =
      packageJson.dependencies && packageJson.dependencies["@vercel/blob"];

    if (!hasBlobDependency) {
      console.log(
        `${colors.yellow}@vercel/blob package is not installed. Installing now...${colors.reset}`
      );
      execSync("npm install @vercel/blob", { stdio: "inherit" });
      console.log(
        `${colors.green}✓ @vercel/blob package installed successfully${colors.reset}`
      );
    } else {
      console.log(
        `${colors.green}✓ @vercel/blob package is already installed${colors.reset}`
      );
    }

    return true;
  } catch (error) {
    console.error(
      `${colors.red}× Failed to check or install @vercel/blob package: ${error.message}${colors.reset}`
    );
    return false;
  }
}

// Create Vercel Blob store using Vercel CLI
async function createBlobStore() {
  return new Promise((resolve) => {
    console.log(
      `${colors.blue}Setting up Vercel Blob storage...${colors.reset}`
    );

    rl.question(
      `${colors.cyan}Do you want to create a new Vercel Blob store? (y/n): ${colors.reset}`,
      async (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          try {
            // Check if Vercel CLI is installed
            try {
              execSync("vercel --version", { stdio: "pipe" });
            } catch (error) {
              console.log(
                `${colors.yellow}Vercel CLI not found. Installing...${colors.reset}`
              );
              execSync("npm install -g vercel", { stdio: "inherit" });
            }

            // Create a new blob store
            console.log(
              `${colors.yellow}Creating Blob store with Vercel CLI...${colors.reset}`
            );
            console.log(
              `${colors.yellow}Follow the prompts from Vercel CLI to complete setup...${colors.reset}`
            );

            execSync("npx vercel@latest add blob", { stdio: "inherit" });

            console.log(
              `${colors.green}✓ Vercel Blob store created successfully${colors.reset}`
            );

            console.log(
              `${colors.cyan}Important: Make sure to add the BLOB_READ_WRITE_TOKEN to .env.local${colors.reset}`
            );

            resolve(true);
          } catch (error) {
            console.error(
              `${colors.red}× Failed to create Blob store: ${error.message}${colors.reset}`
            );

            if (error.message.includes("ENOENT")) {
              console.log(
                `${colors.yellow}Tip: Make sure Vercel CLI is installed and you're logged in${colors.reset}`
              );
            }

            resolve(false);
          }
        } else {
          console.log(
            `${colors.yellow}Skipping Blob store creation. You'll need to manually create one later.${colors.reset}`
          );
          resolve(false);
        }
      }
    );
  });
}

// Check and update .env.local file
async function updateEnvFile() {
  return new Promise((resolve) => {
    const envPath = path.join(process.cwd(), ".env.local");

    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    // Check if BLOB_READ_WRITE_TOKEN is already in the file
    if (envContent.includes("BLOB_READ_WRITE_TOKEN=")) {
      console.log(
        `${colors.green}✓ BLOB_READ_WRITE_TOKEN already exists in .env.local${colors.reset}`
      );
      resolve(true);
      return;
    }

    rl.question(
      `${colors.cyan}Do you want to manually add BLOB_READ_WRITE_TOKEN to .env.local? (y/n): ${colors.reset}`,
      (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          rl.question(
            `${colors.cyan}Enter your Vercel Blob token: ${colors.reset}`,
            (token) => {
              try {
                const newEnvContent = `${envContent}\n\n# Vercel Blob Storage\nBLOB_READ_WRITE_TOKEN=${token}\n`;
                fs.writeFileSync(envPath, newEnvContent);

                console.log(
                  `${colors.green}✓ Added BLOB_READ_WRITE_TOKEN to .env.local${colors.reset}`
                );
                resolve(true);
              } catch (error) {
                console.error(
                  `${colors.red}× Failed to update .env.local: ${error.message}${colors.reset}`
                );
                resolve(false);
              }
            }
          );
        } else {
          console.log(
            `${colors.yellow}Skipping .env.local update.${colors.reset}`
          );
          console.log(
            `${colors.yellow}Don't forget to manually add BLOB_READ_WRITE_TOKEN to your .env.local file${colors.reset}`
          );
          resolve(false);
        }
      }
    );
  });
}

// Main function
async function main() {
  try {
    const packageInstalled = checkBlobPackage();

    if (!packageInstalled) {
      console.log(
        `${colors.red}Failed to install required packages. Aborting.${colors.reset}`
      );
      process.exit(1);
    }

    await createBlobStore();
    await updateEnvFile();

    console.log(`\n${colors.green}Setup completed!${colors.reset}`);
    console.log(`${colors.blue}Next steps:${colors.reset}`);
    console.log(
      `1. Make sure BLOB_READ_WRITE_TOKEN is in your .env.local file`
    );
    console.log(
      `2. Visit /debug/storage-status in your app to verify Blob is working`
    );
    console.log(
      `3. Use the uploadToBlob function from lib/blob.js to upload files`
    );

    rl.close();
  } catch (error) {
    console.error(`${colors.red}Setup failed: ${error.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
}

// Run the script
main();
