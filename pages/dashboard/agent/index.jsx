import { useState, useEffect } from 'react';
import { withAuth } from '../../../lib/withAuth';
import { FiPlus, FiList, FiEye, FiMessageSquare, FiClock, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';
import Head from 'next/head';
import AgentStatusBanner from '../../../components/dashboard/AgentStatusBanner';
import AgentLayout from '../../../components/layout/AgentLayout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

function AgentDashboard() {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingListings: 0,
    totalViews: 0,
    totalInquiries: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAgentData() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both listings and stats in parallel
      const [listingsRes, statsRes] = await Promise.all([
        fetch('/api/listings/agent'),
        fetch('/api/agents/stats')
      ]);

      const listingsData = await listingsRes.json();
      const statsData = await statsRes.json();
      
      if (!listingsRes.ok) {
        throw new Error(listingsData.error || 'Failed to fetch listings');
      }

      if (!statsRes.ok) {
        throw new Error(statsData.error || 'Failed to fetch stats');
      }
      
      setListings(listingsData.listings || []);
      setStats(statsData.stats);

    } catch (error) {
      console.error('Error fetching agent data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAgentData();
  }, []);

  // Function to handle manual refresh
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchAgentData();
  };

  if (isLoading) {
    return (
      <AgentLayout title="Agent Dashboard">
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout title="Agent Dashboard">
      <Head>
        <title>Agent Dashboard | TopDial</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Status Banner */}
          <AgentStatusBanner />
          
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
            <Link 
              href="/dashboard/agent/listings/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-wine hover:bg-wine/90"
            >
              <FiPlus className="mr-2" /> Create Listing
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-full flex justify-end mb-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-wine hover:bg-wine/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine disabled:opacity-50"
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Stats
              </button>
            </div>

            {/* Active Listings */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiList className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Listings</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.activeListings}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Listings */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiClock className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Listings</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.pendingListings}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Views */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiEye className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.totalViews}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Inquiries */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiMessageSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Inquiries</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.totalInquiries}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Listings Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recent Listings</h2>
              <Link
                href="/dashboard/agent/listings"
                className="text-wine hover:text-wine/90 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {error ? (
              <div className="p-4 text-red-700 bg-red-50 border-l-4 border-red-500">
                {error}
              </div>
            ) : listings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inquiries
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {listings.slice(0, 5).map((listing) => (
                      <tr key={listing._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {listing.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            listing.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {listing.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.views || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.inquiries || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            href={`/listings/${listing._id}`} 
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View
                          </Link>
                          <Link 
                            href={`/dashboard/agent/listings/edit/${listing._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-gray-500">
                <p>You don't have any listings yet.</p>
                <Link 
                  href="/dashboard/agent/listings/create"
                  className="inline-block mt-2 text-wine hover:text-wine/90"
                >
                  Create your first listing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}

export default AgentDashboard;

// Server-side props to protect this page
export const getServerSideProps = withAuth({ role: 'agent' });
