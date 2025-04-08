import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";

// IMPORTANT: Only use this in development or with proper security checks!
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // This should include security measures in production
  const { email, adminSecret } = req.body;

  if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: "Invalid admin key" });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.role = "admin";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${email} was promoted to admin`,
    });
  } catch (error) {
    console.error("Error promoting admin:", error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    await disconnectDB();
  }
}
