import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "../../components/layout/MainLayout";
import Button from "../../components/ui/Button";
import {
  FiShare2,
  FiHeart,
  FiHome,
  FiMapPin,
  FiBed,
  FiBath,
  FiCalendar,
} from "react-icons/fi";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { formatDate } from "../../lib/date-utils";
import toast from "react-hot-toast";
// Import ListingDetail component properly here - at the top with other imports
import ListingDetail from "../../components/listings/ListingDetail";

// Dynamically import heavy components
const ListingMap = dynamic(
  () => import("../../components/listings/ListingMap"),
  {
    loading: () => (
      <div className="h-60 bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="medium" />
      </div>
    ),
    ssr: false,
  }
);

const SimilarListings = dynamic(
  () => import("../../components/listings/SimilarListings"),
  {
    loading: () => (
      <div className="h-40 bg-gray-50">Loading similar listings...</div>
    ),
    ssr: false,
  }
);

// Remove the duplicate import that was causing the error
// import ListingDetailComponent from "../../components/listings/ListingDetail";

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch listing data
  useEffect(() => {
    if (!id) return;

    async function fetchListing() {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching listing data for ID: ${id}`);

        // Add retries and timeout for robustness
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`/api/listings/${id}`, {
          headers: {
            "Cache-Control": "no-cache",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Listing not found");
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const data = await response.json();

        if (data.success && data.listing) {
          console.log("Fetched listing data:", data.listing); // Log the listing data
          setListing(data.listing);
        } else {
          throw new Error(data.message || "Failed to load listing");
        }
      } catch (err) {
        console.error("Error fetching listing:", err);

        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else {
          setError(err.message || "Failed to load listing");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  // Handle contact agent action
  const handleContactAgent = () => {
    toast.success("Contact request sent to agent");
    // Implement actual contact functionality
  };

  // Handle toggle favorite
  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(
      isFavorited ? "Removed from favorites" : "Added to favorites"
    );
    // Implement actual favorite toggle API call
  };

  // Handle loading state
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage
            title="Couldn't load this listing"
            message={error}
            actionText="Go back to listings"
            actionHref="/listings"
          />
        </div>
      </Layout>
    );
  }

  // Handle no listing (should not happen with proper loading/error states)
  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage
            title="Listing Not Found"
            message="The listing you're looking for doesn't exist or has been removed."
            actionText="Browse Properties"
            actionHref="/listings"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{listing?.title || "Listing"} | TopDial</title>
        <meta
          name="description"
          content={
            listing?.description?.substring(0, 160) ||
            `Property listing on TopDial`
          }
        />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Use the ListingDetail component properly */}
        {listing && (
          <ListingDetail
            listing={listing}
            onContactAgent={handleContactAgent}
            onToggleFavorite={handleToggleFavorite}
            isFavorited={isFavorited}
          />
        )}

        {/* Similar listings section */}
        {listing && (
          <div className="mt-16">
            <SimilarListings
              currentListingId={listing._id}
              propertyType={listing.propertyType}
              city={listing.city}
              state={listing.state}
              price={listing.price}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
