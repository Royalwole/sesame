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

  // Accept both GET and POST for simplicity in development
  try {
    await connectDB();

    // Hard-coded email for security
    const email = "royalvilleng@gmail.com";

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ error: `User with email ${email} not found` });
    }

    // Update user role to agent and set approved to true
    user.role = "agent";
    user.approved = true;

    // Initialize agent details if needed
    if (!user.agentDetails) {
      user.agentDetails = {
        experience: "5-10",
        licenseNumber: "AG-" + Math.floor(1000 + Math.random() * 9000),
        company: "Royal Ville Properties",
      };
    }

    await user.save();

    console.log(`User ${email} promoted to agent successfully`);

    return res.status(200).json({
      success: true,
      message: `User ${email} was promoted to agent`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        approved: user.approved,
      },
    });
  } catch (error) {
    console.error("Error promoting agent:", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    await disconnectDB();
  }
}
