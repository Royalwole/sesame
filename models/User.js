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
      enum: [
        "user",
        "agent",
        "agent_pending",
        "admin",
        "super_admin",
        "support",
      ],
      default: "user",
    },
    // Approval status for agents
    approved: {
      type: Boolean,
      default: false,
    },
    phone: String,
    bio: String,
    profileImage: String,

    // Enhanced fields to store Clerk data
    externalAccounts: [
      {
        provider: String,
        providerUserId: String,
        emailAddress: String,
        profileImageUrl: String,
        username: String,
        verified: Boolean,
      },
    ],

    // Email addresses from Clerk
    emailAddresses: [
      {
        emailAddressId: String,
        email: String,
        verified: Boolean,
        primary: Boolean,
        verificationStrategy: String,
        linkedTo: [
          {
            type: String, // e.g., "oauth_google"
            id: String,
          },
        ],
      },
    ],

    // Phone numbers from Clerk
    phoneNumbers: [
      {
        phoneNumberId: String,
        phoneNumber: String,
        verified: Boolean,
        primary: Boolean,
        reserved: Boolean,
      },
    ],

    // Session information
    lastActiveAt: Date,
    lastSignInAt: Date,
    createdVia: String, // e.g., "email_code", "oauth_google"

    // User verification and security
    emailVerified: Boolean,
    phoneVerified: Boolean,
    twoFactorEnabled: Boolean,
    mfaPhoneStrategy: {
      enabled: Boolean,
      defaultSecondFactor: Boolean,
    },
    mfaTotpStrategy: {
      enabled: Boolean,
      defaultSecondFactor: Boolean,
    },
    mfaBackupCodesStrategy: {
      enabled: Boolean,
    },

    // OAuth account information
    oauth: {
      googleAccount: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      githubAccount: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      facebookAccount: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      // Add other OAuth providers as needed
    },

    // Store all public metadata from Clerk
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Store user preferences
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Extended profile information
    profile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // User's organizations from Clerk
    organizations: [
      {
        orgId: String,
        name: String,
        slug: String,
        role: String,
        permissions: [String],
      },
    ],

    // Track last synchronization with Clerk
    clerkSyncInfo: {
      lastSynced: Date,
      syncStatus: String,
      lastError: String,
      syncHistory: [
        {
          date: Date,
          status: String,
          source: String, // "webhook", "api", "batch"
          error: String,
        },
      ],
    },

    // User access information
    lastLogin: {
      date: Date,
      ipAddress: String,
      userAgent: String,
      geoLocation: {
        country: String,
        region: String,
        city: String,
      },
    },

    // Ban/restriction status
    restrictionStatus: {
      isBanned: {
        type: Boolean,
        default: false,
      },
      bannedReason: String,
      bannedAt: Date,
      restrictedFeatures: [String],
      temporaryRestrictionUntil: Date,
    },

    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,

    // Agent-specific fields
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

        // Don't expose sensitive data
        delete ret.metadata?.privateData;
        delete ret.oauth;
        delete ret.mfaBackupCodesStrategy;
        delete ret.mfaPhoneStrategy;
        delete ret.mfaTotpStrategy;
        delete ret.restrictionStatus;

        return ret;
      },
    },
    // Add index for better query performance
    indexes: [
      { role: 1 },
      { email: 1 },
      { isDeleted: 1 },
      { "clerkSyncInfo.lastSynced": 1 },
      { approved: 1 },
    ],
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

/**
 * Method to comprehensively update user from Clerk data
 * Centralizes the logic for mapping Clerk data to MongoDB
 */
