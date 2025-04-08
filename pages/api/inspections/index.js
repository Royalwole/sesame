import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import Inspection from '../../../models/Inspection';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const { page = 1, limit = 10, agent = false } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Build query based on user role
    const query = agent === 'true' 
      ? { agent: req.user._id } 
      : { user: req.user._id };
      
    // Fetch inspections
    const inspections = await Inspection.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate('listing', 'title address city state images')
      .lean();
    
    // Get total count for pagination
    const total = await Inspection.countDocuments(query);
    
    return res.status(200).json({
      inspections,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return res.status(500).json({ error: 'Failed to fetch inspections', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
