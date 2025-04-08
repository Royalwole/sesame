import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import User from '../../../models/User';

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    await connectDB();
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // For security, limit what data is returned
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approved: user.approved,
      created_at: user.created_at
    };
    
    return res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
