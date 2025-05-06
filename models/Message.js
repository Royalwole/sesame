import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for guest inquiries
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Will be populated with listing agent
    },
    name: {
      type: String,
      required: function () {
        return !this.sender; // Required only for guest messages
      },
    },
    email: {
      type: String,
      required: function () {
        return !this.sender; // Required only for guest messages
      },
    },
    phone: String,
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["inquiry", "response", "chat"],
      default: "inquiry",
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update agent's unread count when a new message is created
messageSchema.post("save", async function (doc) {
  if (doc.receiver && !doc.read) {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(doc.receiver, {
      $inc: { unreadMessages: 1 },
    });
  }
});

// Update agent's unread count when a message is marked as read
messageSchema.pre("save", async function (next) {
  if (this.isModified("read") && this.read && this.receiver) {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(this.receiver, {
      $inc: { unreadMessages: -1 },
    });
  }
  next();
});

// Ensure agent's unread count stays accurate when messages are deleted
messageSchema.pre("remove", async function (next) {
  if (this.receiver && !this.read) {
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(this.receiver, {
      $inc: { unreadMessages: -1 },
    });
  }
  next();
});

// Check if model exists before defining
export default mongoose.models.Message ||
  mongoose.model("Message", messageSchema);
