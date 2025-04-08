import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAdmin } from '../../../middlewares/authMiddleware';
import User from '../../../models/User';
import Listing from '../../../models/Listing';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    
    const { type, id } = req.body;
    
    if (!type || !id) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Type and ID are required'
      });
    }
    
    // Handle agent approval
    if (type === 'agent') {
      const agent = await User.findById(id);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      if (agent.role !== 'agent') {
        return res.status(400).json({ error: 'User is not an agent' });
      }
      
      if (agent.approved) {
        return res.status(400).json({ error: 'Agent is already approved' });
      }
      
      // Approve agent
      agent.approved = true;
      await agent.save();
      
      return res.status(200).json({
        message: 'Agent approved successfully',
        agent: {
          id: agent._id,
          name: agent.name,
          email: agent.email,
          approved: agent.approved
        }
      });
    }
    
    // Handle listing approval
    if (type === 'listing') {
      const listing = await Listing.findById(id);
      
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      
      if (listing.status === 'published') {
        return res.status(400).json({ error: 'Listing is already published' });
      }
      
      // Approve listing
      listing.status = 'published';
      listing.published_at = Date.now();
      await listing.save();
      
      return res.status(200).json({
        message: 'Listing published successfully',
        listing: {
          id: listing._id,
          title: listing.title,
          status: listing.status,
          published_at: listing.published_at
        }
      });
    }
    
    return res.status(400).json({ error: 'Invalid approval type' });
  } catch (error) {
    console.error('Error approving item:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAdmin(handler);
