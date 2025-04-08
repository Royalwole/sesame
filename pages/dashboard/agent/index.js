import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { withAuth } from "../../../lib/withAuth";
import Head from "next/head";
import Link from "next/link";
import { FiUser, FiHome, FiList, FiSettings } from "react-icons/fi";
import AgentStatusBanner from "../../../components/dashboard/AgentStatusBanner";

export default function AgentDashboard() {
  const { dbUser, isLoading, isAgent } = useAuth();
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    const fetchAgentListings = async () => {
      try {
        const response = await fetch("/api/listings/agent");
        if (response.ok) {
          const data = await response.json();
          setListings(data.listings || []);
        } else {
          console.error("Failed to fetch agent listings");
        }
      } catch (error) {
        console.error("Error fetching agent listings:", error);
      } finally {
        setLoadingListings(false);
      }
    };

    if (isAgent && !isLoading) {
      fetchAgentListings();
    }
  }, [isAgent, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPendingAgent = dbUser?.role === "agent_pending";

  return (
    <>
      <Head>
        <title>Agent Dashboard | TopDial</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {isPendingAgent && <AgentStatusBanner />}

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {dbUser?.firstName || "Agent"}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your listings and profile from your agent dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Link href="/dashboard/agent/profile" className="block">
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center text-blue-600 mb-3">
                  <FiUser size={24} />
                  <h2 className="text-lg font-semibold ml-2">My Profile</h2>
                </div>
                <p className="text-gray-600">
                  Update your professional profile and agent information
                </p>
              </div>
            </Link>

            <Link href="/dashboard/agent/listings" className="block">
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center text-blue-600 mb-3">
                  <FiHome size={24} />
                  <h2 className="text-lg font-semibold ml-2">My Listings</h2>
                </div>
                <p className="text-gray-600">
                  Manage your property listings and add new ones
                </p>
              </div>
            </Link>

            <Link href="/dashboard/agent/settings" className="block">
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center text-blue-600 mb-3">
                  <FiSettings size={24} />
                  <h2 className="text-lg font-semibold ml-2">Settings</h2>
                </div>
                <p className="text-gray-600">
                  Manage your notification preferences and account settings
                </p>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Listings
              </h2>
              <Link
                href="/dashboard/agent/listings"
                className="text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>

            {loadingListings ? (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            ) : listings.length > 0 ? (
              <div className="space-y-4">
                {listings.slice(0, 3).map((listing) => (
                  <div
                    key={listing._id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium">{listing.title}</h3>
                      <p className="text-gray-500 text-sm">
                        {listing.location?.city}, {listing.location?.state}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/agent/listings/${listing._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FiList className="mx-auto mb-2" size={24} />
                <p>No listings yet. Create your first property listing.</p>
                <Link
                  href="/dashboard/agent/listings/new"
                  className="mt-2 inline-block text-blue-600 hover:underline"
                >
                  Add New Listing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Protect with authentication
export const getServerSideProps = withAuth();
