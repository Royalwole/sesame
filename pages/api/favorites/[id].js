import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import Favorite from '../../../models/Favorite';

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    await connectDB();
    
    if (req.method === 'GET') {
      const favorite = await Favorite.findById(id)
        .populate('listing', 'title description price images address city state')
        .lean();
      
      if (!favorite) {
        return res.status(404).json({ error: 'Favorite not found' });
      }
      
      // Check if this favorite belongs to the current user
      if (favorite.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to access this favorite' });
      }
      
      return res.status(200).json(favorite);
    }
    
    if (req.method === 'DELETE') {
      const favorite = await Favorite.findById(id);
      
      if (!favorite) {
        return res.status(404).json({ error: 'Favorite not found' });
      }
      
      // Check if this favorite belongs to the current user
      if (favorite.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this favorite' });
      }
      
      await favorite.deleteOne();
      
      return res.status(200).json({ message: 'Favorite removed successfully' });
    }
    
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error processing favorite:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
