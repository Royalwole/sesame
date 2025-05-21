// filepath: c:\Users\HomePC\Desktop\topdial\components\listings\ListingMap.js
import React from "react";
import Link from "next/link";
// Standard import for icons
import { FiHome, FiMapPin, FiBed, FiDroplet, FiClock } from "react-icons/fi";

/**
 * Functional component that maps over a list of listings
 * @param {Array} listings - Array of listing objects to map over
 * @param {Object} options - Display options
 * @returns {JSX.Element} - Rendered list of listings
 */
export default function ListingMap({
  listings = [],
  emptyMessage = "No listings found",
  className = "",
  showLocation = true,
  showPrice = true,
  compact = false,
}) {
  // If no listings, show empty message
  if (!listings || listings.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <FiHome className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`listing-map ${className}`}>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <li
            key={listing._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link href={`/listings/${listing._id}`} className="block">
              {/* Listing image */}
              <div className="relative aspect-[4/3] bg-gray-200">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={
                      typeof listing.images[0] === "string"
                        ? listing.images[0]
                        : listing.images[0].url
                    }
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiHome className="text-gray-400 text-4xl" />
                  </div>
                )}{" "}
                {/* Status badge */}
                {listing.status && (
                  <div
                    className={`absolute top-2 right-2 ${
                      listing.status === "published"
                        ? "bg-green-500"
                        : listing.status === "pending"
                          ? "bg-orange-500"
                          : listing.status === "sold"
                            ? "bg-red-500"
                            : listing.status === "under_contract"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                    } text-white px-2 py-1 rounded text-sm`}
                  >
                    {listing.status === "published"
                      ? "For Sale"
                      : listing.status === "pending"
                        ? "Pending"
                        : listing.status === "sold"
                          ? "Sold"
                          : listing.status === "under_contract"
                            ? "Under Contract"
                            : listing.status}
                  </div>
                )}
                {/* "New" badge for recent listings */}
                {listing.createdAt &&
                  new Date() - new Date(listing.createdAt) <
                    7 * 24 * 60 * 60 * 1000 && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <FiClock size={12} className="mr-1" />
                      New
                    </div>
                  )}
                {/* Price overlay */}
                {showPrice && (
                  <div className="absolute bottom-0 left-0 bg-blue-600 text-white px-3 py-1 font-medium">
                    ₦{listing.price?.toLocaleString() || 0}
                    {listing.listingType === "rent" && (
                      <span className="text-sm font-normal text-white ml-1">
                        /month
                      </span>
                    )}
                  </div>
                )}{" "}
              </div>
              {/* Listing details */}
              <div className="p-4">
                <h3 className="font-medium text-lg text-gray-900 line-clamp-1">
                  {listing.title}
                </h3>
                {/* Location */}
                {showLocation && listing.address && (
                  <div className="flex items-center text-gray-600 text-sm mb-3 mt-2">
                    <FiMapPin
                      className="mr-1 flex-shrink-0"
                      size={14}
                      aria-hidden="true"
                    />
                    <span className="truncate">{listing.address}</span>
                  </div>
                )}

                {/* Features */}
                {!compact && (
                  <div className="flex justify-between text-sm text-gray-500 border-t pt-3">
                    {listing.bedrooms !== undefined && listing.bedrooms > 0 && (
                      <div className="flex items-center">
                        <FiBed className="mr-1" aria-hidden="true" />
                        <span>
                          {listing.bedrooms}{" "}
                          {listing.bedrooms === 1 ? "bed" : "beds"}
                        </span>
                      </div>
                    )}
                    {listing.bathrooms !== undefined &&
                      listing.bathrooms > 0 && (
                        <div className="flex items-center">
                          <FiDroplet className="mr-1" aria-hidden="true" />
                          <span>
                            {listing.bathrooms}{" "}
                            {listing.bathrooms === 1 ? "bath" : "baths"}
                          </span>
                        </div>
                      )}{" "}
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
