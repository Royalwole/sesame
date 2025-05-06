import React, { memo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { useListings } from "../../contexts/ListingsContext";
import ListingCard from "./ListingCard";
import ErrorBoundary from "../ErrorBoundary";

// Memoize ListingCard to prevent unnecessary re-renders
const MemoizedListingCard = memo(ListingCard);

// Wrap individual listing cards in error boundary to prevent cascade failures
const ListingCardWithErrorBoundary = ({ listing }) => (
  <ErrorBoundary
    fallback={
      <div className="bg-red-50 rounded-lg p-4 text-red-700">
        Error displaying this listing
      </div>
    }
  >
    <MemoizedListingCard listing={listing} />
  </ErrorBoundary>
);

export default memo(function ListingsGrid({
  listings: propListings = [],
  loading: propLoading,
  error: propError,
  onRefetch,
}) {
  const router = useRouter();
  const mounted = useRef(true);

  // Get listings from context if available
  const {
    listings: contextListings,
    loading: contextLoading,
    error: contextError,
    refreshListings,
  } = useListings?.() || {};

  // Determine if using context based on presence of refreshListings
  const hasContext = !!refreshListings;

  // Use context values if available, otherwise fall back to props
  const listings = hasContext ? contextListings : propListings;
  const loading = hasContext ? contextLoading : propLoading;
  const error = hasContext ? contextError : propError;

  // Safe array handling
  const safeListings = Array.isArray(listings) ? listings : [];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Handle retry action
  const handleRetry = () => {
    if (hasContext && refreshListings) {
      refreshListings();
    } else if (onRefetch) {
      onRefetch();
    } else {
      router.reload();
    }
  };

  // Fix loading state with better skeleton UI
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="status"
        aria-busy="true"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
            aria-hidden="true"
          >
            <div className="h-48 bg-gray-200" />
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
        <div className="sr-only">Loading listings...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        role="alert"
        className="bg-red-50 border border-red-100 rounded-lg p-4"
      >
        <div className="flex items-center text-red-600 mb-2">
          <FiAlertCircle className="mr-2" aria-hidden="true" />
          <h3 className="font-medium">Error loading listings</h3>
        </div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={handleRetry}
          className="mt-3 text-red-700 hover:text-red-800"
        >
          <FiRefreshCw className="inline mr-2" /> Retry
        </button>
      </div>
    );
  }

  // Show empty state
  if (!safeListings.length) {
    return (
      <div
        role="status"
        className="text-center py-12 bg-white rounded-lg shadow-sm"
      >
        <p className="text-gray-500 mb-4">No listings found</p>
        <button
          onClick={handleRetry}
          className="text-blue-600 hover:text-blue-700"
        >
          Refresh listings
        </button>
      </div>
    );
  }

  // Display listings grid
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="feed"
      aria-label="Property listings"
    >
      {safeListings.map((listing) => (
        <article key={listing._id}>
          <ListingCardWithErrorBoundary listing={listing} />
        </article>
      ))}
    </div>
  );
});
