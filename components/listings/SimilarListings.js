import { useState, useEffect } from "react";
import { FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import ListingMap from "./ListingMap";

/**
 * Display similar property listings based on the current listing
 */
export default function SimilarListings({
  currentListingId,
  propertyType,
  city,
  state,
  priceRange = 0.3, // 30% above or below current price
  price,
  limit = 3,
  className = "",
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSimilarListings() {
      if (!currentListingId) return;

      setLoading(true);
      setError(null);

      try {
        // Calculate price range if price is provided
        let minPrice, maxPrice;
        if (price) {
          minPrice = Math.floor(price * (1 - priceRange));
          maxPrice = Math.ceil(price * (1 + priceRange));
        }

        // Build query params
        const params = new URLSearchParams();
        params.append("limit", String(limit));
        params.append("excludeId", currentListingId);

        if (propertyType) params.append("propertyType", propertyType);
        if (city) params.append("city", city);
        if (state) params.append("state", state);
        if (minPrice) params.append("minPrice", minPrice.toString());
        if (maxPrice) params.append("maxPrice", maxPrice.toString());

        // Fetch similar listings
        const response = await fetch(
          `/api/listings/similar?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(
            `Error fetching similar listings (${response.status})`
          );
        }

        const data = await response.json();

        if (data.success) {
          setListings(data.listings || []);
        } else {
          throw new Error(data.message || "Failed to load similar listings");
        }
      } catch (error) {
        console.error("Error fetching similar listings:", error);
        setError(error.message || "Failed to load similar listings");
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarListings();
  }, [currentListingId, propertyType, city, state, price, priceRange, limit]);

  // Show nothing while loading
  if (loading && listings.length === 0) {
    return (
      <div className={`${className} py-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Similar Properties</h2>
        </div>
        <div className="h-60 bg-gray-50 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  // Show nothing if there are no similar listings
  if (!loading && listings.length === 0) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} py-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Similar Properties</h2>
        </div>
        <p className="text-gray-500">Couldn't load similar listings.</p>
      </div>
    );
  }

  return (
    <div className={`${className} py-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Similar Properties</h2>
        <Link
          href={`/listings?propertyType=${propertyType || ""}&city=${
            city || ""
          }&state=${state || ""}`}
          className="text-wine hover:text-wine/80 flex items-center text-sm font-medium"
        >
          View More <FiArrowRight className="ml-1" />
        </Link>
      </div>

      <ListingMap
        listings={listings}
        emptyMessage="No similar properties found"
        showLocation={true}
      />
    </div>
  );
}
