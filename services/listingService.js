// Create new service file
import Listing from '../models/Listing';
import { uploadMultipleImages } from '../lib/uploadImage';

/**
 * Service for managing property listings
 */
export async function getListings(filters = {}, options = {}) {
  const { limit = 10, skip = 0, sort = { created_at: -1 } } = options;
  
  // Build query
  const query = {};
  
  // Add filters
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.listingType) query.listingType = filters.listingType;
  if (filters.minPrice) query.price = { $gte: filters.minPrice };
  if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };
  if (filters.city) query.city = { $regex: filters.city, $options: 'i' };
  if (filters.state) query.state = { $regex: filters.state, $options: 'i' };
  if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.bathrooms) query.bathrooms = { $gte: filters.bathrooms };
  
  // Default to published listings only
  if (!filters.status) query.status = 'published';
  
  // Execute query
  const listings = await Listing.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('agent', 'name email phone');
  
  // Get total count for pagination
  const total = await Listing.countDocuments(query);
  
  return { listings, total };
}

export async function getListingById(id) {
  return await Listing.findById(id).populate('agent', 'name email phone');
}

export async function createListing(listingData, userId) {
  // Handle image uploads if present
  if (listingData.images && listingData.images.length > 0) {
    const uploadResult = await uploadMultipleImages(listingData.images, {
      folder: 'listings',
      metadata: { userId }
    });
    
    // Transform uploaded images to the format expected by the model
    listingData.images = uploadResult.results.map(image => ({
      url: image.url,
      caption: '',
      isPrimary: false
    }));
    
    // Set first image as primary
    if (listingData.images.length > 0) {
      listingData.images[0].isPrimary = true;
    }
  }
  
  // Create and save the listing
  const listing = new Listing({
    ...listingData,
    agent: userId
  });
  
  await listing.save();
  return listing;
}

export async function updateListing(id, listingData, userId) {
  // Find the listing
  const listing = await Listing.findById(id);
  
  // Check if user is the owner or admin
  if (listing.agent.toString() !== userId) {
    throw new Error('Not authorized to update this listing');
  }
  
  // Update the listing
  Object.assign(listing, listingData);
  await listing.save();
  
  return listing;
}

export async function deleteListing(id, userId) {
  // Find the listing
  const listing = await Listing.findById(id);
  
  // Check if user is the owner or admin
  if (listing.agent.toString() !== userId) {
    throw new Error('Not authorized to delete this listing');
  }
  
  // Delete the listing
  await listing.deleteOne();
  
  return { success: true };
}
