import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import Inspection from '../../../models/Inspection';
import Listing from '../../../models/Listing';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const { listingId, date, time, notes } = req.body;
    
    // Validate required fields
    if (!listingId || !date || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Listing ID, date, and time are required'
      });
    }
    
    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Create inspection request
    const inspection = new Inspection({
      listing: listingId,
      user: req.user._id,
      agent: listing.agent,
      date,
      time,
      notes,
      status: 'pending'
    });
    
    await inspection.save();
    
    // Return success response
    return res.status(201).json({
      message: 'Inspection scheduled successfully',
      inspection: {
        id: inspection._id,
        date: inspection.date,
        time: inspection.time,
        status: inspection.status
      }
    });
  } catch (error) {
    console.error('Error scheduling inspection:', error);
    return res.status(500).json({ error: 'Failed to schedule inspection', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
