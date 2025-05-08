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
import { getListingById } from "../../lib/listing-api";

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
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);

  useEffect(() => {
    // Don't fetch until we have an ID from the router
    if (!id) return;

    let isMounted = true; // Track if component is still mounted

    async function fetchListing() {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching listing data for ID: ${id}`);

        // Use our improved getListingById utility
        const result = await getListingById(id);

        // Only update state if component is still mounted
        if (!isMounted) return;

        if (result.success && result.listing) {
          console.log("Listing fetched successfully:", result.listing.title);
          setListing(result.listing);

          // Store diagnostic info for debugging
          setDiagnosticInfo({
            attempts: result.diagnostics?.attempts || 1,
            duration: result.diagnostics?.duration || 0,
            strategy: result.diagnostics?.strategy || "unknown",
            idMatch: result.idMatch,
          });

          // Preload images if available
          if (result.listing.images && result.listing.images.length > 0) {
            result.listing.images.forEach((image) => {
              if (image && image.url) {
                const img = new Image();
                img.src = image.url;
              }
            });
          }
        } else {
          throw new Error(result.error || "Could not retrieve listing data");
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Error fetching listing:", err);
        setError(err.message || "Failed to load listing");

        // Record detailed diagnostics for errors
        setDiagnosticInfo({
          error: err.message,
          timestamp: new Date().toISOString(),
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchListing();

    // Cleanup function to handle unmounting
    return () => {
      isMounted = false;
    };
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

  // Handle manual retry
  const handleRetry = () => {
    if (!id) return;
    setLoading(true);

    // Small delay before retrying to ensure any previous requests are completed
    setTimeout(() => {
      // Force router refresh which will trigger the useEffect again
      router.replace(router.asPath);
    }, 500);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Loading property details...</p>
          </div>
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
            actionText="Try Again"
            actionHref="#"
            onAction={handleRetry}
            secondaryActionText="Browse Properties"
            secondaryActionHref="/listings"
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
        {/* Show fetch diagnostic info in development */}
        {process.env.NODE_ENV === "development" && diagnosticInfo && (
          <div className="mb-4 p-2 text-xs bg-gray-100 rounded text-gray-500">
            <details>
              <summary>Debug Info</summary>
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(diagnosticInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}

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
