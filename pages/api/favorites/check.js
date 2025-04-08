import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import Favorite from '../../../models/Favorite';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const { listingId } = req.query;
    
    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required' });
    }
    
    // Check if listing is favorited by user
    const favorite = await Favorite.findOne({
      user: req.user._id,
      listing: listingId
    });
    
    return res.status(200).json({
      isFavorited: !!favorite,
      favoriteId: favorite ? favorite._id : null
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
