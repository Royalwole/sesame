import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAdmin } from '../../../middlewares/authMiddleware';
import User from '../../../models/User';

async function handler(req, res) {
  try {
    await connectDB();
    
    if (req.method === 'GET') {
      // Parse query parameters for filtering
      const { role, approved, page = 1, limit = 20 } = req.query;
      
      // Build query
      const query = {};
      if (role) query.role = role;
      if (approved !== undefined) query.approved = approved === 'true';
      
      const users = await User.find(query)
        .sort({ created_at: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean();
      
      const total = await User.countDocuments(query);
      
      return res.status(200).json({
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    }
    
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAdmin(handler);
