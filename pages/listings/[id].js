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
import ListingDetail from "../../components/listings/ListingDetail";

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

export default function ListingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchListing() {
      setLoading(true);
      setError(null);

      try {
        // Log the listing ID being fetched
        console.log(`Fetching listing data for ID: ${id}`);

        // Validate the listing ID format (MongoDB ObjectID is 24-character hex string)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        if (!isValidObjectId) {
          console.error(`Invalid listing ID format: ${id}`);
          setError(
            "Invalid listing ID format. Please check the URL and try again."
          );
          setLoading(false);
          return;
        }

        const MAX_RETRIES = 2;
        let retries = 0;
        let success = false;

        while (!success && retries <= MAX_RETRIES) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          try {
            // Add request timestamp for debugging
            const requestStartTime = new Date().getTime();
            console.log(`API request started at: ${new Date().toISOString()}`);

            const response = await fetch(`/api/listings/${id}`, {
              headers: {
                "Cache-Control": "no-cache",
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Log response time
            const requestEndTime = new Date().getTime();
            console.log(
              `API response received after ${requestEndTime - requestStartTime}ms`
            );

            if (!response.ok) {
              if (response.status === 404) {
                throw new Error(
                  "Listing not found. It may have been removed or the ID is incorrect."
                );
              } else {
                throw new Error(
                  `Server error (${response.status}): ${response.statusText}`
                );
              }
            }

            const data = await response.json();

            if (data.success && data.listing) {
              console.log("Fetched listing data:", data.listing);
              setListing(data.listing);
              success = true;
            } else {
              throw new Error(data.message || "Failed to load listing data");
            }

            break;
          } catch (err) {
            if (
              err.name === "AbortError" ||
              (err.message && !err.message.includes("not found"))
            ) {
              retries++;
              if (retries <= MAX_RETRIES) {
                console.log(`Retry attempt ${retries} for listing ${id}`);
              } else {
                throw err;
              }
            } else {
              throw err;
            }
          }
        }
      } catch (err) {
        console.error("Error fetching listing:", err);

        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else if (err.message && err.message.includes("not found")) {
          setError(
            `Listing not found. It may have been removed or the URL is incorrect.`
          );
          console.error(
            `Listing not found details - ID: ${id}, Format valid: ${/^[0-9a-fA-F]{24}$/.test(
              id
            )}`
          );
        } else {
          setError(err.message || "Failed to load listing");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  const handleContactAgent = () => {
    toast.success("Contact request sent to agent");
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(
      isFavorited ? "Removed from favorites" : "Added to favorites"
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

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
        {listing && (
          <ListingDetail
            listing={listing}
            onContactAgent={handleContactAgent}
            onToggleFavorite={handleToggleFavorite}
            isFavorited={isFavorited}
          />
        )}

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
