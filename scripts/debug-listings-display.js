import mongoose from 'mongoose';
import Listing from '../models/Listing.js';
import { connectDB } from '../lib/db.js';

async function debugListingsDisplay() {
  try {
    console.log('🔍 Starting listings display debug...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connection established');
    
    // 1. Check total listings count
    const totalListings = await Listing.countDocuments();
    console.log(`📊 Total listings in database: ${totalListings}`);
    
    // 2. Check listings by status
    const publishedCount = await Listing.countDocuments({ status: 'published' });
    const draftCount = await Listing.countDocuments({ status: 'draft' });
    const pendingCount = await Listing.countDocuments({ status: 'pending' });
    const noStatusCount = await Listing.countDocuments({ status: { $exists: false } });
    
    console.log(`📈 Listings by status:
    - Published: ${publishedCount}
    - Draft: ${draftCount}
    - Pending: ${pendingCount}
    - No status: ${noStatusCount}`);
    
    // 3. Get sample of recent listings
    const recentListings = await Listing.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt images price city')
      .lean();
    
    console.log(`🏠 Recent listings (${recentListings.length}):`);
    recentListings.forEach((listing, index) => {
      console.log(`  ${index + 1}. "${listing.title}" - Status: ${listing.status || 'NO STATUS'} - Price: ${listing.price || 'NO PRICE'} - City: ${listing.city || 'NO CITY'} - Images: ${listing.images?.length || 0}`);
    });
    
    // 4. Fix missing status fields
    if (noStatusCount > 0) {
      console.log(`🔧 Fixing ${noStatusCount} listings with missing status...`);
      const updateResult = await Listing.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'published' } }
      );
      console.log(`✅ Updated ${updateResult.modifiedCount} listings to published status`);
    }
    
    // 5. Check for common data issues
    const listingsWithoutTitle = await Listing.countDocuments({ 
      $or: [{ title: { $exists: false } }, { title: '' }] 
    });
    const listingsWithoutPrice = await Listing.countDocuments({ 
      $or: [{ price: { $exists: false } }, { price: 0 }] 
    });
    const listingsWithoutImages = await Listing.countDocuments({ 
      $or: [{ images: { $exists: false } }, { images: [] }] 
    });
    
    console.log(`⚠️  Data quality issues:
    - Missing title: ${listingsWithoutTitle}
    - Missing/zero price: ${listingsWithoutPrice}
    - No images: ${listingsWithoutImages}`);
    
    // 6. Create sample listing if none exist
    if (totalListings === 0) {
      console.log('📝 Creating sample listing for testing...');
      const sampleListing = new Listing({
        title: 'Sample Property for Testing',
        description: 'This is a sample property created for testing the listings display functionality.',
        price: 250000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1500,
        propertyType: 'house',
        listingType: 'sale',
        address: '123 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        status: 'published',
        images: ['https://via.placeholder.com/400x300?text=Sample+Property'],
        features: ['Air Conditioning', 'Parking', 'Security'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await sampleListing.save();
      console.log('✅ Sample listing created successfully');
    }
    
    // 7. Test the API endpoint directly
    console.log('🌐 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3001/api/listings?limit=5');
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ API endpoint working - Found ${data.listings?.length || 0} listings`);
        console.log(`📊 API Response metadata:`, {
          total: data.pagination?.total,
          currentPage: data.pagination?.currentPage,
          totalPages: data.pagination?.totalPages
        });
      } else {
        console.log('❌ API endpoint failed:', data.message || data.error);
      }
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
    }
    
    // 8. Final status check
    const finalPublishedCount = await Listing.countDocuments({ status: 'published' });
    console.log(`\n🎯 Final status: ${finalPublishedCount} published listings ready for display`);
    
    console.log('\n✅ Debug complete! Check the frontend now.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the debug function
debugListingsDisplay().catch(console.error);
