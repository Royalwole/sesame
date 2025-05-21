import { useState, useEffect, useCallback, useRef } from "react";
import { FiArrowRight, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";
import ListingMap from "./ListingMap";
import { toast } from "react-hot-toast"; // Assuming toast is available in the project
import { fetchWithTimeout } from "../../lib/fetch-with-timeout";

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
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 10000; // 10 second timeout

  const fetchSimilarListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const retryOptions = { maxRetries: 2, baseDelay: 1000 };
    let attempt = 0;

    while (attempt <= retryOptions.maxRetries) {
      try {
        // Calculate price range if price is provided
        let minPrice, maxPrice;
        if (price) {
          minPrice = Math.floor(price * (1 - priceRange));
          maxPrice = Math.ceil(price * (1 + priceRange));
        }

        // Build query params
        const params = new URLSearchParams({
          id: currentListingId,
          location: city,
          propertyType: propertyType,
          limit: limit,
        });

        const response = await fetchWithTimeout(
          `/api/listings/similar?${params}`,
          {
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
          TIMEOUT_MS
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setListings(data.listings || []);
        setLoading(false);
        return; // Success - exit retry loop
      } catch (err) {
        attempt++;
        console.warn(`Similar listings fetch attempt ${attempt} failed:`, err);

        if (attempt > retryOptions.maxRetries) {
          setError("Unable to load similar listings");
          setListings([]);
          setLoading(false);
          return;
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, retryOptions.baseDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }, [currentListingId, propertyType, city, price, priceRange, limit]);

  useEffect(() => {
    fetchSimilarListings();

    return () => {
      // Clean up on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [fetchSimilarListings]);

  // Handle manual retry
  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      toast.error("Too many retry attempts. Please try again later.");
      return;
    }
    setRetryCount((prev) => prev + 1);
    toast.loading("Retrying...");
  };

  // Show loading state
  if (loading && listings.length === 0) {
    return (
      <div className={`${className} py-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Similar Properties</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-60 bg-gray-50 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Show nothing if there are no similar listings
  if (!loading && listings.length === 0 && !error) {
    return null;
  }

  // Error state with retry button
  if (error) {
    return (
      <div className={`${className} py-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Similar Properties</h2>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-500 mb-3">{error}</p>
          <button
            onClick={handleRetry}
            disabled={retryCount >= MAX_RETRIES}
            className={`inline-flex items-center ${
              retryCount >= MAX_RETRIES
                ? "text-gray-400 cursor-not-allowed"
                : "text-wine hover:text-wine/80"
            } text-sm font-medium`}
            aria-label="Retry loading similar listings"
          >
            <FiRefreshCw
              className={`mr-1 ${
                retryCount > 0 && retryCount < MAX_RETRIES ? "animate-spin" : ""
              }`}
            />
            {retryCount >= MAX_RETRIES ? "Too many attempts" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} py-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Similar Properties</h2>
        <Link
          href={`/listings?propertyType=${encodeURIComponent(
            propertyType || ""
          )}&city=${encodeURIComponent(city || "")}&state=${encodeURIComponent(
            state || ""
          )}`}
          className="text-wine hover:text-wine/80 flex items-center text-sm font-medium"
          aria-label="View more similar properties"
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
