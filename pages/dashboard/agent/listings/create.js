import { useState } from "react";
import { useRouter } from "next/router";
import { withAgentAuth } from "../../../../lib/withAuth";
import Layout from "../../../../components/layout/AgentLayout";
import Head from "next/head";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import CreateListingForm from "../../../../components/listings/CreateListingForm";
import toast from "react-hot-toast";

export default function CreateListing() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleCreateListing = async (formData, imageFiles) => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const loadingToast = toast.loading("Creating listing...");

      // Basic validation
      if (!formData.title || !formData.address) {
        toast.error("Missing required fields", { id: loadingToast });
        setSubmitting(false);
        return;
      }

      // Create form data for browser-side FormData API only
      const apiFormData = new FormData();

      // Add basic form fields
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

      // Convert features to JSON if it's an array
      if (Array.isArray(formData.features)) {
        apiFormData.append("features", JSON.stringify(formData.features));
      } else if (
        typeof formData.features === "string" &&
        formData.features.trim()
      ) {
        // Handle comma-separated string
        const featuresArray = formData.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
        apiFormData.append("features", JSON.stringify(featuresArray));
      } else {
        apiFormData.append("features", JSON.stringify([]));
      }

      // Process image files with better error handling
      if (Array.isArray(imageFiles) && imageFiles.length > 0) {
        console.log(`Adding ${imageFiles.length} images to form data`);

        imageFiles.forEach((file, index) => {
          try {
            // File is directly a File object
            if (file instanceof File) {
              apiFormData.append("images", file);
            }
            // File is within a file property (common pattern in some components)
            else if (file && file.file instanceof File) {
              apiFormData.append("images", file.file);
            }
            // Otherwise log the issue
            else {
              console.warn(`Invalid file at index ${index}:`, file);
            }
          } catch (fileError) {
            console.error(`Error adding file ${index}:`, fileError);
          }
        });
      }

      // Set timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      try {
        // Make the API call with better error handling
        const response = await fetch("/api/listings/create", {
          method: "POST",
          body: apiFormData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = `Error (${response.status})`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse as JSON, use text
            const text = await response.text();
            errorMessage = text || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        toast.success("Listing created successfully", { id: loadingToast });

        // Redirect to the new listing page
        setTimeout(() => {
          router.push(`/dashboard/agent/listings/${data.listing._id}`);
        }, 500);
      } catch (requestError) {
        clearTimeout(timeoutId);

        if (requestError.name === "AbortError") {
          toast.error("Request timed out. The server may be busy.", {
            id: loadingToast,
          });
        } else {
          toast.error(requestError.message || "Failed to create listing", {
            id: loadingToast,
          });
        }

        console.error("API request error:", requestError);
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error(
        "Error creating listing: " + (error.message || "Unknown error")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Create Listing - Agent Dashboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/agent/listings"
            className="text-gray-600 hover:text-wine flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Listings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
          <CreateListingForm
            onSubmit={handleCreateListing}
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
