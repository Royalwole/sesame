import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set!");
  process.exit(1);
}

// User schema definition (simplified version of your User model)
const userSchema = new mongoose.Schema({
  clerkId: String,
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  approved: Boolean,
});

// Function to promote user to admin
async function promoteToAdmin(email) {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get the User model
    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found!`);
      return false;
    }

    // Update user role to admin
    user.role = "admin";
    await user.save();

    console.log(
      `🎉 Success! User ${email} (${user.firstName} ${user.lastName}) has been promoted to admin.`
    );
    return true;
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return false;
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Email from command line argument or hard-coded
const EMAIL = process.argv[2] || "akolawoleakinola@gmail.com";

// Run the function
promoteToAdmin(EMAIL)
  .then((success) => {
    if (success) {
      console.log("Operation completed successfully");
    } else {
      console.log("Operation failed");
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });

export { promoteToAdmin };

// Call the function if this file is executed directly
if (process.argv[1] === import.meta.url) {
  promoteToAdmin();
}
