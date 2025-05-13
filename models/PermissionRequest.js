import mongoose from "mongoose";

/**
 * Schema for permission requests in the system
 * Allows users to formally request permissions through a structured workflow
 */
const permissionRequestSchema = new mongoose.Schema({
  // User requesting the permission
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Clerk ID of the user (for easier Clerk integration)
  clerkId: {
    type: String,
    required: true,
  },

  // The specific permission being requested
  permission: {
    type: String,
    required: true,
  },

  // Alternative: if requesting a permission bundle instead of a single permission
  bundleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "permissionBundles",
  },

  // Why the user needs this permission
  justification: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000,
  },

  // How long the permission is needed
  requestedDuration: {
    type: String,
    enum: ["temporary", "permanent"],
    default: "permanent",
  },

  // If temporary, when it should expire
  requestedExpiration: {
    type: Date,
  },

  // The specific resource the permission applies to (if applicable)
  resourceId: {
    type: String,
  },

  // Current status of the request
  status: {
    type: String,
    enum: ["pending", "approved", "denied", "expired", "canceled"],
    default: "pending",
  },

  // Admin who reviewed the request
  reviewedBy: {
    type: String,
  },

  // Admin's reason for approval/denial
  reviewNotes: {
    type: String,
    maxlength: 1000,
  },

  // Tracks each status change
  statusHistory: [
    {
      status: {
        type: String,
        enum: ["pending", "approved", "denied", "expired", "canceled"],
      },
      changedBy: {
        type: String,
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
      },
    },
  ],

  // Standard timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on every save
permissionRequestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add a status change to history
permissionRequestSchema.methods.addStatusChange = function (
  status,
  changedBy,
  notes
) {
  this.status = status;
  this.statusHistory.push({
    status,
    changedBy,
    changedAt: new Date(),
    notes: notes || "",
  });
};

// Check if a request can be approved
permissionRequestSchema.methods.canBeApproved = function () {
  return this.status === "pending";
};

// Check if a request can be denied
permissionRequestSchema.methods.canBeDenied = function () {
  return this.status === "pending";
};

// Check if a request can be canceled
permissionRequestSchema.methods.canBeCanceled = function () {
  return this.status === "pending";
};

const PermissionRequest =
  mongoose.models.PermissionRequest ||
  mongoose.model("PermissionRequest", permissionRequestSchema);

export default PermissionRequest;
