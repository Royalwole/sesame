const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing'
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false // No need for updated_at as messages don't get updated
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, read: 1 });

// Static method to get unread message count
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
