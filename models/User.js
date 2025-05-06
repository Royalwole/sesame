import mongoose from "mongoose";

// Define notification schema
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["milestone", "system", "inquiry"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

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
    agentStats: {
      totalListings: {
        type: Number,
        default: 0,
      },
      totalViews: {
        type: Number,
        default: 0,
      },
      totalInquiries: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    savedListings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
    ],
    notifications: [notificationSchema],
    lastMilestoneStats: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      activeListings: { type: Number, default: 0 },
      lastChecked: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        if (doc.role === "agent") {
          ret.stats = doc.agentStats;
          ret.hasUnreadNotifications =
            doc.notifications?.some((n) => !n.read) || false;
        }
        delete ret.lastMilestoneStats; // Don't expose in API
        return ret;
      },
    },
  }
);

// Method to update agent stats
UserSchema.methods.updateAgentStats = async function () {
  if (this.role !== "agent") return;

  const Listing = mongoose.model("Listing");

  const stats = await Listing.aggregate([
    { $match: { agent: this._id } },
    {
      $group: {
        _id: null,
        totalListings: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalInquiries: { $sum: "$inquiries" },
      },
    },
  ]);

  if (stats.length > 0) {
    this.agentStats = {
      ...stats[0],
      lastUpdated: new Date(),
    };
    await this.save();
  }

  return this.agentStats;
};

// Pre-save middleware to ensure stats are initialized
UserSchema.pre("save", function (next) {
  if (this.isNew && this.role === "agent") {
    this.agentStats = {
      totalListings: 0,
      totalViews: 0,
      totalInquiries: 0,
      lastUpdated: new Date(),
    };
  }
  next();
});

// Add methods for notification management
UserSchema.methods.addNotification = async function (notification) {
  this.notifications.push(notification);
  await this.save();
  return this.notifications[this.notifications.length - 1];
};

UserSchema.methods.markNotificationsRead = async function (notificationIds) {
  const updates = notificationIds.map((_id) => ({
    updateOne: {
      filter: {
        _id: this._id,
        "notifications._id": _id,
      },
      update: {
        $set: { "notifications.$.read": true },
      },
    },
  }));

  await mongoose.model("User").bulkWrite(updates);
  return true;
};

// Create and export the User model
export default mongoose.models.User || mongoose.model("User", UserSchema);
