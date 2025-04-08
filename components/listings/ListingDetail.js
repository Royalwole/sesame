import React, { useState } from "react";
import { FiHeart, FiShare2, FiPhone, FiCalendar } from "react-icons/fi";
import Button from "../ui/Button";
import { formatDate } from "../../lib/date-utils";

/**
 * Detailed view of a single property listing
 */
export default function ListingDetail({
  listing,
  onContactAgent,
  onToggleFavorite,
  isFavorited = false,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!listing) {
    return <div>No listing data available</div>;
  }

  const {
    title,
    description,
    price,
    address,
    city,
    state,
    bedrooms,
    bathrooms,
    propertyType,
    listingType,
    features,
    images,
    createdAt,
    size,
    sizeUnit = "sqft",
    createdBy,
  } = listing;

  // Format price with commas
  const formattedPrice = price?.toLocaleString() || "0";

  // Handle image navigation
  const handleNextImage = () => {
    if (images?.length > 0) {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (images?.length > 0) {
      setActiveImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="listing-detail">
      {/* Main image gallery */}
      <div className="image-gallery mb-6">
        {images && images.length > 0 ? (
          <div className="relative">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={images[activeImageIndex].url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image navigation controls */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 rounded-full px-3 py-1 text-white text-sm">
                {activeImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">No images available</p>
          </div>
        )}
      </div>

      {/* Property info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>

          <p className="text-gray-600 mb-4">
            {address}, {city}, {state}
          </p>

          <div className="flex flex-wrap gap-4 mb-6">
            {bedrooms !== undefined && (
              <div className="bg-gray-100 px-4 py-2 rounded">
                <span className="font-medium">{bedrooms}</span> Beds
              </div>
            )}

            {bathrooms !== undefined && (
              <div className="bg-gray-100 px-4 py-2 rounded">
                <span className="font-medium">{bathrooms}</span> Baths
              </div>
            )}

            {propertyType && (
              <div className="bg-gray-100 px-4 py-2 rounded">
                {propertyType}
              </div>
            )}
          </div>

          {/* Property Stats */}
          <div className="flex flex-wrap justify-between mb-6 border p-4 rounded-lg">
            <div className="border-r border-gray-200 pr-4">
              <p className="text-gray-500">Bedrooms</p>
              <p className="text-xl font-semibold">{bedrooms || "N/A"}</p>
            </div>
            <div className="border-r border-gray-200 pr-4">
              <p className="text-gray-500">Bathrooms</p>
              <p className="text-xl font-semibold">{bathrooms || "N/A"}</p>
            </div>
            <div className="border-r border-gray-200 pr-4">
              <p className="text-gray-500">Size</p>
              <p className="text-xl font-semibold">
                {size ? `${size} ${sizeUnit}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="text-xl font-semibold capitalize">{propertyType}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-line">{description}</p>
          </div>

          {/* Features */}
          {features && features.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Features</h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-4 h-4 text-wine mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Agent Info */}
          {createdBy && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Contact Agent
              </h2>
              <div className="flex items-center">
                <div className="mr-4 relative w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-500">
                    {createdBy.firstName?.[0] || "A"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">
                    {createdBy.firstName} {createdBy.lastName}
                  </h3>
                  <p className="text-gray-600">{createdBy.email}</p>
                  <p className="text-gray-600">
                    {createdBy.phone || "No phone provided"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  onClick={() => onContactAgent && onContactAgent()}
                  variant="primary"
                >
                  Contact Agent
                </Button>
                <Button
                  onClick={() => onToggleFavorite && onToggleFavorite()}
                  variant={isFavorited ? "danger" : "outline"}
                >
                  {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-gray-500 text-sm mt-6">
            Listed on {formatDate(createdAt)}
          </p>
        </div>

        {/* Price sidebar - right column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
            <h2 className="text-lg font-semibold mb-2">
              {listingType === "rent" ? "Rent" : "Price"}
            </h2>
            <p className="text-3xl font-bold text-wine mb-4">
              ₦{formattedPrice}
              {listingType === "rent" && (
                <span className="text-lg">/month</span>
              )}
            </p>

            <div className="space-y-3">
              <Button
                fullWidth
                onClick={() => onContactAgent && onContactAgent()}
              >
                Contact Agent
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() => onToggleFavorite && onToggleFavorite()}
              >
                <FiHeart className="mr-2" />
                {isFavorited ? "Saved" : "Save"}
              </Button>
              <Button fullWidth variant="outline">
                <FiShare2 className="mr-2" /> Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
