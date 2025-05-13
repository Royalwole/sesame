import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs";
import { sanitizeString } from "../../../lib/validation";
import { apiResponse } from "../../../lib/api-response";

// Add emergency fallback user provider for extreme cases
const provideFallbackUserData = (userId, email, firstName, lastName) => {
  return {
    _id: "fallback_" + userId?.substring(0, 8) || "unknown",
    clerkId: userId || "unknown",
    firstName: firstName || "User",
    lastName: lastName || "",
    email: email || "unknown@example.com",
    role: "user", // Always fallback to regular user role
    profileImage: "",
    isEmergencyFallback: true, // Flag to identify fallback data
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

async function handler(req, res) {
  // Only allow GET and PUT methods
  if (!["GET", "PUT"].includes(req.method)) {
    return apiResponse(res, 405, { error: "Method not allowed" });
  }

  // Track database connection
  let dbConnection = false;
  let connectionAttempts = 0;
  const maxConnectionAttempts = 3;

  // Get authenticated user from Clerk early to have it available even if DB fails
  const auth = getAuth(req);
  if (!auth?.userId) {
    console.error("No auth.userId available");
    return apiResponse(res, 401, { error: "Unauthorized" });
  }

  console.log(`Profile API: Authenticated userId = ${auth.userId}`);
  console.log(`Profile API: Request method = ${req.method}`);

  try {
    // Enhanced database connection with retry logic
    while (connectionAttempts < maxConnectionAttempts && !dbConnection) {
      try {
        connectionAttempts++;
        console.log(
          `Profile API: Connecting to database (attempt ${connectionAttempts}/${maxConnectionAttempts})`
        );
        await connectDB();
        dbConnection = true;
        console.log("Profile API: Database connected successfully");
      } catch (connectionError) {
        console.error(
          `Profile API: Database connection error (attempt ${connectionAttempts}/${maxConnectionAttempts}):`,
          connectionError
        );

        // If we've reached max attempts, we'll continue with a fallback
        if (connectionAttempts >= maxConnectionAttempts) {
          console.warn(
            "Profile API: Max connection attempts reached, continuing with fallback"
          );
          // We'll handle the fallback in the main try-catch block
          break;
        }

        // Exponential backoff delay before retry
        const delay = Math.min(500 * Math.pow(2, connectionAttempts), 2000);
        console.log(`Profile API: Retrying connection after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Find the user in the database with improved error handling
    let user;

    // Only try to query the database if we have a connection
    if (dbConnection) {
      try {
        user = await User.findOne({ clerkId: auth.userId });
        console.log(
          `Profile API: User lookup by clerkId result: ${user ? "Found" : "Not found"}`
        );
      } catch (dbError) {
        console.error("Profile API: Error querying user by clerkId:", dbError);
        // Continue with the flow, we'll try fallbacks or create a new user
      }

      // If user not found by clerkId, try finding by email as fallback
      if (!user && auth.sessionClaims?.email) {
        try {
          console.log(
            "Profile API: User not found by clerkId, trying email lookup"
          );
          user = await User.findOne({ email: auth.sessionClaims.email });
          console.log(
            `Profile API: User lookup by email result: ${user ? "Found" : "Not found"}`
          );

          // If found by email but clerkId doesn't match, update it
          if (user && user.clerkId !== auth.userId) {
            console.log(
              "Profile API: Updating user clerkId to match authentication"
            );
            user.clerkId = auth.userId;
            await user.save();
          }
        } catch (emailLookupError) {
          console.error(
            "Profile API: Error in email lookup:",
            emailLookupError
          );
          // Continue with flow
        }
      }
    }

    // If still no user found and we have a database connection, try to create a new user
    if (!user && dbConnection) {
      try {
        console.log("Profile API: Creating new user profile");

        // Get more comprehensive user data from Clerk
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        console.log("Profile API: Retrieved user data from Clerk");

        // Primary email
        const primaryEmailObj = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        );
        const primaryEmail =
          primaryEmailObj?.emailAddress ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          auth.sessionClaims?.email;

        console.log(`Profile API: Using email: ${primaryEmail}`);

        if (!primaryEmail) {
          console.error("Profile API: No email available for user creation");
          return apiResponse(res, 400, {
            error: "Unable to create user profile: email required",
          });
        }

        // Create minimal user record to avoid validation errors
        user = new User({
          clerkId: auth.userId,
          email: primaryEmail,
          firstName:
            clerkUser.firstName || auth.sessionClaims?.firstName || "User",
          lastName: clerkUser.lastName || auth.sessionClaims?.lastName || "",
          profileImage: clerkUser.imageUrl || "",
          role: "user", // Default role
        });

        await user.save();
        console.log("Profile API: Created new user profile:", user._id);
      } catch (createError) {
        console.error("Profile API: Error creating user profile:", createError);
        // We'll continue and use fallback user data
      }
    }

    // Emergency fallback: If we still don't have a user (due to DB issues),
    // generate a temporary user object from Clerk data to prevent auth failures
    if (!user) {
      try {
        console.warn(
          "Profile API: All DB operations failed, using emergency fallback data"
        );

        let clerkUser = null;
        try {
          // Try to get user data directly from Clerk
          clerkUser = await clerkClient.users.getUser(auth.userId);
        } catch (clerkError) {
          console.error(
            "Profile API: Error fetching from Clerk API:",
            clerkError
          );
          // Continue with auth session data
        }

        // Use whatever data we can get from auth or Clerk
        const firstName = clerkUser?.firstName || auth.sessionClaims?.firstName;
        const lastName = clerkUser?.lastName || auth.sessionClaims?.lastName;
        const email =
          clerkUser?.emailAddresses?.[0]?.emailAddress ||
          auth.sessionClaims?.email;

        // Create emergency fallback user
        user = provideFallbackUserData(auth.userId, email, firstName, lastName);
        console.log("Profile API: Using fallback user data:", user._id);
      } catch (fallbackError) {
        console.error(
          "Profile API: Even fallback creation failed:",
          fallbackError
        );
        return apiResponse(res, 500, { error: "Complete system failure" });
      }
    }

    // Handle GET request - Return user profile data
    if (req.method === "GET") {
      console.log("Profile API: Handling GET request - returning profile data");
      // Return user data (excluding sensitive fields)
      return apiResponse(
        res,
        200,
        {
          user: {
            _id: user._id,
            clerkId: user.clerkId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || "",
            bio: user.bio || "",
            role: user.role || "user",
            approved: user.approved !== false, // Default to true if undefined
            profileImage: user.profileImage || "",
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || new Date(),
            isEmergencyFallback: user.isEmergencyFallback || false,
          },
        },
        "User profile retrieved successfully"
      );
    }

    // Handle PUT request - Update user profile
    if (req.method === "PUT") {
      // If we don't have a real DB user, don't allow updates
      if (user.isEmergencyFallback) {
        return apiResponse(res, 503, {
          error: "Database unavailable",
          message:
            "Profile updates are not available right now. Please try again later.",
        });
      }

      console.log("Profile API: Handling PUT request - updating profile");
      // Validate request body
      const { firstName, lastName, phone, bio } = req.body;

      if (!firstName || firstName.trim() === "") {
        return apiResponse(res, 400, { error: "First name is required" });
      }

      console.log("Profile API: Updating user fields");
      // Update user in database (only fields that can be updated)
      user.firstName = sanitizeString(firstName);
      user.lastName = sanitizeString(lastName || "");
      user.phone = sanitizeString(phone || "");
      user.bio = sanitizeString(bio || "");

      // Save changes
      await user.save();
      console.log("Profile API: Profile updated successfully");

      // Return updated user
      return apiResponse(
        res,
        200,
        {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || "",
            bio: user.bio || "",
            role: user.role,
          },
        },
        "Profile updated successfully"
      );
    }
  } catch (error) {
    console.error("Profile API error:", error);
    return apiResponse(res, 500, {
      error: "Internal server error",
      message: error.message,
    });
  } finally {
    // Always disconnect from database if we connected
    if (dbConnection) {
      try {
        await disconnectDB();
        console.log("Profile API: Database disconnected");
      } catch (disconnectError) {
        console.error(
          "Profile API: Error disconnecting from database:",
          disconnectError
        );
      }
    }
  }
}

export default handler;
