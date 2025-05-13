import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { ROLES } from "../../../lib/role-management";

/**
 * API endpoint for automatically setting a user's role to admin after signup
 *
 * This is called right after Clerk signup, when the user is already authenticated
 * and the role needs to be assigned in both Clerk metadata and MongoDB
 */
export default async function handler(req, res) {
  // Only allow GET requests (since this is called from the signup redirect)
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  // Get the redirect URL from query params or use a default
  const redirectTo = req.query.redirect || "/dashboard/admin";

  // Get the authenticated user's ID from Clerk
  const { userId } = getAuth(req);

  // Check if we have a valid authenticated user
  if (!userId) {
    console.error("No authenticated user found when trying to set admin role");
    return res.redirect(
      `/auth/sign-in?error=${encodeURIComponent("Authentication required")}`
    );
  }

  let dbConnection = false;
  let userCreated = false;

  try {
    // 1. Get the user from Clerk to retrieve their data
    const clerkUser = await clerkClient.users.getUser(userId);

    // Extract user data from Clerk
    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const email =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "";

    // 2. Connect to database
    await connectDB();
    dbConnection = true;

    // 3. Check if user already exists in the database
    let dbUser = await User.findOne({ clerkId: userId });

    // 4. If not, create a new user with the admin role
    if (!dbUser) {
      dbUser = new User({
        clerkId: userId,
        firstName,
        lastName,
        email,
        role: ROLES.ADMIN,
        approved: true, // Admins are always approved
        profileImage: clerkUser.imageUrl || "",
      });

      await dbUser.save();
      userCreated = true;
      console.log(`Created new admin user in database for ${userId}`);
    } else {
      // If user already exists, update their role to admin
      dbUser.role = ROLES.ADMIN;
      dbUser.approved = true;
      await dbUser.save();
      console.log(`Updated existing user to admin role: ${userId}`);
    }

    // 5. Update Clerk metadata with the admin role
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        role: ROLES.ADMIN,
        approved: true,
      },
    });

    console.log(
      `Successfully set admin role for user ${userId} in both Clerk and database`
    );

    // Render a response with JavaScript that redirects after a short delay to ensure roles are properly synced
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Completing Administrator Registration</title>
          <script>
            // Redirect after a short delay to ensure role changes are applied
            setTimeout(() => {
              window.location.href = "${redirectTo}";
            }, 1500);
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
          <h1>Successfully Registered as Administrator!</h1>
          <div class="loader"></div>
          <p>Setting up your admin account...</p>
          <p>You will be redirected to your dashboard shortly.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error setting admin role:", error);

    // If we created a user, but failed to update Clerk, try to roll back
    if (userCreated && dbConnection) {
      try {
        await User.findOneAndDelete({ clerkId: userId });
      } catch (rollbackError) {
        console.error("Error rolling back user creation:", rollbackError);
      }
    }

    return res.redirect(
      `/auth/sign-in?error=${encodeURIComponent("Failed to set admin role. Please contact support.")}`
    );
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
