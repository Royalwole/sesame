import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import Favorite from '../../../models/Favorite';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const { listingId } = req.body;
    
    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required' });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      listing: listingId
    });
    
    if (existingFavorite) {
      // Remove from favorites
      await existingFavorite.deleteOne();
      
      return res.status(200).json({
        favourited: false,
        message: 'Removed from favorites'
      });
    } else {
      // Add to favorites
      const favorite = new Favorite({
        user: req.user._id,
        listing: listingId
      });
      
      await favorite.save();
      
      return res.status(200).json({
        favourited: true,
        message: 'Added to favorites',
        favoriteId: favorite._id
      });
    }
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
