import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { withJsonResponse } from "../../../lib/api/middleware";

async function handler(req, res) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  let dbConnection = false;

  try {
    // Get authenticated user from Clerk
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    // Connect to database
    await connectDB();
    dbConnection = true;

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: auth.userId });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
        userId: existingUser._id
      });
    }

    // Get user data from Clerk metadata or request body
    const userData = {
      clerkId: auth.userId,
      firstName: req.body.firstName || "",
      lastName: req.body.lastName || "",
      email: req.body.email || "",
      role: "user", // Default role
    };

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    // Return successful response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        _id: newUser._id,
        clerkId: newUser.clerkId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      }
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create user",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  } finally {
    // Disconnect from database
    if (dbConnection) {
      await disconnectDB();
    }
  }
}

// Apply JSON response middleware
export default withJsonResponse(handler);