UserSchema.methods.updateFromClerkData = function (clerkUser) {
  if (!clerkUser) return this;

  // Extract metadata
  const metadata = clerkUser.publicMetadata || {};
  const privateMetadata = clerkUser.privateMetadata || {};

  // Update basic fields
  this.firstName = clerkUser.firstName || this.firstName;
  this.lastName = clerkUser.lastName || this.lastName;

  // Update last activity timestamps
  if (clerkUser.lastActiveAt) {
    this.lastActiveAt = new Date(clerkUser.lastActiveAt);
  }
  if (clerkUser.lastSignInAt) {
    this.lastSignInAt = new Date(clerkUser.lastSignInAt);

    // Also update our custom lastLogin field with more details
    if (
      !this.lastLogin ||
      new Date(clerkUser.lastSignInAt) > this.lastLogin.date
    ) {
      this.lastLogin = {
        date: new Date(clerkUser.lastSignInAt),
        // Other fields would be populated elsewhere
      };
    }
  }
  if (clerkUser.createdAt) {
    // Only set on first sync
    if (!this.createdAt) {
      this.createdAt = new Date(clerkUser.createdAt);
    }
  }

  // Handle email addresses
  if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
    this.emailAddresses = clerkUser.emailAddresses.map((email) => ({
      emailAddressId: email.id,
      email: email.emailAddress,
      verified: email.verification?.status === "verified",
      primary: email.id === clerkUser.primaryEmailAddressId,
      verificationStrategy: email.verification?.strategy,
      linkedTo: email.linkedTo?.map((link) => ({
        type: link.type,
        id: link.id,
      })),
    }));

    // Set primary email as main email field
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    if (primaryEmail?.emailAddress) {
      this.email = primaryEmail.emailAddress;
      this.emailVerified = primaryEmail.verification?.status === "verified";
    }
  }

  // Handle phone numbers
  if (clerkUser.phoneNumbers && clerkUser.phoneNumbers.length > 0) {
    this.phoneNumbers = clerkUser.phoneNumbers.map((phone) => ({
      phoneNumberId: phone.id,
      phoneNumber: phone.phoneNumber,
      verified: phone.verification?.status === "verified",
      primary: phone.id === clerkUser.primaryPhoneNumberId,
      reserved: phone.reserved || false,
    }));

    // Set primary phone as main phone field
    const primaryPhone = clerkUser.phoneNumbers.find(
      (phone) => phone.id === clerkUser.primaryPhoneNumberId
    );

    if (primaryPhone?.phoneNumber) {
      this.phone = primaryPhone.phoneNumber;
      this.phoneVerified = primaryPhone.verification?.status === "verified";
    }
  }

  // Handle external accounts / OAuth providers
  if (clerkUser.externalAccounts && clerkUser.externalAccounts.length > 0) {
    this.externalAccounts = clerkUser.externalAccounts.map((account) => ({
      provider: account.provider,
      providerUserId: account.providerUserId,
      emailAddress: account.emailAddress,
      profileImageUrl: account.profileImageUrl,
      username: account.username,
      verified: account.verification?.status === "verified",
    }));

    // Store OAuth account details in our oauth object
    clerkUser.externalAccounts.forEach((account) => {
      const provider = account.provider.toLowerCase();
      if (
        provider === "google" ||
        provider === "github" ||
        provider === "facebook"
      ) {
        this.oauth = this.oauth || {};
        this.oauth[`${provider}Account`] = {
          id: account.providerUserId,
          username: account.username,
          email: account.emailAddress,
          profileImageUrl: account.profileImageUrl,
          firstName: account.firstName,
          lastName: account.lastName,
        };
      }
    });
  }

  // Update role and approved status from metadata
  if (metadata.role) {
    this.role = metadata.role;

    // Update approval status based on role
    if (this.role === "agent") {
      this.approved = metadata.approved === true;
    } else if (this.role === "agent_pending") {
      this.approved = false;
    } else {
      this.approved = true; // Non-agent roles are always "approved"
    }
  }

  // Update profile image
  if (clerkUser.imageUrl) {
    this.profileImage = clerkUser.imageUrl;
  }

  // Update other metadata fields
  this.metadata = {
    ...(this.metadata || {}),
    clerkMetadata: metadata,
  };

  // Update preferences if available
  if (metadata.preferences) {
    this.preferences = metadata.preferences;
  }

  // Update extended profile if available
  if (metadata.profile) {
    this.profile = {
      ...(this.profile || {}),
      ...metadata.profile,
    };
  }

  // Update MFA settings if applicable
  if (clerkUser.twoFactorEnabled !== undefined) {
    this.twoFactorEnabled = clerkUser.twoFactorEnabled;
  }

  // Handle organization memberships
  if (clerkUser.organizationMemberships?.length > 0) {
    this.organizations = clerkUser.organizationMemberships.map(
      (membership) => ({
        orgId: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
        permissions: membership.permissions || [],
      })
    );
  }

  // Update sync tracking
  const syncRecord = {
    date: new Date(),
    status: "success",
    source: "api",
    error: null,
  };

  this.clerkSyncInfo = {
    lastSynced: new Date(),
    syncStatus: "success",
    lastError: null,
    syncHistory: [...(this.clerkSyncInfo?.syncHistory || []), syncRecord].slice(
      -10
    ), // Keep last 10 records
  };

  return this;
};

/**
 * Static method to sync a user from Clerk by ID
 */
UserSchema.statics.syncFromClerk = async function (clerkId) {
  if (!clerkId) throw new Error("Clerk ID is required");

  try {
    const UserModel = this;
    const { clerkClient } = await import("@clerk/nextjs/server");

    // Get the user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId);
    if (!clerkUser) throw new Error("User not found in Clerk");

    // Find or create user
    let dbUser = await UserModel.findOne({ clerkId });

    if (!dbUser) {
      // Create new user
      dbUser = new UserModel({
        clerkId,
        firstName: clerkUser.firstName || "User",
        email:
          clerkUser.emailAddresses[0]?.emailAddress || "unknown@example.com",
      });
    }

    // Update user with Clerk data
    dbUser.updateFromClerkData(clerkUser);
    await dbUser.save();

    return {
      success: true,
      user: dbUser,
    };
  } catch (error) {
    console.error("Error syncing user from Clerk:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Query helper to exclude deleted users
 */
UserSchema.query.notDeleted = function () {
  return this.where({ isDeleted: { $ne: true } });
};

/**
 * Query helper to find active agents
 */
UserSchema.query.activeAgents = function () {
  return this.where({
    role: "agent",
    approved: true,
    isDeleted: { $ne: true },
  });
};

// Create and export the User model
export default mongoose.models.User || mongoose.model("User", UserSchema);
