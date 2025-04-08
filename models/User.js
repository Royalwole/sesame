import mongoose from "mongoose";

// Check if the model already exists to prevent OverwriteModelError
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema(
      {
        clerkId: {
          type: String,
          required: true,
          unique: true,
        },
        firstName: {
          type: String,
          required: true,
        },
        lastName: {
          type: String,
        },
        email: {
          type: String,
          required: true,
        },
        phone: String,
        role: {
          type: String,
          enum: ["user", "agent", "agent_pending", "admin"],
          default: "user",
        },
        profileImage: String,
        bio: String,
        isActive: {
          type: Boolean,
          default: true,
        },
        favorites: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
          },
        ],
        notifications: [
          {
            message: String,
            read: Boolean,
            createdAt: Date,
          },
        ],
        agentDetails: {
          experience: String,
          license: String,
          company: String,
          approved: {
            type: Boolean,
            default: false,
          },
          applicationDate: Date,
        },
        lastLogin: Date,
        metadata: {
          type: Map,
          of: String,
        },
      },
      {
        timestamps: true,
      }
    )
  );

export default User;
