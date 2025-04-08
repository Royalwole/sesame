// Create new inspection model
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inspectionSchema = new Schema({
  // Reference to the listing being inspected
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing ID is required']
  },
  
  // Reference to the user requesting the inspection
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },

  // Reference to the agent/owner handling the inspection
  agent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agent ID is required']
  },
  
  // Inspection details
  date: {
    type: Date,
    required: [true, 'Inspection date is required']
  },
  
  time: {
    type: String,
    required: [true, 'Inspection time is required']
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
inspectionSchema.index({ listing: 1 });
inspectionSchema.index({ user: 1 });
inspectionSchema.index({ agent: 1 });
inspectionSchema.index({ status: 1 });
inspectionSchema.index({ date: 1 });

module.exports = mongoose.models.Inspection || mongoose.model('Inspection', inspectionSchema);
