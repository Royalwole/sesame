import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import mongoose from 'mongoose';

// Since we don't have a Message model yet, let's create a simple one
const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  message: {
    type: String,
    required: true
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
});

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const { recipientId, message, listingId } = req.body;
    
    if (!recipientId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Recipient ID and message are required'
      });
    }
    
    // Create new message
    const newMessage = new Message({
      sender: req.user._id,
      recipient: recipientId,
      message,
      listing: listingId || null
    });
    
    await newMessage.save();
    
    return res.status(201).json({
      message: 'Message sent successfully',
      messageId: newMessage._id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
