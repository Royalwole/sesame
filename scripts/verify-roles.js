/**
 * Role Consistency Verification Tool
 *
 * This script checks for inconsistencies between roles stored in the MongoDB database
 * and roles stored in Clerk's publicMetadata. It can also fix any inconsistencies found.
 *
 * Usage:
 *   node scripts/verify-roles.js --check     # Only check for inconsistencies
 *   node scripts/verify-roles.js --fix       # Check and fix inconsistencies
 *   node scripts/verify-roles.js --user=<id> # Check a specific user by Clerk ID
 */

const { connectDB } = require("../lib/db");
const User = require("../models/User");
const { clerkClient } = require("@clerk/nextjs/server");
require("dotenv").config();

// Get command line args
const args = process.argv.slice(2);
const shouldFix = args.includes("--fix");
const checkOnly = args.includes("--check");
const specificUserArg = args.find((arg) => arg.startsWith("--user="));
const specificUserId = specificUserArg ? specificUserArg.split("=")[1] : null;

async function verifyRoles() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Find all users or a specific user
    let query = {};
    if (specificUserId) {
      query = { clerkId: specificUserId };
      console.log(`Checking specific user with Clerk ID: ${specificUserId}`);
    }

    const dbUsers = await User.find(query);

    if (dbUsers.length === 0) {
      console.log("No users found to verify.");
      return;
    }

    console.log(`Found ${dbUsers.length} users to verify.`);

    // Track statistics
    let consistentCount = 0;
    let inconsistentCount = 0;
    let fixedCount = 0;
    let errorCount = 0;

    // Process each user
    for (const dbUser of dbUsers) {
      try {
        const clerkId = dbUser.clerkId;

        if (!clerkId) {
          console.log(`User ${dbUser._id} has no Clerk ID. Skipping.`);
          continue;
        }

        // Get the user from Clerk
        const clerkUser = await clerkClient.users.getUser(clerkId);

        // Get roles from both systems
        const dbRole = dbUser.role || "user";
        const clerkRole = clerkUser.publicMetadata?.role || "user";

        // Get approval status from both systems
        const dbApproved = dbUser.approved === true;
        const clerkApproved = clerkUser.publicMetadata?.approved === true;

        // Check consistency
        const rolesMatch = dbRole === clerkRole;
        const approvalMatch = dbApproved === clerkApproved;
        const consistent = rolesMatch && approvalMatch;

        if (consistent) {
          consistentCount++;
          console.log(
            `✓ User ${dbUser.email || clerkId}: Roles consistent (${dbRole})`
          );
        } else {
          inconsistentCount++;
          console.log(`✗ User ${dbUser.email || clerkId}: Roles inconsistent!`);
          console.log(`  DB Role: ${dbRole} (approved: ${dbApproved})`);
          console.log(
            `  Clerk Role: ${clerkRole} (approved: ${clerkApproved})`
          );

          // Fix inconsistency if requested
          if (shouldFix) {
            console.log(`  Fixing inconsistency...`);

            // Update Clerk to match DB (source of truth)
            await clerkClient.users.updateUser(clerkId, {
              publicMetadata: {
                ...clerkUser.publicMetadata,
                role: dbRole,
                approved: dbApproved,
              },
            });

            console.log(`  ✓ Fixed: Updated Clerk role to match database`);
            fixedCount++;
          }
        }
      } catch (error) {
        console.error(
          `Error processing user ${dbUser._id || dbUser.clerkId}:`,
          error
        );
        errorCount++;
      }
    }

    // Print summary
    console.log("\n--- Summary ---");
    console.log(`Total users checked: ${dbUsers.length}`);
    console.log(`Consistent roles: ${consistentCount}`);
    console.log(`Inconsistent roles: ${inconsistentCount}`);

    if (shouldFix) {
      console.log(`Fixed inconsistencies: ${fixedCount}`);
    }

    if (errorCount > 0) {
      console.log(`Errors encountered: ${errorCount}`);
    }
  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    process.exit(0);
  }
}

// Display instructions if no arguments provided
if (args.length === 0) {
  console.log("Usage:");
  console.log(
    "  node scripts/verify-roles.js --check     # Only check for inconsistencies"
  );
  console.log(
    "  node scripts/verify-roles.js --fix       # Check and fix inconsistencies"
  );
  console.log(
    "  node scripts/verify-roles.js --user=<id> # Check a specific user by Clerk ID"
  );
  process.exit(0);
}

// Run the verification
verifyRoles();
