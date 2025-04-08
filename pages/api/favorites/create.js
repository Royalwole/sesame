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
      return res.status(400).json({ error: 'Listing is already in favorites' });
    }
    
    // Create new favorite
    const favorite = new Favorite({
      user: req.user._id,
      listing: listingId
    });
    
    await favorite.save();
    
    return res.status(201).json({
      message: 'Added to favorites',
      favorite: {
        id: favorite._id,
        listing: listingId,
        created_at: favorite.created_at
      }
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return res.status(500).json({ error: 'Failed to add favorite', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
