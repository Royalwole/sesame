// Temporary script to make a specific user admin
// To use: node temp-make-admin.js

import { connectDB, disconnectDB } from "./lib/db.js";
import User from "./models/User.js";
import { clerkClient } from "@clerk/nextjs/server";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function makeUserAdmin() {
  const userId = "user_2wuACriUGELTQHqoqTgu3wvd7ee";

  try {
    // Connect to database
    console.log("Connecting to database...");
    await connectDB();

    // Find user in database
    console.log(`Finding user with clerkId: ${userId}`);
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      console.log("User not found in database, creating a new record");
      dbUser = new User({
        clerkId: userId,
        role: "admin",
        approved: true,
        // Additional fields would be populated later when user logs in
        firstName: "",
        lastName: "",
        email: "",
      });
    } else {
      console.log(
        `Found user: ${dbUser.firstName} ${dbUser.lastName} (${dbUser.email})`
      );
      console.log(`Current role: ${dbUser.role}`);
      dbUser.role = "admin";
    }

    // Save changes to database
    await dbUser.save();
    console.log("Database updated successfully!");

    // Update Clerk user metadata
    try {
      console.log("Updating Clerk user metadata...");
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          role: "admin",
          approved: true,
        },
      });
      console.log("Clerk user updated successfully!");
    } catch (clerkError) {
      console.error("Error updating Clerk user:", clerkError);
    }

    console.log("✅ User promoted to admin successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Disconnect from database
    await disconnectDB();
    process.exit(0);
  }
}

makeUserAdmin();
