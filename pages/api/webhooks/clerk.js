import { Webhook } from "svix";
import { buffer } from "micro";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";

// Disable body parsing, we'll do it ourselves with svix
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the signature from the header
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  // If there's no signature, this isn't a Svix request
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing Svix headers" });
  }

  // Get the raw body
  const payload = await buffer(req);
  const body = JSON.parse(payload);

  console.log("Webhook received:", body.type);

  try {
    // Verify webhook (in production, use your webhook secret from environment variables)
    // const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    // wh.verify(payload, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature });

    // Handle user creation
    if (body.type === "user.created") {
      console.log("Creating new user in database");
      await handleUserCreated(body.data);
    }

    // Handle user updated
    if (body.type === "user.updated") {
      console.log("Updating user in database");
      await handleUserUpdated(body.data);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).json({ error: error.message });
  } finally {
    await disconnectDB();
  }
}

async function handleUserCreated(userData) {
  await connectDB();

  // Check if user already exists
  const existingUser = await User.findOne({ clerkId: userData.id });
  if (existingUser) {
    console.log("User already exists in database");
    return;
  }

  // Create new user
  const user = new User({
    clerkId: userData.id,
    firstName: userData.first_name || "",
    lastName: userData.last_name || "",
    email: userData.email_addresses[0]?.email_address || "",
    profileImage: userData.image_url,
    role: "user",
    approved: true, // Regular users are approved by default
  });

  await user.save();
  console.log("User created in database:", user._id);
}

async function handleUserUpdated(userData) {
  await connectDB();

  // Find and update user
  const user = await User.findOne({ clerkId: userData.id });
  if (!user) {
    // If user doesn't exist, create it
    return await handleUserCreated(userData);
  }

  // Update user data
  user.firstName = userData.first_name || user.firstName;
  user.lastName = userData.last_name || user.lastName;
  user.email = userData.email_addresses[0]?.email_address || user.email;
  user.profileImage = userData.image_url || user.profileImage;

  await user.save();
  console.log("User updated in database:", user._id);
}
