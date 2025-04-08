import React, { useState } from "react";
import Link from "next/link";
import { FiBed, FiBath, FiSquare, FiMapPin, FiHome } from "react-icons/fi";
import Image from "next/image";
import { useInView } from "react-intersection-observer"; // Add for lazy loading

export default function ListingCard({ listing }) {
  const [imageError, setImageError] = useState(false);
  
  // Add intersection observer for lazy loading
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // Load images 200px before they come into view
  });
  
  // Safety check for null or undefined listing
  if (!listing) return null;

  // Extract values with fallbacks to prevent rendering errors
  const {
    _id = "",
    title = "Untitled Property",
    price = 0,
    location = {},
    bedrooms = 0,
    bathrooms = 0,
    squareFeet = 0,
    images = [],
  } = listing;

  // Format currency with proper locale
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

  // Format location with proper fallbacks
  const locationText = location?.city && location?.state
    ? `${location.city}, ${location.state}`
    : location?.city || location?.state || "Location unavailable";

  // Get image URL with fallback and CDN optimization
  const imageUrl = images && images.length > 0 && !imageError ? optimizeImageUrl(images[0]) : null;

  // Function to optimize image URLs for CDN
  function optimizeImageUrl(url) {
    if (!url) return null;
    
    // If it's already a CDN URL, return it
    if (url.includes('imagedelivery.net') || url.includes('topdial-cdn')) {
      return url;
    }
    
    // If it's a local URL, keep it as is
    if (url.startsWith('/')) {
      return url;
    }
    
    // For demo purposes: if this was a real app, we would transform the URL to a CDN format
    // Example: return `https://topdial-cdn.azureedge.net/properties/${encodeURIComponent(url)}`;
    return url;
  }

  return (
    <Link href={`/listings/${_id}`} className="block h-full">
      <div ref={ref} className="bg-white rounded-lg shadow-sm overflow-hidden h-full transition-shadow hover:shadow-md">
        {/* Image with proper error handling, lazy loading and WebP optimization */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {imageUrl && inView ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy" 
              quality={80} // Optimize quality for balance of size and appearance
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23f1f5f9'/%3E%3C/svg%3E"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <FiHome size={48} className="text-gray-400" />
            </div>
          )}
          
          {/* Price tag overlay */}
          <div className="absolute bottom-0 left-0 bg-blue-600 text-white px-3 py-1 font-medium">
            {formattedPrice}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-lg text-gray-900 line-clamp-1">{title}</h3>

          <div className="flex items-center text-gray-600 text-sm mb-3 mt-2">
            <FiMapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-500 border-t pt-3">
            {bedrooms > 0 && (
              <div className="flex items-center">
                <FiBed className="mr-1" />
                <span>
                  {bedrooms} {bedrooms === 1 ? "bed" : "beds"}
                </span>
              </div>
            )}

            {bathrooms > 0 && (
              <div className="flex items-center">
                <FiBath className="mr-1" />
                <span>
                  {bathrooms} {bathrooms === 1 ? "bath" : "baths"}
                </span>
              </div>
            )}

            {squareFeet > 0 && (
              <div className="flex items-center">
                <FiSquare className="mr-1" />
                <span>{squareFeet.toLocaleString()} ft²</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
