import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import {
  FiPlus,
  FiList,
  FiEye,
  FiMessageSquare,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";

// This is a bypass version of the agent dashboard that doesn't use withAuth
// It can be accessed to debug or bypass permission issues
export default function BypassAgentDashboard() {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingListings: 0,
    totalViews: 0,
    totalInquiries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoaded } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both listings and stats in parallel
        const [listingsRes, statsRes] = await Promise.all([
          fetch("/api/listings/agent?bypass=true"),
          fetch("/api/agents/stats?bypass=true"),
        ]);

        if (!listingsRes.ok) {
          throw new Error("Failed to fetch listings");
        }

        if (!statsRes.ok) {
          throw new Error("Failed to fetch stats");
        }

        const listingsData = await listingsRes.json();
        const statsData = await statsRes.json();

        setListings(listingsData.listings || []);
        setStats(
          statsData || {
            activeListings: 0,
            pendingListings: 0,
            totalViews: 0,
            totalInquiries: 0,
          }
        );
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Agent Dashboard (Bypass Mode) - TopDial</title>
      </Head>

      {/* Emergency access banner */}
      <div className="bg-yellow-100 border-b border-yellow-300 p-4 text-center text-yellow-800">
        <strong>BYPASS MODE:</strong> You're viewing the agent dashboard in
        permission bypass mode.
        {!user && (
          <span className="font-bold"> Warning: You are not signed in!</span>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agent Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome {user?.firstName || "Agent"}, manage your listings and
            activities from here
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h2 className="font-semibold text-red-700">Debug Information</h2>
            <p className="text-red-600 text-sm mt-1">
              This is a special bypass version of the agent dashboard. If you're
              seeing this page but can't access the regular agent dashboard, you
              likely have permission issues.
            </p>
            <div className="mt-3 flex space-x-4">
              <Link
                href="/debug-permissions"
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Debug Permissions
              </Link>
              <Link
                href="/fix-permission-cache"
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Fix Permission Cache
              </Link>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="bg-white p-4 rounded-md shadow mb-6">
              <h2 className="font-semibold mb-2">Your Account</h2>
              <div className="text-sm space-y-1 text-gray-700">
                <p>
                  <span className="font-medium">ID:</span> {user.id}
                </p>
                <p>
                  <span className="font-medium">Name:</span> {user.firstName}{" "}
                  {user.lastName}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {user.primaryEmailAddress?.emailAddress}
                </p>
                <p>
                  <span className="font-medium">Role:</span>{" "}
                  {user.publicMetadata?.role || "No role set"}
                </p>
                <p>
                  <span className="font-medium">Approved:</span>{" "}
                  {user.publicMetadata?.approved ? "Yes" : "No"}
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <FiList className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Listings
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.activeListings || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <FiClock className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Listings
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.pendingListings || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <FiEye className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Views
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.totalViews || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <FiMessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Inquiries
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stats.totalInquiries || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md mt-8">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Listings
            </h3>
            <Link
              href="/dashboard/agent/listings/create?bypass=true"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              New Listing
            </Link>
          </div>

          {isLoading ? (
            <div className="p-10 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-500">Loading your listings...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-red-500">Error loading listings: {error}</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-500">You don't have any listings yet.</p>
              <Link
                href="/dashboard/agent/listings/create?bypass=true"
                className="mt-4 inline-block px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {listings.map((listing) => (
                <li key={listing._id}>
                  <Link
                    href={`/dashboard/agent/listings/${listing._id}?bypass=true`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {listing.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              listing.status === "active"
                                ? "bg-green-100 text-green-800"
                                : listing.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {listing.status === "active"
                              ? "Active"
                              : listing.status === "pending"
                                ? "Pending"
                                : listing.status || "Draft"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            $
                            {listing.price
                              ? listing.price.toLocaleString()
                              : "N/A"}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            {listing.location?.city || "No location"},{" "}
                            {listing.location?.state || ""}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Debug links */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Debug Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/fix-dashboard"
              className="bg-white p-4 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
            >
              Fix Dashboard Utility
            </Link>
            <Link
              href="/debug-permissions"
              className="bg-white p-4 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
            >
              Debug Permissions
            </Link>
            <Link
              href="/dashboard/agent?breakLoop=true"
              className="bg-white p-4 rounded border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
            >
              Regular Agent Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
