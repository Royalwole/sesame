import { connectDB, disconnectDB } from '../../../lib/db';
import { requireAuth } from '../../../middlewares/authMiddleware';
import Inspection from '../../../models/Inspection';

async function handler(req, res) {
  const { id } = req.query;
  
  try {
    await connectDB();
    
    if (req.method === 'GET') {
      const inspection = await Inspection.findById(id)
        .populate('listing', 'title address city state images')
        .populate('user', 'name email')
        .populate('agent', 'name email')
        .lean();
      
      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }
      
      // Check if user is authorized to view this inspection
      const isUserAuthorized = inspection.user._id.toString() === req.user._id.toString();
      const isAgentAuthorized = inspection.agent._id.toString() === req.user._id.toString();
      
      if (!isUserAuthorized && !isAgentAuthorized) {
        return res.status(403).json({ error: 'Not authorized to view this inspection' });
      }
      
      return res.status(200).json(inspection);
    }
    
    if (req.method === 'PATCH') {
      const { status } = req.body;
      
      const inspection = await Inspection.findById(id);
      
      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }
      
      // Only the agent can update the status
      if (inspection.agent.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to update this inspection' });
      }
      
      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      // Update status
      inspection.status = status;
      await inspection.save();
      
      return res.status(200).json({
        message: 'Inspection status updated',
        inspection: {
          id: inspection._id,
          status: inspection.status,
          updated_at: inspection.updated_at
        }
      });
    }
    
    if (req.method === 'DELETE') {
      const inspection = await Inspection.findById(id);
      
      if (!inspection) {
        return res.status(404).json({ error: 'Inspection not found' });
      }
      
      // Only the user who created the inspection can delete it
      if (inspection.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to delete this inspection' });
      }
      
      // Only allow deletion of pending inspections
      if (inspection.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Cannot delete inspection that has already been processed' 
        });
      }
      
      await inspection.deleteOne();
      
      return res.status(200).json({ message: 'Inspection cancelled successfully' });
    }
    
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Error processing inspection:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  } finally {
    await disconnectDB();
  }
}

export default requireAuth(handler);
