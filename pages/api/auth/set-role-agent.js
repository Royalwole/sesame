import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { ROLES } from "../../../lib/role-management";

/**
 * API endpoint for automatically setting a user's role to agent after signup
 *
 * This is called right after Clerk signup, when the user is already authenticated
 * and the role needs to be assigned in both Clerk metadata and MongoDB
 */
export default async function handler(req, res) {
  console.log("[SET-ROLE-AGENT] API endpoint called with query:", req.query);

  // Only allow GET requests (since this is called from the signup redirect)
  if (req.method !== "GET") {
    console.error(`[SET-ROLE-AGENT] Invalid method: ${req.method}`);
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  // Get the authenticated user's ID from Clerk
  const auth = getAuth(req);
  console.log("[SET-ROLE-AGENT] Auth data:", auth);

  const { userId } = auth;

  // Check if we have a valid authenticated user
  if (!userId) {
    console.error(
      "[SET-ROLE-AGENT] No authenticated user found when trying to set agent role"
    );
    return res.redirect(
      `/auth/sign-in?error=${encodeURIComponent("Authentication required")}`
    );
  }

  console.log(`[SET-ROLE-AGENT] Processing for user ID: ${userId}`);
  let dbConnection = false;
  let userCreated = false;

  try {
    // 1. Get the user from Clerk to retrieve their data
    console.log(
      `[SET-ROLE-AGENT] Fetching user data from Clerk for userId: ${userId}`
    );
    const clerkUser = await clerkClient.users.getUser(userId);
    console.log(`[SET-ROLE-AGENT] Clerk user found:`, {
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailCount: clerkUser.emailAddresses?.length || 0,
    });

    // Extract user data from Clerk
    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const email =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "";
    console.log(
      `[SET-ROLE-AGENT] User details - Name: ${firstName} ${lastName}, Email: ${email}`
    );

    // 2. Connect to database
    console.log("[SET-ROLE-AGENT] Connecting to database...");
    await connectDB();
    dbConnection = true;
    console.log("[SET-ROLE-AGENT] Database connected");

    // 3. First update Clerk metadata with the agent role to ensure it's set immediately
    console.log("[SET-ROLE-AGENT] Updating Clerk metadata with agent role");
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        role: ROLES.AGENT,
        approved: true,
      },
    });
    console.log("[SET-ROLE-AGENT] Successfully updated Clerk metadata");

    // 4. Check if user already exists in the database
    console.log(
      `[SET-ROLE-AGENT] Checking if user exists in database with clerkId: ${userId}`
    );
    let dbUser = await User.findOne({ clerkId: userId });
    console.log(`[SET-ROLE-AGENT] User exists in database: ${!!dbUser}`);

    if (!dbUser) {
      console.log("[SET-ROLE-AGENT] Creating new user with agent role");
      dbUser = new User({
        clerkId: userId,
        firstName,
        lastName,
        email,
        role: ROLES.AGENT, // Set role to AGENT
        approved: true, // Auto-approve agents on this special signup flow
        profileImage: clerkUser.imageUrl || "",
      });

      await dbUser.save();
      userCreated = true;
      console.log(
        `[SET-ROLE-AGENT] Created new agent user in database with ID: ${dbUser._id}`
      );
    } else {
      // If user already exists, update their role to agent
      console.log("[SET-ROLE-AGENT] Updating existing user to agent role");
      console.log(
        `[SET-ROLE-AGENT] Previous role: ${dbUser.role}, approved: ${dbUser.approved}`
      );
      dbUser.role = ROLES.AGENT;
      dbUser.approved = true;
      await dbUser.save();
      console.log(
        `[SET-ROLE-AGENT] Updated existing user to agent role: ${userId}`
      );
    }

    // Skip the HTML response and just return a client-side script that forces immediate redirect
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Agent Signup Complete</title>
          <script>
            // Force immediate redirect to agent dashboard
            window.localStorage.removeItem('td_user_cache'); // Clear cache
            window.location.replace('/dashboard/agent'); // Direct navigation to agent dashboard
          </script>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              text-align: center;
              padding-top: 100px;
              background-color: #f5f5f5;
            }
            .loader {
              border: 5px solid #f3f3f3;
              border-top: 5px solid #3498db;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <h1>Agent Registration Complete</h1>
          <div class="loader"></div>
          <p>Redirecting to agent dashboard...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("[SET-ROLE-AGENT] Error setting agent role:", error);
    console.error("[SET-ROLE-AGENT] Error stack:", error.stack);

    // If we created a user, but failed to update Clerk, try to roll back
    if (userCreated && dbConnection) {
      try {
        console.log("[SET-ROLE-AGENT] Rolling back user creation");
        await User.findOneAndDelete({ clerkId: userId });
        console.log("[SET-ROLE-AGENT] User creation rolled back successfully");
      } catch (rollbackError) {
        console.error(
          "[SET-ROLE-AGENT] Error rolling back user creation:",
          rollbackError
        );
      }
    }

    return res.redirect(
      `/auth/sign-in?error=${encodeURIComponent(
        "Failed to set agent role. Please contact support."
      )}`
    );
  } finally {
    if (dbConnection) {
      console.log("[SET-ROLE-AGENT] Disconnecting from database");
      await disconnectDB();
      console.log("[SET-ROLE-AGENT] Database disconnected");
    }
  }
}
