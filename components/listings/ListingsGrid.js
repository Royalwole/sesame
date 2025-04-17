import React, { memo, useEffect, useState } from "react";
import ListingCard from "./ListingCard";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { useRouter } from "next/router";
import { useListings } from "../../contexts/ListingsContext";
import Loader from "../utils/Loader";

// Use dynamic imports for better code splitting
// Removed unused import ErrorMessage

// Memoize the component to prevent unnecessary re-renders
const MemoizedListingCard = memo(ListingCard);

export default function ListingsGrid({
  listings: propListings = [],
  loading: propLoading,
  error: propError,
}) {
  const router = useRouter();

  // Access context (which will be available when wrapped in provider)
  const contextValue = React.useContext(React.createContext(null));
  const hasContext = contextValue !== null;

  // Get listings from context if available, otherwise use props
  const {
    listings: contextListings,
    loading: contextLoading,
    error: contextError,
    refreshListings,
  } = useListings?.() || {};

  // Use context values if available, otherwise fall back to props
  // This ensures component works both standalone and within context
  const listings = hasContext ? contextListings : propListings;
  const loading = hasContext ? contextLoading : propLoading;
  const error = hasContext ? contextError : propError;

  // Use hydration-safe state to prevent mismatches between server and client
  const [isClient, setIsClient] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Safe array handling
  const safeListings = Array.isArray(listings) ? listings : [];

  // Mark as client-side rendered after mount
  useEffect(() => {
    setIsClient(true);

    // Use a short timeout to ensure the component is fully hydrated
    // before any visual changes occur
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Only log when client and when values change
  useEffect(() => {
    if (isClient) {
      console.log("ListingsGrid client render:", {
        loading,
        error,
        listingsCount: safeListings.length,
        hydrated,
      });
    }
  }, [isClient, loading, error, safeListings.length, hydrated]);

  // If not hydrated yet on client, show simple placeholder to avoid flicker
  if (!hydrated && typeof window !== "undefined") {
    return (
      <div className="min-h-[300px] w-full bg-gray-50 animate-pulse rounded-lg">
        {/* Invisible placeholder to maintain layout during hydration */}
      </div>
    );
  }

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
          onClick={() => (hasContext ? refreshListings?.() : router.reload())}
          className="mt-3 flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200"
        >
          <FiRefreshCw className="mr-2" /> Retry
        </button>
      </div>
    );
  }

  // No listings found - better empty state
  if (!safeListings.length) {
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

  // Display listings - with key safety to prevent React warnings
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      data-testid="listing-card"
    >
      {safeListings.map((listing) => (
        <MemoizedListingCard
          key={
            listing._id ||
            `listing-${Math.random().toString(36).substring(2, 9)}`
          }
          listing={listing}
        />
      ))}
    </div>
  );
}
