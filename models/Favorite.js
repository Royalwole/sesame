const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
  // Reference to the user who favorited the listing
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    alias: 'user_id'
  },
  
  // Reference to the favorited listing
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing ID is required'],
    alias: 'listing_id'
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  // Additional options
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false // No need for updated_at as favorites don't get updated
  },
  toJSON: { virtuals: true, aliases: true }, // Support alias fields in JSON
  toObject: { virtuals: true, aliases: true } // Support alias fields in objects
});

// Ensure a user can favorite a listing only once
favoriteSchema.index({ user: 1, listing: 1 }, { unique: true });

// Method to check if a listing is favorited by a specific user
favoriteSchema.statics.isFavourited = async function(userId, listingId) {
  const favorite = await this.findOne({ user: userId, listing: listingId });
  return !!favorite;
};

// Method to get all favorites for a user
favoriteSchema.statics.getUserFavourites = async function(userId, options = {}) {
  const { limit = 10, skip = 0, populate = true } = options;
  
  const query = this.find({ user: userId })
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limit);
  
  if (populate) {
    return query.populate({
      path: 'listing',
      select: 'title description price images address city state bedrooms bathrooms'
    });
  }
  
  return query;
};

// Method to get favorite count for a listing
favoriteSchema.statics.getListingFavouriteCount = async function(listingId) {
  return this.countDocuments({ listing: listingId });
};

// Method to toggle favorite status
favoriteSchema.statics.toggleFavourite = async function(userId, listingId) {
  const favorite = await this.findOne({ user: userId, listing: listingId });
  
  if (favorite) {
    // If favorite exists, remove it
    await favorite.deleteOne();
    return { 
      favourited: false,
      message: 'Listing removed from favourites'
    };
  } else {
    // If favorite doesn't exist, create it
    await this.create({ user: userId, listing: listingId });
    return { 
      favourited: true,
      message: 'Listing added to favourites'
    };
  }
};

// Export with both British and American spelling for compatibility
const FavoriteModel = mongoose.models.Favorite || 
                      mongoose.models.Favourite || 
                      mongoose.model('Favorite', favoriteSchema);

module.exports = FavoriteModel;
// Also support alternative export name for compatibility
module.exports.Favorite = FavoriteModel;