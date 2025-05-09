import { Webhook } from "svix";
import { buffer } from "micro";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { clerkClient } from "@clerk/nextjs";
import { ROLES } from "../../../lib/role-management";

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
  const eventType = body.type;

  console.log(`Webhook received: ${eventType}`);

  try {
    // Verify webhook signature using Svix
    // In production, get the webhook secret from environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (webhookSecret) {
      const wh = new Webhook(webhookSecret);
      const headers = {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      };

      // This will throw an error if verification fails
      wh.verify(payload, headers);
    } else {
      console.warn(
        "⚠️ Clerk webhook secret not found - skipping signature verification"
      );
    }

    // Handle events based on type
    switch (eventType) {
      case "user.created":
        console.log(`Creating new user in database: ${body.data.id}`);
        await handleUserCreated(body.data);
        break;

      case "user.updated":
        console.log(`Updating user in database: ${body.data.id}`);
        await handleUserUpdated(body.data);
        break;

      default:
        console.log(`Ignoring unhandled webhook event: ${eventType}`);
    }

    return res.status(200).json({ success: true, event: eventType });
  } catch (error) {
    console.error(`Webhook error for ${eventType}:`, error);
    return res.status(400).json({ error: error.message });
  } finally {
    await disconnectDB();
  }
}

/**
 * Handle user.created webhook event
 * Creates a new user in the database and ensures default role is set
 * @param {Object} userData - User data from Clerk
 */
async function handleUserCreated(userData) {
  await connectDB();

  // Check if user already exists (should be rare, but handle it)
  const existingUser = await User.findOne({ clerkId: userData.id });
  if (existingUser) {
    console.log(`User ${userData.id} already exists in database`);
    return;
  }

  // Extract metadata and email
  const metadata = userData.public_metadata || {};
  const primaryEmailObj = userData.email_addresses.find(
    (email) => email.id === userData.primary_email_address_id
  );
  const email =
    primaryEmailObj?.email_address ||
    userData.email_addresses[0]?.email_address ||
    "";

  // Get role from Clerk metadata or use default "user" role
  const role = metadata.role || ROLES.USER;

  // For agents, check approval status (default approved for users)
  const approved = role === ROLES.AGENT ? metadata.approved === true : true;

  // Create new user in MongoDB
  const user = new User({
    clerkId: userData.id,
    firstName: userData.first_name || "",
    lastName: userData.last_name || "",
    email: email,
    profileImage: userData.image_url || "",
    role: role,
    approved: approved,
  });

  await user.save();
  console.log(`User created in database: ${user._id} with role ${role}`);

  // Ensure the user has role in Clerk metadata if not already set
  if (!metadata.role) {
    try {
      await clerkClient.users.updateUser(userData.id, {
        publicMetadata: {
          ...metadata,
          role: ROLES.USER,
          approved: true,
        },
      });
      console.log(`Default role set in Clerk for user ${userData.id}`);
    } catch (err) {
      console.error(`Failed to set default role in Clerk: ${err.message}`);
    }
  }
}

/**
 * Handle user.updated webhook event
 * Updates user data in MongoDB to match Clerk
 * @param {Object} userData - User data from Clerk
 */
async function handleUserUpdated(userData) {
  await connectDB();

  // Find user in database
  const user = await User.findOne({ clerkId: userData.id });

  // If user doesn't exist, create it
  if (!user) {
    console.log(
      `User ${userData.id} not found in database, creating new record`
    );
    return await handleUserCreated(userData);
  }

  // Extract metadata and role information
  const metadata = userData.public_metadata || {};
  const clerkRole = metadata.role;
  const clerkApproved = metadata.approved === true;

  let needsUpdate = false;

  // Update basic user information
  if (userData.first_name && user.firstName !== userData.first_name) {
    user.firstName = userData.first_name;
    needsUpdate = true;
  }

  if (userData.last_name && user.lastName !== userData.last_name) {
    user.lastName = userData.last_name;
    needsUpdate = true;
  }

  // Update email if primary changed
  const primaryEmailObj = userData.email_addresses.find(
    (email) => email.id === userData.primary_email_address_id
  );

  if (primaryEmailObj && primaryEmailObj.email_address !== user.email) {
    user.email = primaryEmailObj.email_address;
    needsUpdate = true;
  }

  // Update profile image if changed
  if (userData.image_url && user.profileImage !== userData.image_url) {
    user.profileImage = userData.image_url;
    needsUpdate = true;
  }

  // Synchronize role if it exists in Clerk metadata
  if (clerkRole && user.role !== clerkRole) {
    console.log(`Updating role from ${user.role} to ${clerkRole}`);
    user.role = clerkRole;
    needsUpdate = true;
  }

  // Synchronize approval status for agents
  if (user.role === ROLES.AGENT && user.approved !== clerkApproved) {
    user.approved = clerkApproved;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await user.save();
    console.log(`User updated in database: ${user._id}`);
  } else {
    console.log(`No changes needed for user ${user._id}`);
  }
}
