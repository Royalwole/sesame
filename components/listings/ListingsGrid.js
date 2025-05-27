import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
// Import the ListingCard component without specifying the extension
import ListingCard from "./ListingCard";
import { FiAlertCircle, FiLoader } from "react-icons/fi";

/**
 * ListingsGrid - Responsive grid for displaying property listings
 * with enhanced error handling and empty states
 */
const ListingsGrid = ({
  listings = [],
  loading = false,
  error = null,
  onListingClick,
  emptyMessage = "No properties found matching your criteria.",
  gridClassName = "",
  loadingMessage = "Loading properties...",
  preloadImages = true,
}) => {
  const [renderedListings, setRenderedListings] = useState([]);
  const [hasError, setHasError] = useState(false);

  // Sanitize and validate listings
  useEffect(() => {
    // Skip processing during loading state
    if (loading) return;

    try {
      // Filter out invalid listings and sanitize data
      const validListings = Array.isArray(listings)
        ? listings.filter(
            (listing) => listing && typeof listing === "object" && listing._id
          )
        : [];

      if (validListings.length !== listings?.length) {
        console.warn(
          `Filtered out ${(listings?.length || 0) - validListings.length} invalid listings`
        );
      }

      setRenderedListings(validListings);
      setHasError(false);
    } catch (err) {
      console.error("Error processing listings data:", err);
      setRenderedListings([]);
      setHasError(true);
    }
  }, [listings, loading]);

  // Optimize preloading by only preloading first 6 listings' images
  const preloadConfig = useMemo(() => {
    if (!preloadImages || !Array.isArray(listings)) return {};

    // Create a map where only the first 6 listings get image preloading
    return listings.reduce((acc, listing, index) => {
      if (listing && listing._id) {
        acc[listing._id] = index < 6;
      }
      return acc;
    }, {});
  }, [listings, preloadImages]);

  // Add this helper function for consistent price formatting
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Determine what to render based on loading/error/empty states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center my-12 py-8 text-gray-500">
        <FiLoader size={32} className="mb-4 animate-spin text-blue-500" />
        <p>{loadingMessage}</p>
      </div>
    );
  }

  if (hasError || error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4 text-red-700 flex items-center">
        <FiAlertCircle className="mr-2 flex-shrink-0" size={20} />
        <div>
          <p className="font-medium">Unable to load listings</p>
          <p className="text-sm mt-1">
            {error?.message ||
              "There was a problem fetching the listings. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!renderedListings.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-4 text-center text-gray-600">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${gridClassName}`}
      data-testid="listings-grid"
    >
      {renderedListings.map((listing) => (
        <ListingCard
          key={`listing-${listing._id}`}
          listing={listing}
          onClick={onListingClick}
          preloadImages={(preloadConfig && preloadConfig[listing._id]) || false}
        />
      ))}
    </div>
  );
};

ListingsGrid.propTypes = {
  listings: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.object,
  onListingClick: PropTypes.func,
  emptyMessage: PropTypes.node,
  gridClassName: PropTypes.string,
  loadingMessage: PropTypes.node,
  preloadImages: PropTypes.bool,
};

export default ListingsGrid;
