import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";

/**
 * Simple API endpoint to make the user an admin in the database only
 * This is a simplified approach that doesn't rely on Clerk APIs
 */
export default async function handler(req, res) {
  try {
    // Connect to database
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected");

    // The user ID we want to make an admin
    const userId = "user_2wuACriUGELTQHqoqTgu3wvd7ee";

    // Find user in database
    console.log(`Looking for user with clerkId: ${userId}`);
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      console.log("User not found in database, creating a new record");
      // Create minimal user record if it doesn't exist
      dbUser = new User({
        clerkId: userId,
        firstName: "User",
        lastName: "",
        email: "user@example.com",
        role: "admin",
        approved: true,
      });
    } else {
      console.log(`Found user: ${dbUser.email}`);
      console.log(`Current role: ${dbUser.role}`);

      // Update the role
      dbUser.role = "admin";
      console.log("Role updated to admin");
    }

    // Save the changes
    await dbUser.save();
    console.log("Database updated successfully");

    return res.status(200).json({
      success: true,
      message: `User ${userId} has been made an admin in the database`,
      user: {
        clerkId: dbUser.clerkId,
        role: dbUser.role,
        email: dbUser.email,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  } finally {
    await disconnectDB();
    console.log("Database connection closed");
  }
}
