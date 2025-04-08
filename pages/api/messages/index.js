import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import Message from '../../../models/Message';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    
    // Get messages where user is either sender or recipient
    const query = {
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    };
    
    // Fetch messages
    const messages = await Message.find(query)
      .sort({ created_at: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('sender', 'name email')
      .populate('recipient', 'name email')
      .populate('listing', 'title images')
      .lean();
    
    // Get total count for pagination
    const total = await Message.countDocuments(query);
    
    return res.status(200).json({
      messages,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
