import { connectDB, disconnectDB } from "../../../../lib/db";
import User from "../../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import { apiResponse } from "../../../../lib/api-response";

/**
 * API endpoint to update a user's role
 * Only accessible by admins
 */
export default async function handler(req, res) {
  // Only allow PATCH method
  if (req.method !== "PATCH") {
    return apiResponse(res, 405, { error: "Method not allowed" });
  }

  // Track database connection
  let dbConnection = false;

  try {
    // Get authenticated user from Clerk
    const auth = getAuth(req);

    if (!auth?.userId) {
      return apiResponse(res, 401, { error: "Unauthorized" });
    }

    // Connect to database
    try {
      await connectDB();
      dbConnection = true;
    } catch (connectionError) {
      console.error(
        "User role API: Database connection error:",
        connectionError
      );
      return apiResponse(res, 503, {
        error: "Database connection failed",
        message: "Unable to connect to the database. Please try again later.",
      });
    }

    // Get the admin user first to verify they have admin role
    const adminUser = await User.findOne({ clerkId: auth.userId });

    if (!adminUser || adminUser.role !== "admin") {
      return apiResponse(res, 403, {
        error: "Access forbidden. Admin privileges required.",
      });
    }

    // Get user ID from URL parameter
    const userId = req.query.id;
    if (!userId) {
      return apiResponse(res, 400, { error: "User ID is required" });
    }

    // Get the new role from the request body
    const { role } = req.body;
    if (!role) {
      return apiResponse(res, 400, { error: "Role is required" });
    }

    // Get valid roles from the role-management module
    const validRoles = ["admin", "agent", "agent_pending", "user", "support"];

    if (!validRoles.includes(role)) {
      return apiResponse(res, 400, {
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Find the user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return apiResponse(res, 404, { error: "User not found" });
    }

    // Don't allow admins to change their own role (security measure)
    if (userToUpdate.clerkId === auth.userId) {
      return apiResponse(res, 403, {
        error: "You cannot change your own admin role",
      });
    }

    // Update the user role in MongoDB
    const oldRole = userToUpdate.role;
    userToUpdate.role = role;
    await userToUpdate.save();

    console.log(
      `User role updated: ${userToUpdate.email} from ${oldRole} to ${role}`
    );

    // If the user has a Clerk ID, also update metadata in Clerk
    if (userToUpdate.clerkId) {
      try {
        // Update the user's public metadata in Clerk
        await clerkClient.users.updateUser(userToUpdate.clerkId, {
          publicMetadata: {
            ...(await clerkClient.users
              .getUser(userToUpdate.clerkId)
              .then((u) => u.publicMetadata || {})),
            role: role,
          },
        });

        console.log(`Clerk metadata updated for user ${userToUpdate.email}`);
      } catch (clerkError) {
        console.error("Failed to update Clerk metadata:", clerkError);
        // Continue with the response even if Clerk update fails
        // We'll handle this as a partial success
        return apiResponse(
          res,
          207,
          {
            user: userToUpdate,
            warnings: ["Database updated but Clerk metadata sync failed"],
          },
          "User role updated in database only"
        );
      }
    }

    return apiResponse(
      res,
      200,
      {
        user: {
          _id: userToUpdate._id,
          email: userToUpdate.email,
          firstName: userToUpdate.firstName,
          lastName: userToUpdate.lastName,
          role: userToUpdate.role,
        },
      },
      "User role updated successfully"
    );
  } catch (error) {
    console.error("User role API error:", error);
    return apiResponse(res, 500, {
      error: "Internal server error",
      message: error.message,
    });
  } finally {
    // Always disconnect from database if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
      } catch (disconnectError) {
        console.error("Error disconnecting from database:", disconnectError);
      }
    }
  }
}
