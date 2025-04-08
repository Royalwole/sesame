import React, { memo } from "react";
import ListingCard from "./ListingCard";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import dynamic from "next/dynamic";

// Use dynamic imports for better code splitting
const ErrorMessage = dynamic(() => import("../utils/ErrorMessage"));

// Memoize the component to prevent unnecessary re-renders
const MemoizedListingCard = memo(ListingCard);

export default function ListingsGrid({ listings = [], loading, error }) {
  console.log("ListingsGrid render:", {
    loading,
    error,
    listingsCount: listings?.length,
  });

  // Fix loading state with better skeleton UI
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="listings-loading"
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-100 rounded-lg p-4"
        data-testid="listings-error"
      >
        <div className="flex items-center text-red-600 mb-2">
          <FiAlertCircle className="mr-2" size={20} />
          <h3 className="font-medium">Error loading listings</h3>
        </div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200"
        >
          <FiRefreshCw className="mr-2" /> Refresh Page
        </button>
      </div>
    );
  }

  // No listings found - better empty state
  if (!Array.isArray(listings) || listings.length === 0) {
    return (
      <div
        className="bg-white shadow-sm rounded-lg p-8 text-center"
        data-testid="listings-empty"
      >
        <h3 className="text-gray-800 font-medium text-lg mb-2">
          No listings found
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or check back later for new properties.
        </p>
      </div>
    );
  }

  // Display listings
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      data-testid="listing-card"
    >
      {listings.map((listing) => (
        <MemoizedListingCard
          key={listing._id || `listing-${Math.random()}`}
          listing={listing}
        />
      ))}
    </div>
  );
}
