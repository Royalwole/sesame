import { useState, useEffect } from 'react';
import { withAuth } from '../../../lib/withAuth';
import { FiPlus, FiList, FiUser, FiHome } from 'react-icons/fi';
import Link from 'next/link';
import Head from 'next/head';
import AgentStatusBanner from '../../../components/dashboard/AgentStatusBanner';

function AgentDashboard() {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingListings: 0,
    totalViews: 0,
    totalInquiries: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agent's listings
  useEffect(() => {
    async function fetchAgentListings() {
      try {
        const res = await fetch('/api/listings/agent');
        const data = await res.json();
        
        if (data.success) {
          setListings(data.listings || []);
          
          // Calculate stats
          const active = data.listings.filter(l => l.status === 'active').length;
          const pending = data.listings.filter(l => l.status === 'pending').length;
          const views = data.listings.reduce((sum, l) => sum + (l.views || 0), 0);
          const inquiries = data.listings.reduce((sum, l) => sum + (l.inquiries || 0), 0);
          
          setStats({
            activeListings: active,
            pendingListings: pending,
            totalViews: views,
            totalInquiries: inquiries
          });
        }
      } catch (error) {
        console.error('Error fetching agent listings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAgentListings();
  }, []);

  return (
    <>
      <Head>
        <title>Agent Dashboard | TopDial</title>
      </Head>
      
      <div className="space-y-6">
        {/* Status Banner */}
        <AgentStatusBanner />
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <Link 
            href="/dashboard/agent/listings/create" 
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Create Listing
          </Link>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-blue-500 p-3 text-white">
                  <FiHome className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Listings</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.activeListings}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-yellow-500 p-3 text-white">
                  <FiList className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Listings</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.pendingListings}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-green-500 p-3 text-white">
                  <FiUser className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Inquiries</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.totalInquiries}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-purple-500 p-3 text-white">
                  <FiList className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.totalViews}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Listings */}
        <div className="bg-white shadow-sm overflow-hidden rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Your Listings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your property listings
            </p>
          </div>
          
          {isLoading ? (
            <div className="px-4 py-12 text-center text-gray-500">
              Loading your listings...
            </div>
          ) : listings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
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
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing) => (
                    <tr key={listing._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {listing.images && listing.images[0] ? (
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={listing.images[0]}
                                alt={listing.title}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-gray-200"></div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {listing.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {listing.location?.city}, {listing.location?.state}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${listing.price?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 
                              listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}`}
                        >
                          {listing.status || 'Unknown'}
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
                className="inline-block mt-2 text-blue-600 hover:text-blue-800"
              >
                Create your first listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AgentDashboard;

// Server-side props to protect this page
export const getServerSideProps = withAuth({ role: 'agent' });
