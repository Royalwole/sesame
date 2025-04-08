import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";

export default function MyListingsDebug() {
  const [agentListings, setAgentListings] = useState([]);
  const [publicListings, setPublicListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAgent } = useAuth();

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);

        // Fetch agent's listings
        const agentResponse = await fetch("/api/listings/agent");

        // Fetch public listings
        const publicResponse = await fetch("/api/listings");

        if (!agentResponse.ok) {
          throw new Error(
            `Failed to fetch agent listings: ${agentResponse.statusText}`
          );
        }

        if (!publicResponse.ok) {
          throw new Error(
            `Failed to fetch public listings: ${publicResponse.statusText}`
          );
        }

        const agentData = await agentResponse.json();
        const publicData = await publicResponse.json();

        setAgentListings(agentData.listings || []);
        setPublicListings(publicData.listings || []);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  if (!isAgent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-800">
            This debug tool is only available for agent accounts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>My Listings Debug Tool</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">
        Listings Visibility Debug Tool
      </h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-wine border-t-transparent rounded-full"></div>
          <p className="mt-4">Loading listings...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-bold mb-4">
              Your Agent Listings ({agentListings.length})
            </h2>
            {agentListings.length === 0 ? (
              <p className="text-gray-500">
                You haven't created any listings yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border text-left">Title</th>
                      <th className="py-2 px-4 border text-left">Status</th>
                      <th className="py-2 px-4 border text-left">Created</th>
                      <th className="py-2 px-4 border text-left">Public?</th>
                      <th className="py-2 px-4 border text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentListings.map((listing) => {
                      // Check if this listing also appears in the public listings
                      const isPublic = publicListings.some(
                        (pub) => pub._id === listing._id
                      );

                      return (
                        <tr key={listing._id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border">{listing.title}</td>
                          <td className="py-2 px-4 border">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                listing.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {listing.status || "No status"}
                            </span>
                          </td>
                          <td className="py-2 px-4 border">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 border">
                            {isPublic ? (
                              <span className="text-green-600">Yes ✓</span>
                            ) : (
                              <span className="text-red-600">No ✗</span>
                            )}
                          </td>
                          <td className="py-2 px-4 border space-x-2">
                            <Link
                              href={`/dashboard/agent/listings/${listing._id}`}
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </Link>
                            <Link
                              href={`/api/debug/check-listing?id=${listing._id}`}
                              target="_blank"
                              className="text-green-600 hover:underline"
                            >
                              Debug
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">
              Public Listings ({publicListings.length})
            </h2>
            {publicListings.length === 0 ? (
              <p className="text-gray-500">No public listings found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border text-left">Title</th>
                      <th className="py-2 px-4 border text-left">Status</th>
                      <th className="py-2 px-4 border text-left">Yours?</th>
                      <th className="py-2 px-4 border text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicListings.slice(0, 10).map((listing) => {
                      // Check if this is the agent's listing
                      const isYours = agentListings.some(
                        (ag) => ag._id === listing._id
                      );

                      return (
                        <tr key={listing._id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border">{listing.title}</td>
                          <td className="py-2 px-4 border">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                listing.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {listing.status || "No status"}
                            </span>
                          </td>
                          <td className="py-2 px-4 border">
                            {isYours ? (
                              <span className="text-green-600">Yes ✓</span>
                            ) : (
                              <span className="text-gray-600">No</span>
                            )}
                          </td>
                          <td className="py-2 px-4 border space-x-2">
                            <Link
                              href={`/listings/${listing._id}`}
                              className="text-blue-600 hover:underline"
                              target="_blank"
                            >
                              View Public
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
