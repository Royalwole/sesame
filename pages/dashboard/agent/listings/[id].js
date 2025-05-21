import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  withAgentAuth,
  withAgentAuthGetServerSideProps,
} from "../../../../lib/withAuth";
import Layout from "../../../../components/layout/AgentLayout";
import Head from "next/head";
import Link from "next/link";
import { FiArrowLeft, FiEdit, FiRefreshCw } from "react-icons/fi";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { getListingById } from "../../../../lib/listing-api";
import toast from "react-hot-toast";

function ViewListing() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Create a separate function to fetch the listing data
  const fetchListingData = useCallback(async (listingId) => {
    if (!listingId) return false;

    setLoading(true);
    setError(null);

    try {
      console.log(`[ViewListing] Starting fetch for ID: "${listingId}"`);

      // Create a unique request ID to help track this specific request in logs
      const requestId = Math.random().toString(36).substring(2, 10);

      // Force a fresh fetch by adding unique parameters
      const result = await getListingById(listingId);

      if (!result.success || !result.listing) {
        console.error(
          `[ViewListing:${requestId}] Failed to load listing:`,
          result.error || "Unknown error"
        );
        throw new Error(result.error || "Failed to load listing");
      }

      // Double-check IDs match exactly to catch any inconsistencies
      const receivedId = String(result.listing._id);
      const expectedId = String(listingId);

      console.log(
        `[ViewListing:${requestId}] Comparing IDs - Expected: "${expectedId}", Received: "${receivedId}"`
      );
      console.log(
        `[ViewListing:${requestId}] Listing title: "${result.listing.title}"`
      );

      if (receivedId !== expectedId) {
        console.error(
          `[ViewListing:${requestId}] ID MISMATCH! Expected: "${expectedId}", got: "${receivedId}"`
        );
        throw new Error(
          `ID mismatch error: Expected ${expectedId}, got ${receivedId}`
        );
      }

      console.log(
        `[ViewListing:${requestId}] Success - Setting listing: "${result.listing.title}"`
      );
      setListing(result.listing);
      return true;
    } catch (error) {
      console.error("[ViewListing] Error fetching listing:", error);
      setError(error.message || "Failed to load listing");
      toast.error("Error loading listing details");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add this new function after the fetchListingData function
  const attemptListingRecovery = async () => {
    if (!id) return false;

    setLoading(true);
    setError("Attempting listing recovery...");

    try {
      // If we have listing title from previous attempt, use it for better recovery
      const fallbackTitle = listing?.title
        ? encodeURIComponent(listing.title)
        : "";
      const fallbackPrice = listing?.price || "";

      // Call our specialized recovery endpoint
      const response = await fetch(
        `/api/listings/fixed-fetch?id=${id}&fallbackTitle=${fallbackTitle}&fallbackPrice=${fallbackPrice}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          "Recovery failed: " +
            (response.status === 404 ? "Listing not found" : "Server error")
        );
      }

      const result = await response.json();

      if (!result.success || !result.listing) {
        throw new Error("Recovery returned no listing data");
      }

      // Verify the recovered ID matches what we requested
      const recoveredId = String(result.listing._id);

      console.log(
        `Recovery successful! Listing: "${result.listing.title}" (${recoveredId})`
      );

      // Set the recovered listing
      setListing(result.listing);
      setError(null);

      // Show success message
      toast.success("Successfully recovered listing data!");
      return true;
    } catch (error) {
      console.error("Recovery attempt failed:", error);
      setError(`Recovery failed: ${error.message}. Please try again later.`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch listing when ID changes or component mounts
  useEffect(() => {
    // Reset state when ID changes
    setListing(null);

    // Only fetch when we have an ID
    if (!id) return;

    console.log(`[ViewListing] ID from URL: "${id}"`);
    fetchListingData(id);

    // Return cleanup function to cancel any pending state updates
    return () => {
      console.log(
        "[ViewListing] Cleanup - component unmounting or ID changing"
      );
    };
  }, [id, fetchListingData]); // Re-run effect when ID changes

  // Manual refresh function
  const handleRefresh = async () => {
    if (!id) return;

    setRefreshing(true);
    await fetchListingData(id);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <h2 className="text-xl font-bold text-red-700">Error</h2>
            <p className="text-red-600">{error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/agent/listings"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Back to Listings
              </Link>
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
              >
                <FiRefreshCw
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Try Again
              </button>

              {/* Add the new recovery button */}
              <button
                onClick={attemptListingRecovery}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Advanced Recovery
              </button>
            </div>
          </div>

          {/* Add debugging info in development mode */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold">Debug Information:</h3>
              <pre className="mt-2 text-xs overflow-auto">
                ID from URL: {JSON.stringify(id, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
            <h2 className="text-xl font-bold text-yellow-700">
              No Listing Data
            </h2>
            <p className="text-yellow-600">
              Unable to display listing information. Please try again.
            </p>
            <div className="mt-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-wine text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50 flex items-center"
              >
                <FiRefreshCw
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{listing.title} - Agent Dashboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard/agent/listings"
            className="text-gray-600 hover:text-wine flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Listings
          </Link>

          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md flex items-center hover:bg-gray-300 disabled:opacity-50"
            >
              <FiRefreshCw
                className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href={`/dashboard/agent/listings/edit/${listing._id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
            >
              <FiEdit className="mr-2" /> Edit Listing
            </Link>
          </div>
        </div>

        {/* Display the ID match verification in development mode */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="font-semibold">Debug Info:</div>
            <div>Listing ID: {listing._id}</div>
            <div>URL ID: {id}</div>
            <div>ID Match: {listing._id === id ? "✅ Yes" : "❌ No"}</div>
          </div>
        )}

        {/* Existing listing display code... */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-80">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[0].url}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Image failed to load:", listing.images[0].url);
                  // Fallback to a placeholder if the image fails to load
                  e.target.src =
                    "https://via.placeholder.com/800x600?text=No+Image";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}

            {/* Show image count if multiple images */}
            {listing.images && listing.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {listing.images.length} images
              </div>
            )}
          </div>

          {/* Listing Details */}
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
            <p className="text-wine text-xl font-bold mb-4">
              ₦{Number(listing.price).toLocaleString()}
            </p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="bg-gray-100 px-3 py-1 rounded">
                <span className="font-medium">{listing.bedrooms}</span> Beds
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded">
                <span className="font-medium">{listing.bathrooms}</span> Baths
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded">
                <span className="font-medium">{listing.propertyType}</span>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded">
                <span className="font-medium">{listing.listingType}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{listing.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Location</h2>
              <p className="text-gray-700">
                {listing.address}, {listing.city}, {listing.state},{" "}
                {listing.country}
              </p>
            </div>

            {listing.features && listing.features.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 px-3 py-1 rounded text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-6">
              <div className="flex justify-between items-center">
                <div className="text-gray-500 text-sm">
                  <div>
                    Created: {new Date(listing.createdAt).toLocaleDateString()}
                  </div>
                  <div>Views: {listing.views || 0}</div>
                </div>
                <Link
                  href={`/listings/${listing._id}`}
                  className="text-wine hover:underline"
                  target="_blank"
                >
                  View Public Listing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Protect this page with agent auth
export const getServerSideProps = withAgentAuthGetServerSideProps();

// Export the wrapped component
export default withAgentAuth(ViewListing);
