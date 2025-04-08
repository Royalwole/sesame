import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { withAgentAuth } from "../../../../lib/withAuth";
import Layout from "../../../../components/layout/AgentLayout";
import Head from "next/head";
import Link from "next/link";
import {
  FiPlus,
  FiEdit2,
  FiEye,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import { getAgentListings } from "../../../../lib/listing-api";
import toast from "react-hot-toast";

export default function AgentListings() {
  const router = useRouter();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch agent listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      const result = await getAgentListings();

      if (result.success) {
        setListings(result.listings || []);
      }
      // If getAgentListings already showed a toast, we don't need to show another
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchListings();
  }, []);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
    toast.success("Listings refreshed");
  };

  // Filter listings based on search term
  const filteredListings = listings.filter(
    (listing) =>
      listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <Head>
        <title>My Listings - Agent Dashboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold">My Listings</h1>
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search listings..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-wine focus:border-wine w-full"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                aria-label="Refresh listings"
              >
                <FiRefreshCw
                  className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <Link
                href="/dashboard/agent/listings/create"
                className="bg-wine text-white px-4 py-2 rounded-md flex items-center hover:bg-opacity-90 whitespace-nowrap"
              >
                <FiPlus className="mr-2" /> New Listing
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-wine border-t-transparent"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium mb-4">No Listings Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't created any property listings yet. Get started by
              creating your first listing.
            </p>
            <Link
              href="/dashboard/agent/listings/create"
              className="bg-wine text-white px-6 py-3 rounded-md inline-flex items-center hover:bg-opacity-90"
            >
              <FiPlus className="mr-2" /> Create Your First Listing
            </Link>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-center text-gray-600">
              No listings match your search for "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mx-auto block mt-4 text-wine hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing._id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="h-48 relative">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-0 right-0 p-2">
                    <span
                      className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                        listing.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {listing.address}, {listing.city}
                  </p>
                  <p className="text-wine font-bold mb-3">
                    ₦{Number(listing.price).toLocaleString()}
                  </p>
                  <div className="flex text-sm text-gray-500 mb-4">
                    <div className="mr-4">
                      <span className="font-medium">{listing.bedrooms}</span>{" "}
                      bed
                    </div>
                    <div className="mr-4">
                      <span className="font-medium">{listing.bathrooms}</span>{" "}
                      bath
                    </div>
                    <div>
                      <span className="font-medium">{listing.views || 0}</span>{" "}
                      views
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Link
                      href={`/dashboard/agent/listings/${listing._id}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FiEye className="mr-1" /> View
                    </Link>
                    <Link
                      href={`/dashboard/agent/listings/edit/${listing._id}`}
                      className="text-gray-600 hover:text-gray-800 flex items-center"
                    >
                      <FiEdit2 className="mr-1" /> Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// Use withAgentAuth to protect this page
export const getServerSideProps = withAgentAuth();
