import { Webhook } from "svix";
import { buffer } from "micro";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { clerkClient } from "@clerk/nextjs";
import { ROLES } from "../../../lib/role-management";
import { syncRoleToDatabase } from "../../../lib/clerk-role-management";
import { webhookRateLimiter } from "../../../lib/api-rate-limiter";
import { logger } from "../../../lib/error-logger";
import { clearUserPermissionCache } from "../../../lib/permissions-manager";

// Disable body parsing, we'll do it ourselves with svix
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Apply rate limiting
  // Note: For webhooks we'll use a higher limit but still protect against abuse
  if (!webhookRateLimiter(req, res)) {
    logger.warn("Webhook rate limit exceeded", {
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
      headers: req.headers,
    });
    return; // Response already sent by the rate limiter
  }

  // Get the signature from the headers
  const svixId = req.headers["svix-id"];
  const svixTimestamp = req.headers["svix-timestamp"];
  const svixSignature = req.headers["svix-signature"];

  // Validate required headers
  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.error("Missing svix headers", {
      svixId: !!svixId,
      svixTimestamp: !!svixTimestamp,
      svixSignature: !!svixSignature,
    });
    return res.status(401).json({ error: "Missing required headers" });
  }

  // Get the webhook secret from environment variable
  const webhookSecret =
    process.env.CLERK_WEBHOOK_SECRET || process.env.SIGNING_SECRET;
  if (!webhookSecret) {
    logger.error("Webhook secret not found in environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Get the raw body
  let rawBody;
  try {
    rawBody = await buffer(req);
  } catch (error) {
    logger.error("Failed to read request body", { error: error.message });
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Initialize the Webhook instance with the secret
  const wh = new Webhook(webhookSecret);
  let payload;

  try {
    // Verify with all headers for best security
    payload = wh.verify(rawBody.toString(), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    logger.error("Webhook verification failed", {
      error: err.message,
      type: err.constructor.name,
    });
    return res.status(401).json({
      error: "Invalid signature",
      message: "The webhook signature verification failed",
    });
  }

  // Handle different webhook events
  const { type, data: userData } = payload;

  try {
    // Log the webhook event
    logger.info(`Processing Clerk webhook: ${type}`, {
      userId: userData?.id,
      event: type,
    });

    switch (type) {
      case "user.created":
        await handleUserCreated(userData);
        break;
      case "user.updated":
        await handleUserUpdated(userData);
        break;
      case "user.deleted":
        await handleUserDeleted(userData);
        break;
      // Add more event types as needed
      default:
        logger.info(`Unhandled webhook event: ${type}`);
    }

    return res.status(200).json({ success: true, event: type });
  } catch (error) {
    logger.error(`Error processing webhook ${type}`, {
      error: error.message,
      stack: error.stack,
      userId: userData?.id,
    });
    return res.status(500).json({
      error: "Webhook processing failed",
      message: "An error occurred while processing the webhook",
    });
  } finally {
    // Ensure database connection is closed
    try {
      await disconnectDB();
    } catch (err) {
      // Just log, don't affect the response
      logger.error("Error disconnecting from database", { error: err.message });
    }
  }
}

/**
 * Handle user.created webhook event
 * Creates a new user in the database and uses Clerk metadata as the source of truth for roles
 * @param {Object} userData - User data from Clerk
 */
async function handleUserCreated(userData) {
  await connectDB();

  // Check if user already exists (should be rare, but handle it)
  const existingUser = await User.findOne({ clerkId: userData.id });
  if (existingUser) {
    logger.info(`User ${userData.id} already exists in database`);
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
  const approved = metadata.approved === true || role !== ROLES.AGENT;

  // Create new user in MongoDB
  const user = new User({
    clerkId: userData.id,
    firstName: userData.first_name || "",
    lastName: userData.last_name || "",
    email: email,
    profileImage: userData.image_url || "",
    role: role,
    approved: approved,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await user.save();
  logger.info(`User created in database`, {
    userId: userData.id,
    role: role,
    approved: approved,
  });

  // Ensure the user has role in Clerk metadata if not already set
  if (!metadata.role) {
    try {
      await clerkClient.users.updateUser(userData.id, {
        publicMetadata: {
          ...metadata,
          role: ROLES.USER,
          approved: true,
          lastUpdated: new Date().toISOString(),
        },
      });
      logger.info(`Set default role for new user ${userData.id}`);
    } catch (error) {
      logger.error("Failed to update user metadata", {
        userId: userData.id,
        error: error.message,
      });
      // Continue anyway - the user is created, and we can fix metadata later
    }
  }

  // Clear permission cache for the new user
  clearUserPermissionCache(userData.id);
}

/**
 * Handle user.updated webhook event
 * Updates user data in MongoDB based on Clerk, treating Clerk as source of truth for role
 * @param {Object} userData - User data from Clerk
 */
async function handleUserUpdated(userData) {
  await connectDB();

  // Find the user in our database
  const dbUser = await User.findOne({ clerkId: userData.id });
  if (!dbUser) {
    logger.info(`User ${userData.id} not found in database, creating now`);
    return await handleUserCreated(userData);
  }

  // Extract updated metadata and email
  const metadata = userData.public_metadata || {};
  const primaryEmailObj = userData.email_addresses.find(
    (email) => email.id === userData.primary_email_address_id
  );
  const email =
    primaryEmailObj?.email_address ||
    userData.email_addresses[0]?.email_address ||
    "";

  // Store old values to detect changes
  const oldRole = dbUser.role;
  const oldApproved = dbUser.approved;

  // Update basic user information
  dbUser.firstName = userData.first_name || dbUser.firstName;
  dbUser.lastName = userData.last_name || dbUser.lastName;
  dbUser.email = email || dbUser.email;
  dbUser.profileImage = userData.image_url || dbUser.profileImage;
  dbUser.updatedAt = new Date();

  // Detect if role was changed
  let roleChanged = false;

  // Update role and approval status from Clerk metadata (source of truth)
  if (metadata.role && dbUser.role !== metadata.role) {
    logger.info(`Updating user role via webhook`, {
      userId: userData.id,
      oldRole: dbUser.role,
      newRole: metadata.role,
    });

    dbUser.role = metadata.role;
    roleChanged = true;

    // Record the change in the user document
    dbUser.lastRoleChange = {
      previousRole: oldRole,
      newRole: metadata.role,
      timestamp: new Date(),
      changedBy: "clerk-webhook",
      reason: "Role updated via Clerk",
    };
  }

  // Update approval status
  let approvalChanged = false;
  if (
    dbUser.role === ROLES.AGENT &&
    dbUser.approved !== (metadata.approved === true)
  ) {
    dbUser.approved = metadata.approved === true;
    approvalChanged = true;

    logger.info(`Agent approval status changed via webhook`, {
      userId: userData.id,
      approved: dbUser.approved,
    });
  } else if (dbUser.role !== ROLES.AGENT && !dbUser.approved) {
    // Non-agent roles are always approved
    dbUser.approved = true;
    approvalChanged = true;
  }

  // Save the changes
  await dbUser.save();

  // Clear permission cache if role or approval status changed
  if (roleChanged || approvalChanged) {
    logger.info(`Clearing permission cache after role/approval change`, {
      userId: userData.id,
      roleChanged,
      approvalChanged,
    });

    clearUserPermissionCache(userData.id);
  }

  logger.info(`User updated in database via webhook`, {
    userId: userData.id,
    roleChanged,
    approvalChanged,
  });
}

/**
 * Handle user.deleted webhook event
 * @param {Object} userData - User data from Clerk
 */
async function handleUserDeleted(userData) {
  await connectDB();

  // Soft-delete the user from our database
  const result = await User.updateOne(
    { clerkId: userData.id },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    }
  );

  if (result.modifiedCount > 0) {
    logger.info(`User marked as deleted in database`, {
      userId: userData.id,
    });

    // Clear the permission cache for the deleted user
    clearUserPermissionCache(userData.id);
  } else {
    logger.info(`User not found for deletion`, {
      userId: userData.id,
    });
  }
}
