import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withAgentAuth } from "../../../../../lib/withAuth";
import Layout from "../../../../../components/layout/AgentLayout";
import Head from "next/head";
import Link from "next/link";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import CreateListingForm from "../../../../../components/listings/CreateListingForm";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import { getListingById } from "../../../../../lib/listing-api";
import toast from "react-hot-toast";

export default function EditListing() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Use a robust listing fetch function
  useEffect(() => {
    const abortController = new AbortController();
    let loadingTimeoutId = null;

    async function fetchListing() {
      if (!id) return;

      // Set a timeout to prevent infinite loading - increased to 45 seconds
      loadingTimeoutId = setTimeout(() => {
        if (loading) {
          console.log(
            "[EditListing] Loading timeout reached - forcing error state"
          );
          setError("Loading timed out. Please try refreshing the page.");
          setLoading(false);
        }
      }, 45000); // 45 second timeout - increased from 30s to accommodate retries

      setLoading(true);
      setError(null);

      try {
        console.log(`[EditListing] Fetching listing data for ID: ${id}`);

        // Add a flag to track if we've attempted recovery
        let hasAttemptedRecovery = false;

        // First try with the standard API
        const result = await getListingById(id);

        console.log("[EditListing] Fetch result:", {
          success: result.success,
          hasData: !!result.listing,
          error: result.error || "No error",
          diagnostics: {
            attempts: result.diagnostics?.attempts || 0,
            duration: result.diagnostics?.duration || 0,
          },
        });

        // Handle successful response
        if (result.success && result.listing) {
          // Validate essential data before setting state
          if (!result.listing.title) {
            console.warn(
              "[EditListing] Warning: Retrieved listing has no title"
            );
          }

          if (!result.listing._id) {
            console.error("[EditListing] Error: Retrieved listing has no ID");
            throw new Error("Retrieved listing is missing ID field");
          }

          // We have valid data, set it in state
          setListing(result.listing);
          setError(null); // Clear any previous errors
        } else {
          // Handle error response - try direct recovery if we haven't already
          if (!hasAttemptedRecovery) {
            hasAttemptedRecovery = true;
            console.log("[EditListing] Attempting direct recovery...");

            try {
              const recoveryResult = await fetch(
                `/api/listings/fixed-fetch?id=${id}&forceDirect=true`,
                {
                  headers: {
                    "Cache-Control": "no-cache, no-store",
                    Pragma: "no-cache",
                  },
                }
              );

              if (recoveryResult.ok) {
                const recoveryData = await recoveryResult.json();
                if (recoveryData.success && recoveryData.listing) {
                  console.log("[EditListing] Direct recovery succeeded!");
                  setListing(recoveryData.listing);
                  setError(null);
                  return;
                }
              }
            } catch (recoveryError) {
              console.error(
                "[EditListing] Direct recovery failed:",
                recoveryError
              );
            }
          }

          // If we get here, both standard and recovery approaches failed
          const errorMsg = result.error || "Failed to load listing";
          console.error(`[EditListing] API Error: ${errorMsg}`);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error("[EditListing] Error loading listing:", error);

        // Clear state and set appropriate error message
        setListing(null);

        // Enhanced error handling with specific server error handling
        if (error.name === "AbortError") {
          setError(
            "Request timed out. The server might be busy or the connection is slow."
          );
        } else if (error.message.includes("Server error")) {
          // Specific handling for server errors
          console.error(
            "[EditListing] Server error detected, attempting recovery..."
          );

          // Try alternate approach with direct API call
          try {
            const retryResponse = await fetch(
              `/api/listings/fixed-fetch?id=${id}`,
              {
                headers: {
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
              }
            );

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              if (retryData.success && retryData.listing) {
                console.log("[EditListing] Recovery successful!");
                setListing(retryData.listing);
                setError(null);
                return; // Exit the catch block if recovery was successful
              }
            }

            // If we get here, recovery failed
            setError(
              "Server encountered an issue. We tried an alternate method but couldn't retrieve the listing data."
            );
          } catch (recoveryError) {
            console.error(
              "[EditListing] Recovery attempt failed:",
              recoveryError
            );
            setError(
              "Server error. Our recovery attempt also failed. Please try again later."
            );
          }
        } else if (
          error.message === "Failed to fetch" ||
          error.message.includes("NetworkError") ||
          error.message.includes("network")
        ) {
          setError(
            "Network error. Please check your internet connection and try again."
          );
        } else {
          setError(error.message || "Failed to load listing details");
        }

        // Show toast with a user-friendly message
        toast.error("Could not load listing details. Please try again.");
      } finally {
        // Always clean up resources
        setLoading(false);

        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
          loadingTimeoutId = null;
        }
      }
    }

    // Only run this when the id is present and valid
    if (id) {
      fetchListing();
    }

    // Cleanup function to abort any pending requests when unmounting
    return () => {
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
      abortController.abort();
    };
  }, [id]); // Removed 'loading' dependency to avoid potential loop

  // Fixed handleUpdateListing function
  const handleUpdateListing = async (formData, imageFiles) => {
    try {
      setSubmitting(true);

      // Basic validation
      if (!formData.title || !formData.address) {
        toast.error("Missing required fields");
        setSubmitting(false);
        return;
      }

      // Create form data with proper error handling
      const apiFormData = new FormData();

      // Basic fields
      apiFormData.append("id", id);
      apiFormData.append("title", formData.title || "");
      apiFormData.append("description", formData.description || "");
      apiFormData.append("price", formData.price?.toString() || "0");
      apiFormData.append("bedrooms", formData.bedrooms?.toString() || "0");
      apiFormData.append("bathrooms", formData.bathrooms?.toString() || "0");
      apiFormData.append("propertyType", formData.propertyType || "house");
      apiFormData.append("listingType", formData.listingType || "sale");
      apiFormData.append("address", formData.address || "");
      apiFormData.append("city", formData.city || "");
      apiFormData.append("state", formData.state || "");
      apiFormData.append("country", formData.country || "Nigeria");
      apiFormData.append("status", formData.status || "published");

      // Handle arrays that need to be JSON stringified
      if (Array.isArray(formData.features)) {
        apiFormData.append("features", JSON.stringify(formData.features));
      }

      // Handle preserved images
      if (Array.isArray(formData.existingImages)) {
        const preservedIds = formData.existingImages
          .map((img) => img._id || img.id)
          .filter(Boolean);

        apiFormData.append("preservedImageIds", JSON.stringify(preservedIds));
      }

      // Process image files
      if (Array.isArray(imageFiles)) {
        imageFiles.forEach((file) => {
          if (file instanceof File) {
            apiFormData.append("images", file);
          } else if (file?.file instanceof File) {
            apiFormData.append("images", file.file);
          }
        });
      }

      // Submit with timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const loadingToast = toast.loading("Updating listing...");

      try {
        const response = await fetch(`/api/listings/${id}`, {
          method: "PUT",
          body: apiFormData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error (${response.status})`);
        }

        toast.success("Listing updated successfully", { id: loadingToast });
        router.push(`/dashboard/agent/listings/${id}`);
      } catch (networkError) {
        clearTimeout(timeoutId);

        if (networkError.name === "AbortError") {
          toast.error("Request timed out", { id: loadingToast });
        } else {
          toast.error(networkError.message || "Update failed", {
            id: loadingToast,
          });
        }
      }
    } catch (error) {
      console.error("Form processing error:", error);
      toast.error(error.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Add refresh capability
  const handleRefresh = async () => {
    if (!id) return;

    setRefreshing(true);
    try {
      const result = await getListingById(id);
      if (result.success && result.listing) {
        setListing(result.listing);
        setError(null);
        toast.success("Listing data refreshed");
      } else {
        setError(result.error || "Failed to refresh listing");
        toast.error("Failed to refresh listing data");
      }
    } catch (error) {
      setError(error.message || "Failed to refresh listing");
      toast.error("Failed to refresh listing data");
    } finally {
      setRefreshing(false);
    }
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
            <p className="text-red-600 mb-4">{error}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/agent/listings"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Back to Listings
              </Link>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                <FiRefreshCw
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Retrying..." : "Try Again"}
              </button>

              <Link
                href={`/dashboard/agent/listings/${id}`}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                View Listing
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) return null;

  return (
    <Layout>
      <Head>
        <title>Edit {listing?.title || "Listing"} - Agent Dashboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/agent/listings/${id}`}
            className="text-gray-600 hover:text-wine flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Listing Details
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">
            Edit Listing: {listing?.title}
          </h1>
          <CreateListingForm
            initialValues={listing}
            isEditing={true}
            listingId={id}
            onSubmit={handleUpdateListing}
            submitting={submitting}
            setSubmitting={setSubmitting}
          />
        </div>
      </div>
    </Layout>
  );
}

// Protect this page with agent auth
export const getServerSideProps = withAgentAuth();
