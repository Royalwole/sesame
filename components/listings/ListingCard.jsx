import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import PropTypes from "prop-types";
import { useInView } from "react-intersection-observer";
import {
  FiHome,
  FiBed,
  FiBath,
  FiSquare,
  FiHeart,
  FiMapPin,
  FiClock,
  FiAlertTriangle,
  FiImage
} from "react-icons/fi";

// Cache status constants outside component to prevent re-creation
const STATUS_STYLES = Object.freeze({
  for_sale: "bg-green-500",
  sold: "bg-red-500",
  under_contract: "bg-yellow-500",
  pending: "bg-orange-500",
  off_market: "bg-gray-500",
});

const STATUS_TEXT = Object.freeze({
  for_sale: "For Sale",
  sold: "Sold",
  under_contract: "Under Contract",
  pending: "Pending",
  off_market: "Off Market",
});

// Static fallback image
const FALLBACK_IMAGE_DATA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' fill='%23e2e8f0'/%3E%3Cpath d='M50,20 L80,50 L80,80 L20,80 L20,50 Z' fill='%23cbd5e1'/%3E%3C/svg%3E";

// Global image error tracking to identify problematic images across the site
const problematicImages = new Set();

// Improved image URL utility with better error handling and fallbacks
const getImageUrl = (imagePath, fallbackIndex = 0) => {
  if (!imagePath) return null;

  // Check if this image was previously problematic
  if (problematicImages.has(imagePath) && fallbackIndex === 0) {
    console.warn(`Using direct URL for known problematic image: ${imagePath.substring(0, 20)}...`);
    return imagePath; // Skip transformation for known problematic images
  }

  // Vercel Blob base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.trim();
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_BLOB_BASE_URL is not configured');
    return imagePath; // Return direct path as fallback
  }

  try {
    // Handle already formed URLs vs paths
    if (imagePath.startsWith('http')) {
      // Already a full URL - use directly to avoid double-transformation
      return imagePath;
    }
    
    // Ensure proper encoding of the path
    const encodedPath = encodeURIComponent(imagePath.trim());
    
    // Add cache-busting for problematic images that might be cached incorrectly
    const cacheBuster = fallbackIndex > 0 ? `&_cb=${Date.now()}-${fallbackIndex}` : '';
    
    const params = new URLSearchParams({
      w: '800',
      h: '600',
      q: fallbackIndex > 0 ? '65' : '80', // Lower quality on retries for faster loading
      f: 'webp'
    });
    
    return `${baseUrl}/${encodedPath}?${params.toString()}${cacheBuster}`;
  } catch (err) {
    console.error('Error constructing image URL:', err);
    
    // Return the original path if transformation fails
    return imagePath;
  }
};

// Helper function to get fallback image from listing or use default
const getFallbackImageUrl = (images = [], currentIndex = 0) => {
  // Try next available image in the array
  for (let i = currentIndex + 1; i < images.length; i++) {
    if (images[i]) {
      return { url: images[i], index: i };
    }
  }
  
  // If no more images, return default placeholder
  return { url: null, index: -1 };
};

