import { connectDB, disconnectDB } from "../../lib/db";
import User from "../../models/User";

// IMPORTANT: Only use this in development environment!
export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      error: "This endpoint is only available in development mode",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDB();

    // Hard-coded email for security
    const email = "akolawoleakinola@gmail.com";

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ error: `User with email ${email} not found` });
    }

    // Update user role to admin
    user.role = "admin";
    await user.save();

    console.log(`User ${email} promoted to admin successfully`);

    return res.status(200).json({
      success: true,
      message: `User ${email} was promoted to admin`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error promoting admin:", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    await disconnectDB();
  }
}
