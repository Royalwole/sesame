/**
 * MongoDB Diagnostics Tool
 * Run with: node scripts/mongodb-diagnostics.js
 *
 * This script performs comprehensive MongoDB diagnostics to identify connection issues.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const dns = require("dns");
const os = require("os");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { promisify } = require("util");
const { exec } = require("child_process");

const lookup = promisify(dns.lookup);
const execPromise = promisify(exec);

// Color codes for output
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // Also load from .env as fallback

// Main function
async function runDiagnostics() {
  console.log(
    `${COLORS.bright}${COLORS.blue}MongoDB Connection Diagnostics${COLORS.reset}`
  );
  console.log(
    `${COLORS.dim}Running comprehensive tests to diagnose MongoDB connection issues...${COLORS.reset}\n`
  );

  // Check environment
  console.log(`${COLORS.bright}1. Environment Check${COLORS.reset}`);
  const nodeVersion = process.version;
  const nodeEnv = process.env.NODE_ENV || "not set";
  const mongoUri = process.env.MONGODB_URI || "not set";
  const mongoUriSafe =
    mongoUri === "not set" ? "not set" : hideCredentials(mongoUri);

  console.log(`- Node.js version: ${nodeVersion}`);
  console.log(`- NODE_ENV: ${nodeEnv}`);
  console.log(`- MONGODB_URI: ${mongoUriSafe}`);

  if (mongoUri === "not set") {
    console.log(
      `${COLORS.red}✘ MONGODB_URI is not set in your environment${COLORS.reset}`
    );
    checkEnvFiles();
  } else {
    console.log(`${COLORS.green}✓ MONGODB_URI is set${COLORS.reset}`);
    // Parse and validate the connection string
    validateConnectionString(mongoUri);
  }

  console.log("\n");

  // Check network connectivity
  console.log(`${COLORS.bright}2. Network Connectivity Check${COLORS.reset}`);
  await checkNetworkConnectivity(mongoUri);
  console.log("\n");

  // Check MongoDB tools
  console.log(`${COLORS.bright}3. MongoDB Tools Check${COLORS.reset}`);
  checkMongoTools();
  console.log("\n");

  // Check MongoDB version and server status
  console.log(`${COLORS.bright}4. MongoDB Server Check${COLORS.reset}`);
  await checkMongoServer(mongoUri);
  console.log("\n");

  // Check MongoDB package versions
  console.log(`${COLORS.bright}5. Package Dependencies Check${COLORS.reset}`);
  checkMongoPackages();
  console.log("\n");

  // Provide recommendations
  console.log(`${COLORS.bright}${COLORS.blue}Recommendations:${COLORS.reset}`);
  console.log(
    `${COLORS.cyan}1. Check that MongoDB is running and accessible.${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}2. Verify your connection string is correct in .env.local${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}3. Ensure network connectivity to the MongoDB server.${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}4. If using MongoDB Atlas, verify IP allowlist includes your current IP.${COLORS.reset}`
  );
  console.log(
    `${COLORS.cyan}5. Run 'npm install mongoose' to ensure dependencies are up-to-date.${COLORS.reset}`
  );

  console.log("\n");
  console.log(
    `${COLORS.bright}For more help:${COLORS.reset} Visit the MongoDB Connection Troubleshooting Guide`
  );
  console.log(
    "https://www.mongodb.com/docs/manual/reference/connection-string/"
  );
}

// Check for environment files
function checkEnvFiles() {
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ];

  console.log("\nChecking for environment files:");
  let envFound = false;

  envFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      envFound = true;
      console.log(`${COLORS.green}✓ ${file} exists${COLORS.reset}`);

      // Read the file and check for MongoDB URI (without exposing content)
      try {
        const content = fs.readFileSync(filePath, "utf8");
        if (content.includes("MONGODB_URI")) {
          console.log(
            `  ${COLORS.green}✓ ${file} contains MONGODB_URI${COLORS.reset}`
          );
        } else {
          console.log(
            `  ${COLORS.red}✘ ${file} does not contain MONGODB_URI${COLORS.reset}`
          );
        }
      } catch (err) {
        console.log(
          `  ${COLORS.red}✘ Error reading ${file}: ${err.message}${COLORS.reset}`
        );
      }
    } else {
      console.log(`${COLORS.yellow}○ ${file} not found${COLORS.reset}`);
    }
  });

  if (!envFound) {
    console.log(
      `${COLORS.red}✘ No environment files found. Create a .env.local file with MONGODB_URI.${COLORS.reset}`
    );
  }
}

// Validate MongoDB connection string
function validateConnectionString(uri) {
  if (uri === "not set") return;

  try {
    // Simple validation of MongoDB URI format
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      console.log(
        `${COLORS.red}✘ Connection string does not start with mongodb:// or mongodb+srv://${COLORS.reset}`
      );
      return;
    }

    // Parse components (very basic)
    let protocol, credentials, hosts, options;

    if (uri.includes("@")) {
      [protocol, credentials] = uri.split("://");
      [credentials, hosts] = credentials.split("@");

      console.log(
        `${COLORS.green}✓ URI has authentication credentials${COLORS.reset}`
      );
    } else {
      [protocol, hosts] = uri.split("://");
      console.log(
        `${COLORS.yellow}○ URI has no authentication credentials${COLORS.reset}`
      );
    }

    if (hosts && hosts.includes("/")) {
      [hosts, options] = hosts.split("/");

      if (options && options.includes("?")) {
        [database, params] = options.split("?");
        if (database) {
          console.log(
            `${COLORS.green}✓ URI specifies database: ${database}${COLORS.reset}`
          );
        }

        if (params) {
          console.log(
            `${COLORS.green}✓ URI includes connection options${COLORS.reset}`
          );
        }
      }
    }

    // Extract hostnames for network checks
    if (hosts) {
      const hostList = hosts.split(",");
      console.log(
        `${COLORS.green}✓ URI contains ${hostList.length} host(s)${COLORS.reset}`
      );

      if (protocol === "mongodb+srv") {
        console.log(
          `${COLORS.green}✓ Using SRV connection format (MongoDB Atlas)${COLORS.reset}`
        );
      }
    }
  } catch (error) {
    console.log(
      `${COLORS.red}✘ Error parsing connection string: ${error.message}${COLORS.reset}`
    );
  }
}

// Check network connectivity to MongoDB server
async function checkNetworkConnectivity(uri) {
  if (uri === "not set") {
    console.log(
      `${COLORS.yellow}○ Skipping network check - no MongoDB URI configured${COLORS.reset}`
    );
    return;
  }

  try {
    // Extract hostname from URI
    let hostname;

    if (uri.startsWith("mongodb+srv://")) {
      // For SRV records, extract the domain
      hostname = uri.split("@")[1].split("/")[0];
    } else if (uri.startsWith("mongodb://")) {
      // Standard connection
      hostname = uri.includes("@")
        ? uri.split("@")[1].split(":")[0].split("/")[0] // auth included
        : uri.split("://")[1].split(":")[0].split("/")[0]; // no auth
    }

    if (hostname) {
      // Skip localhost
      if (["localhost", "127.0.0.1"].includes(hostname)) {
        console.log(
          `${COLORS.blue}○ Using localhost - skipping DNS check${COLORS.reset}`
        );

        // Instead, check if MongoDB is running locally
        checkLocalMongoDBRunning();
        return;
      }

      // DNS Lookup
      console.log(`Testing DNS resolution for ${hostname}...`);
      dns.lookup(hostname, (err, address) => {
        if (err) {
          console.log(
            `${COLORS.red}✘ DNS resolution failed: ${err.message}${COLORS.reset}`
          );
        } else {
          console.log(
            `${COLORS.green}✓ DNS resolution successful: ${hostname} -> ${address}${COLORS.reset}`
          );
        }
      });

      // Internet connectivity
      console.log(`Checking internet connectivity...`);
      dns.lookup("google.com", (err) => {
        if (err) {
          console.log(
            `${COLORS.red}✘ Internet connectivity issues detected${COLORS.reset}`
          );
        } else {
          console.log(
            `${COLORS.green}✓ Internet connectivity confirmed${COLORS.reset}`
          );
        }
      });
    }
  } catch (error) {
    console.log(
      `${COLORS.red}✘ Error during network check: ${error.message}${COLORS.reset}`
    );
  }
}

// Check if MongoDB is running locally
function checkLocalMongoDBRunning() {
  console.log("Checking if MongoDB is running locally...");

  try {
    if (process.platform === "win32") {
      // Windows
      try {
        execSync("sc query MongoDB", { stdio: "ignore" });
        console.log(
          `${COLORS.green}✓ MongoDB service is registered on Windows${COLORS.reset}`
        );

        try {
          execSync('sc query MongoDB | find "RUNNING"', { stdio: "ignore" });
          console.log(
            `${COLORS.green}✓ MongoDB service is running${COLORS.reset}`
          );
        } catch (e) {
          console.log(
            `${COLORS.red}✘ MongoDB service is not running${COLORS.reset}`
          );
          console.log(`  Try starting it with: net start MongoDB`);
        }
      } catch (e) {
        console.log(
          `${COLORS.yellow}○ MongoDB service not found on Windows${COLORS.reset}`
        );
      }

      // Check port 27017
      try {
        execSync('netstat -an | find "27017"', { stdio: "ignore" });
        console.log(
          `${COLORS.green}✓ Port 27017 is in use (MongoDB may be running)${COLORS.reset}`
        );
      } catch (e) {
        console.log(
          `${COLORS.red}✘ Port 27017 is not in use (MongoDB may not be running)${COLORS.reset}`
        );
      }
    } else {
      // Unix-like
      try {
        execSync("pgrep -l mongod", { stdio: "ignore" });
        console.log(
          `${COLORS.green}✓ MongoDB process is running${COLORS.reset}`
        );
      } catch (e) {
        console.log(
          `${COLORS.red}✘ MongoDB process is not running${COLORS.reset}`
        );
      }

      // Check port 27017
      try {
        execSync("netstat -tuln | grep 27017", { stdio: "ignore" });
        console.log(
          `${COLORS.green}✓ Port 27017 is in use (MongoDB may be running)${COLORS.reset}`
        );
      } catch (e) {
        console.log(
          `${COLORS.red}✘ Port 27017 is not in use (MongoDB may not be running)${COLORS.reset}`
        );
      }
    }
  } catch (error) {
    console.log(
      `${COLORS.red}✘ Error checking MongoDB status: ${error.message}${COLORS.reset}`
    );
  }
}

// Check MongoDB tools
function checkMongoTools() {
  const tools = ["mongo", "mongosh"];
  let anyToolFound = false;

  tools.forEach((tool) => {
    try {
      execSync(`${tool} --version`, { stdio: "ignore" });
      console.log(`${COLORS.green}✓ ${tool} is installed${COLORS.reset}`);
      anyToolFound = true;
    } catch (e) {
      console.log(
        `${COLORS.yellow}○ ${tool} is not installed or not in PATH${COLORS.reset}`
      );
    }
  });

  if (!anyToolFound) {
    console.log(
      `${COLORS.yellow}○ No MongoDB command line tools found${COLORS.reset}`
    );
    console.log(
      "  Consider installing MongoDB Shell (mongosh) for troubleshooting:"
    );
    console.log("  https://www.mongodb.com/try/download/shell");
  }
}

// Check MongoDB server status
async function checkMongoServer(uri) {
  if (uri === "not set") {
    console.log(
      `${COLORS.yellow}○ Skipping server check - no MongoDB URI configured${COLORS.reset}`
    );
    return;
  }

  // We'll attempt to connect using the mongoose module that's already part of the project
  try {
    const mongooseDir = path.join(process.cwd(), "node_modules", "mongoose");

    if (!fs.existsSync(mongooseDir)) {
      console.log(
        `${COLORS.red}✘ Mongoose module not found in project${COLORS.reset}`
      );
      return;
    }

    console.log(
      `${COLORS.dim}Attempting to connect to MongoDB server...${COLORS.reset}`
    );

    // Write a temporary test script
    const testScriptPath = path.join(os.tmpdir(), "mongo-test-script.js");
    const testScript = `
    const mongoose = require('mongoose');
    
    async function testConnection() {
      try {
        // Using the same URI as your application
        const uri = "${uri}";
        
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        });
        
        console.log('Connection successful');
        
        // Get server info
        const admin = mongoose.connection.db.admin();
        const serverInfo = await admin.serverInfo();
        console.log(JSON.stringify({
          version: serverInfo.version,
          uptime: serverInfo.uptime,
          ok: 1
        }));
      } catch (error) {
        console.log(JSON.stringify({
          error: error.message,
          name: error.name,
          ok: 0
        }));
      } finally {
        await mongoose.disconnect();
        process.exit();
      }
    }
    
    testConnection();
    `;

    fs.writeFileSync(testScriptPath, testScript);

    // Run the test script in a separate process
    try {
      const result = execSync(`node "${testScriptPath}"`, { encoding: "utf8" });

      try {
        // Parse the output
        const jsonStart = result.indexOf("{");
        if (jsonStart >= 0) {
          const jsonResponse = JSON.parse(result.substring(jsonStart));

          if (jsonResponse.ok === 1) {
            console.log(
              `${COLORS.green}✓ Connected to MongoDB server${COLORS.reset}`
            );
            console.log(
              `${COLORS.green}✓ Server version: ${jsonResponse.version}${COLORS.reset}`
            );
            console.log(
              `${COLORS.green}✓ Server uptime: ${jsonResponse.uptime} seconds${COLORS.reset}`
            );
          } else {
            console.log(
              `${COLORS.red}✘ Failed to connect: ${jsonResponse.error}${COLORS.reset}`
            );
            console.log(`  Error type: ${jsonResponse.name}`);
          }
        }
      } catch (parseError) {
        console.log(
          `${COLORS.red}✘ Error parsing MongoDB server response${COLORS.reset}`
        );
        console.log(result);
      }
    } catch (execError) {
      console.log(
        `${COLORS.red}✘ Error executing MongoDB test: ${execError.message}${COLORS.reset}`
      );
    }

    // Clean up
    try {
      fs.unlinkSync(testScriptPath);
    } catch (_) {}
  } catch (error) {
    console.log(
      `${COLORS.red}✘ Error during server check: ${error.message}${COLORS.reset}`
    );
  }
}

// Check MongoDB package dependencies
function checkMongoPackages() {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  try {
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`${COLORS.red}✘ package.json not found${COLORS.reset}`);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check Mongoose
    if (dependencies.mongoose) {
      console.log(
        `${COLORS.green}✓ mongoose: ${dependencies.mongoose}${COLORS.reset}`
      );

      // Check mongoose version against recommended
      const version = dependencies.mongoose.replace(/[\^~]/g, "");
      const [major, minor] = version.split(".").map(Number);

      if (major < 6) {
        console.log(
          `${COLORS.yellow}○ Consider upgrading mongoose to version 6.x or higher${COLORS.reset}`
        );
      }
    } else {
      console.log(
        `${COLORS.red}✘ mongoose not found in package.json${COLORS.reset}`
      );
    }

    // Check MongoDB driver
    if (dependencies["mongodb"]) {
      console.log(
        `${COLORS.green}✓ mongodb: ${dependencies["mongodb"]}${COLORS.reset}`
      );
    } else {
      console.log(
        `${COLORS.yellow}○ mongodb driver not explicitly listed (may be installed as mongoose dependency)${COLORS.reset}`
      );
    }

    // Check package-lock.json exists
    if (fs.existsSync(path.join(process.cwd(), "package-lock.json"))) {
      console.log(`${COLORS.green}✓ package-lock.json exists${COLORS.reset}`);
    } else {
      console.log(
        `${COLORS.yellow}○ package-lock.json not found, dependencies may not be locked${COLORS.reset}`
      );
    }

    // Check node_modules
    if (fs.existsSync(path.join(process.cwd(), "node_modules", "mongoose"))) {
      console.log(
        `${COLORS.green}✓ mongoose is installed in node_modules${COLORS.reset}`
      );
    } else {
      console.log(
        `${COLORS.red}✘ mongoose not installed, run npm install${COLORS.reset}`
      );
    }
  } catch (error) {
    console.log(
      `${COLORS.red}✘ Error checking package dependencies: ${error.message}${COLORS.reset}`
    );
  }
}

// Helper function to hide credentials in connection string
function hideCredentials(uri) {
  if (!uri || uri === "not set") return uri;

  try {
    if (uri.includes("@")) {
      const [protocol, rest] = uri.split("://");
      const [credentials, hosts] = rest.split("@");

      // Replace credentials with ***:***
      return `${protocol}://***:***@${hosts}`;
    }
    return uri;
  } catch (_) {
    return "[Error parsing URI]";
  }
}

// Check MongoDB connectivity using mongoose
async function checkMongoDBConnectivity() {
  console.log("🔍 Running MongoDB connectivity diagnostics...\n");

  // Get MongoDB URI from environment
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI environment variable is not set");
    return;
  }

  // Parse connection string
  const connectionParts = uri.match(
    /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@([^/]+)/
  );
  if (!connectionParts) {
    console.error("❌ Invalid MongoDB connection string format");
    return;
  }

  const [, , username, password, host] = connectionParts;
  console.log("📡 Testing connection to:", host);

  try {
    // DNS lookup
    console.log("\n🌐 Checking DNS resolution...");
    const { address } = await lookup(host);
    console.log("✅ DNS resolution successful:", address);

    // Network connectivity test
    console.log("\n🔌 Testing network connectivity...");
    await execPromise(`ping -n 1 ${host}`);
    console.log("✅ Network connectivity test passed");

    // MongoDB connection test
    console.log("\n🔄 Testing MongoDB connection...");
    const startTime = Date.now();

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    const endTime = Date.now();
    console.log(`✅ MongoDB connection successful (${endTime - startTime}ms)`);

    // Check server status
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();

    console.log("\n📊 Server Status:");
    console.log(`- MongoDB version: ${serverStatus.version}`);
    console.log(
      `- Connections: ${serverStatus.connections.current} current / ${serverStatus.connections.available} available`
    );
    console.log(`- Uptime: ${Math.floor(serverStatus.uptime / 86400)} days`);
  } catch (error) {
    console.error("\n❌ Error during diagnostics:", error.message);

    if (error.name === "MongoServerSelectionError") {
      console.log("\n🔍 Possible issues:");
      console.log("1. Network connectivity problems");
      console.log("2. MongoDB Atlas service might be down");
      console.log("3. IP address might not be whitelisted");
      console.log("4. Invalid credentials");
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("\n✅ Cleanup: Disconnected from MongoDB");
    }
  }
}

// Run the diagnostics
runDiagnostics().catch((err) => {
  console.error(
    `${COLORS.red}Diagnostics failed: ${err.message}${COLORS.reset}`
  );
});
