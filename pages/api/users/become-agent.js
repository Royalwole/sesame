import { connectDB, disconnectDB } from "../../../lib/db";
import User from "../../../models/User";
import { requireAuth } from "../../../middlewares/authMiddleware";
import { getAuth } from "@clerk/nextjs/server";
import { IncomingForm } from "formidable";
import path from "path";
import { storage } from "../../../lib/firebase-config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import fs from "fs";

// Configure API route to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Debug authentication headers
    console.log("Auth headers:", {
      authorization: req.headers.authorization ? "Present" : "Missing",
      cookie: req.headers.cookie ? "Present" : "Missing",
    });

    await connectDB();

    try {
      // Get the authenticated user's Clerk ID
      const auth = getAuth(req);
      console.log("Auth data:", { userId: auth?.userId || "Not found" });

      if (!auth?.userId) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Please sign in to submit an agent application",
        });
      }

      const clerkId = auth.userId;
      console.log("Processing agent application for user:", clerkId);

      // Parse the form data with formidable
      const form = new IncomingForm({
        keepExtensions: true,
        multiples: true,
      });

      // Parse the form
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve([fields, files]);
        });
      });

      // Find the user in our database
      let user = await User.findOne({ clerkId });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Process profile image if provided
      let profileImageUrl = user.profileImage; // Keep existing image by default

      if (files.profileImage) {
        const file = files.profileImage[0] || files.profileImage;

        if (file) {
          try {
            // Read file content
            const fileBuffer = fs.readFileSync(file.filepath);

            // Generate a unique filename for Firebase Storage
            const fileExt = path.extname(file.originalFilename || "image.jpg");
            const fileName = `agent-profiles/${clerkId}-${Date.now()}${fileExt}`;

            // Create a storage reference
            const storageRef = ref(storage, fileName);

            // Upload to Firebase Storage
            const snapshot = await uploadBytes(storageRef, fileBuffer, {
              contentType: file.mimetype || "image/jpeg",
            });

            // Get download URL
            profileImageUrl = await getDownloadURL(snapshot.ref);

            console.log("Profile image uploaded:", profileImageUrl);
          } catch (uploadError) {
            console.error("Error uploading profile image:", uploadError);
            // Continue without failing the entire operation
          }
        }
      }

      // Update user with agent application details - Handle both array and non-array field formats
      user.firstName =
        fields.firstName?.[0] || fields.firstName || user.firstName;
      user.lastName = fields.lastName?.[0] || fields.lastName || user.lastName;
      user.phone = fields.phone?.[0] || fields.phone || user.phone;
      user.address = fields.address?.[0] || fields.address || user.address;
      user.city = fields.city?.[0] || fields.city || user.city;
      user.state = fields.state?.[0] || fields.state || user.state;
      user.profileImage = profileImageUrl;
      user.bio = fields.bio?.[0] || fields.bio || user.bio;

      // Add agent-specific fields
      user.agentDetails = {
        experience: fields.experience?.[0] || fields.experience || "0-1",
        licenseNumber: fields.licenseNumber?.[0] || fields.licenseNumber || "",
        company: fields.company?.[0] || fields.company || "",
      };

      // Change role to pending agent
      user.role = "agent_pending";
      user.approved = false; // Requires admin approval

      await user.save();

      console.log("Agent application submitted for:", user._id);

      return res.status(200).json({
        success: true,
        message: "Agent application submitted successfully",
      });
    } catch (authError) {
      console.error("Authentication error in become-agent:", authError);
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message:
          "Unable to authenticate your request. Please try again or contact support.",
      });
    }
  } catch (error) {
    console.error("Error processing agent application:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message || "Failed to process agent application",
    });
  } finally {
    await disconnectDB();
  }
}

// Protect this API route with authentication middleware
export default requireAuth(handler);
