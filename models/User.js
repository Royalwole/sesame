import mongoose from "mongoose";

// Define the User schema
const UserSchema = new mongoose.Schema(
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
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "agent", "agent_pending", "admin"],
      default: "user",
    },
    phone: String,
    bio: String,
    profileImage: String,
    agentDetails: {
      licenseNumber: String,
      agency: String,
      specializations: [String],
      yearsOfExperience: Number,
      approved: Boolean,
      reviewDate: Date,
    },
    savedListings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    }],
  },
  {
    timestamps: true,
  }
);

// Create and export the User model
export default mongoose.models.User || mongoose.model("User", UserSchema);