const ListingCard = memo(function ListingCard({ listing, onClick, preloadImages = false, size = "default" }) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
    threshold: 0.1,
  });

  // Safety check for invalid listing with better error messaging
  if (!listing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-gray-500 text-center flex flex-col items-center justify-center min-h-[200px]" role="alert">
        <FiAlertTriangle size={24} className="mb-2 text-amber-400" />
        <p>Property listing unavailable</p>
        <p className="text-xs mt-1 text-gray-400">The requested listing could not be loaded</p>
      </div>
    );
  }

  if (!listing._id) {
    console.error('Listing missing required ID:', listing);
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-gray-500 text-center flex flex-col items-center justify-center min-h-[200px]" role="alert">
        <FiAlertTriangle size={24} className="mb-2 text-amber-400" />
        <p>Invalid listing data</p>
        <p className="text-xs mt-1 text-gray-400">Missing property identifier</p>
      </div>
    );
  }

  // Destructure listing with fallbacks
  const {
    _id,
    title = "Untitled Property",
    price = 0,
    location = {},
    bedrooms = 0,
    bathrooms = 0,
    squareFeet = 0,
    images = [],
    status = "for_sale", // e.g., "for_sale", "sold", "under_contract"
    createdAt,
    propertyType = "residential",
  } = listing;

  // Preload additional images if enabled
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      
      if (preloadImages && Array.isArray(images) && images.length > 0) {
        // Preload primary image first and a maximum of 2 additional images
        const imagesToPreload = images.slice(0, 3);
        imagesToPreload.forEach((imgPath) => {
          if (imgPath) {
            const img = new Image();
            img.src = getImageUrl(imgPath);
            // Monitor for errors on preloaded images to help identify issues early
            img.onerror = () => {
              console.warn(`Preload failed for image: ${imgPath.substring(0, 20)}...`);
              problematicImages.add(imgPath);
            };
          }
        });
      }
    }
  }, [images, preloadImages, hasInitialized]);

  // Reset image state if listing changes
  useEffect(() => {
    setImageError(false);
    setCurrentImageIndex(0);
    setRetryAttempt(0);
    setIsLoading(true);
  }, [_id]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick({ listingId: _id, title });
    }
  }, [_id, title, onClick]);

  // Memoize formatted values
  const formattedPrice = useMemo(() => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price), [price]);

  const locationText = useMemo(() => 
    location?.city && location?.state
      ? `${location.city}, ${location.state}`
      : location?.city || location?.state || "Unknown Location",
    [location?.city, location?.state]
  );

  // Get primary image URL with fallback mechanism
  const hasValidImages = Array.isArray(images) && images.length > 0;
  const currentImage = hasValidImages && currentImageIndex >= 0 && currentImageIndex < images.length 
    ? images[currentImageIndex] 
    : null;
    
  const imageUrl = !imageError && currentImage 
    ? getImageUrl(currentImage, retryAttempt) 
    : null;

  // Format relative time for recent listings
  const isRecentListing = useMemo(() => {
    if (!createdAt) return false;
    try {
      const listingDate = new Date(createdAt);
      const currentDate = new Date();
      const differenceInDays = Math.floor((currentDate - listingDate) / (1000 * 60 * 60 * 24));
      return differenceInDays <= 7; // Listing is 7 days old or newer
    } catch (e) {
      return false;
    }
  }, [createdAt]);

  // Dynamic property icon based on property type
  const PropertyIcon = useMemo(() => {
    switch (propertyType?.toLowerCase()) {
      case 'commercial': 
        return <FiSquare size={48} className="text-gray-400" aria-hidden="true" />;
      case 'land':
        return <FiMapPin size={48} className="text-gray-400" aria-hidden="true" />;
      default: // residential
        return <FiHome size={48} className="text-gray-400" aria-hidden="true" />;
    }
  }, [propertyType]);

  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Enhanced error handling for images with multi-level fallbacks
  const handleImageError = () => {
    // Log the error for debugging
    console.warn(`Image error for listing ${_id}, image index ${currentImageIndex}, attempt ${retryAttempt + 1}`);
    
    // Record problematic image to avoid using transformations
    if (currentImage) {
      problematicImages.add(currentImage);
    }
    
    // Already tried maximum retries on the current image
    if (retryAttempt >= 2) {
      // Try next image in the array if available
      const { url, index } = getFallbackImageUrl(images, currentImageIndex);
      
      if (index >= 0) {
        // We have another image to try
        setCurrentImageIndex(index);
        setRetryAttempt(0);
        setIsLoading(true);
        console.info(`Switching to fallback image ${index + 1}/${images.length} for listing: ${_id}`);
      } else {
        // No more images available, display placeholder
        setImageError(true);
        setIsLoading(false);
        console.error(`Failed to load all images for listing: ${_id}`);
      }
    } else {
      // Try the same image again with cache-busting or direct URL
      setRetryAttempt(prev => prev + 1);
      setIsLoading(true);
      console.info(`Retry attempt ${retryAttempt + 1}/3 for image on listing: ${_id}`);
    }
  };

  // Determine card height based on size prop
  const imageHeight = useMemo(() => {
    switch (size) {
      case "small": return "h-36";
      case "large": return "h-56"; 
      default: return "h-48";
    }
  }, [size]);
  
  // Card component sizing
  const cardStyles = useMemo(() => {
    switch (size) {
      case "small": return "text-sm";
      case "large": return ""; 
      default: return "";
    }
  }, [size]);

  return (
    <Link href={`/listings/${_id}`} passHref>
      <article
        ref={ref}
        className={`block h-full bg-white rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 ${cardStyles}`}
        itemScope
        itemType="http://schema.org/Residence"
        onClick={handleClick}
        role="link"
        tabIndex={0}
        aria-label={`View details for ${title} in ${locationText}`}
      >
        {/* Image Section with loading state */}
        <div className={`relative ${imageHeight} bg-gray-100 overflow-hidden`}>
          {(imageUrl && inView) ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-transform hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
                quality={75}
                placeholder="blur"
                blurDataURL={FALLBACK_IMAGE_DATA}
                itemProp="image"
              />
            </>
          ) : (
            // Placeholder when image is unavailable or not yet in view
            <div className="flex flex-col items-center justify-center h-full bg-gray-100">
              {imageError ? (
                <>
                  <FiImage size={32} className="text-gray-400 mb-2" aria-hidden="true" />
                  <span className="text-xs text-gray-400">No image available</span>
                </>
              ) : (
                PropertyIcon
              )}
            </div>
          )}
          {/* Price and Status Overlays */}
          <div
            className="absolute bottom-0 left-0 bg-blue-600 text-white px-3 py-1 font-medium"
            itemProp="price"
          >
            {formattedPrice}
          </div>
          {status && (
            <div
              className={`absolute top-2 right-2 ${
                STATUS_STYLES[status] || "bg-gray-500"
              } text-white px-2 py-1 rounded text-sm`}
              itemProp="availability"
            >
              {STATUS_TEXT[status] || "Unknown"}
            </div>
          )}
          
          {/* "New" badge for recent listings */}
          {isRecentListing && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <FiClock size={12} className="mr-1" />
              New
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4" itemProp="description">
          <h3
            className="font-medium text-lg text-gray-900 line-clamp-1"
            itemProp="name"
          >
            {title}
          </h3>
          <div className="flex items-center text-gray-600 text-sm mb-3 mt-2">
            <FiMapPin
              size={14}
              className="mr-1 flex-shrink-0"
              aria-hidden="true"
            />
            <span className="truncate" itemProp="address">
              {locationText}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 border-t pt-3">
            {bedrooms > 0 && (
              <div
                className="flex items-center"
                itemProp="numberOfBedrooms"
              >
                <FiBed className="mr-1" aria-hidden="true" />
                <span>
                  {bedrooms} {bedrooms === 1 ? "bed" : "beds"}
                </span>
              </div>
            )}
            {bathrooms > 0 && (
              <div
                className="flex items-center"
                itemProp="numberOfBathroomsTotal"
              >
                <FiBath className="mr-1" aria-hidden="true" />
                <span>
                  {bathrooms} {bathrooms === 1 ? "bath" : "baths"}
                </span>
              </div>
            )}
            {squareFeet > 0 && (
              <div className="flex items-center" itemProp="floorSize">
                <FiSquare className="mr-1" aria-hidden="true" />
                <span>{squareFeet.toLocaleString()} ft²</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
});

// Add displayName for better debugging
ListingCard.displayName = 'ListingCard';

// Add proper TypeScript-like prop validation
ListingCard.propTypes = {
  listing: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    price: PropTypes.number,
    location: PropTypes.shape({
      city: PropTypes.string,
      state: PropTypes.string,
      coordinates: PropTypes.arrayOf(PropTypes.number),
    }),
    bedrooms: PropTypes.number,
    bathrooms: PropTypes.number,
    squareFeet: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    status: PropTypes.oneOf(Object.keys(STATUS_TEXT)),
    description: PropTypes.string,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    propertyType: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
  preloadImages: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'default', 'large']),
};

// Add default props
ListingCard.defaultProps = {
  onClick: undefined,
  preloadImages: false,
  size: 'default',
};

export default ListingCard;