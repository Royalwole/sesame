import React, { memo, useState, useCallback } from "react";
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
  FiClock
} from "react-icons/fi";

// Utility to construct Vercel Blob image URLs with optimizations
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // Vercel Blob base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.trim();
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_BLOB_BASE_URL is not configured');
    return null;
  }

  try {
    // Ensure proper encoding of the path
    const encodedPath = encodeURIComponent(imagePath.trim());
    const params = new URLSearchParams({
      w: '800',
      h: '600',
      q: '80',
      f: 'webp'
    });
    
    return `${baseUrl}/${encodedPath}?${params.toString()}`;
  } catch (err) {
    console.error('Error constructing image URL:', err);
    return null;
  }
};

const ListingCard = memo(function ListingCard({ listing, onClick }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  // Safety check for invalid listing with better error messaging
  if (!listing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-gray-500 text-center" role="alert">
        <FiHome size={24} className="mx-auto mb-2 text-gray-400" />
        <p>Property listing unavailable</p>
      </div>
    );
  }

  if (!listing._id) {
    console.error('Listing missing required ID:', listing);
    return null;
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
  } = listing;

  // Memoize click handler
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick({ listingId: _id, title });
    }
  }, [_id, title, onClick]);

  // Memoize formatted values
  const formattedPrice = React.useMemo(() => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price), [price]);

  const locationText = React.useMemo(() => 
    location?.city && location?.state
      ? `${location.city}, ${location.state}`
      : location?.city || location?.state || "Unknown Location",
    [location?.city, location?.state]
  );

  // Get primary image URL from Vercel Blob
  const imageUrl = images.length > 0 && !imageError ? getImageUrl(images[0]) : null;

  // Status badge styles and text
  const statusStyles = {
    for_sale: "bg-green-500",
    sold: "bg-red-500",
    under_contract: "bg-yellow-500",
  };
  const statusText = {
    for_sale: "For Sale",
    sold: "Sold",
    under_contract: "Under Contract",
  };

  // Handle successful image load
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Enhanced error handling for images
  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    console.error(`Failed to load image for listing: ${_id}`);
  };

  return (
    <Link href={`/listings/${_id}`} passHref>
      <article
        ref={ref}
        className="block h-full bg-white rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500"
        itemScope
        itemType="http://schema.org/Residence"
        onClick={handleClick}
        role="link"
        tabIndex={0}
        aria-label={`View details for ${title} in ${locationText}`}
      >
        {/* Image Section with loading state */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {imageUrl && inView ? (
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
                quality={80}
                placeholder="blur"
                blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23f1f5f9'/%3E%3C/svg%3E"
                itemProp="image"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <FiHome size={48} className="text-gray-400" aria-hidden="true" />
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
                statusStyles[status] || "bg-gray-500"
              } text-white px-2 py-1 rounded text-sm`}
              itemProp="availability"
            >
              {statusText[status] || "Unknown"}
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

// Cache status constants outside component to prevent re-creation
const STATUS_STYLES = Object.freeze({
  for_sale: "bg-green-500",
  sold: "bg-red-500",
  under_contract: "bg-yellow-500",
});

const STATUS_TEXT = Object.freeze({
  for_sale: "For Sale",
  sold: "Sold",
  under_contract: "Under Contract",
});

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
  }).isRequired,
  onClick: PropTypes.func,
};

// Add default props
ListingCard.defaultProps = {
  onClick: undefined,
};

export default ListingCard;