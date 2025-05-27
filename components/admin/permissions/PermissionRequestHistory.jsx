import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Permission Request History Component
 * 
 * Displays a user's permission request history with status and details
 */
function PermissionRequestHistory() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, denied

  useEffect(() => {
    fetchRequestHistory();
  }, [user.id]);

  const fetchRequestHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/permissions/requests`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch request history');
      }

      setRequests(data.requests || []);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load request history');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge classes
  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge classes
  const getPriorityClasses = (isEmergency) => {
    return isEmergency 
      ? 'bg-red-100 text-red-800'
      : 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading request history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Request History</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? "You haven't submitted any permission requests yet."
              : `No ${filter} requests found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">
                    {request.requestType === 'permission' 
                      ? request.permissionName || request.permission
                      : request.bundleName || `Bundle ${request.bundleId}`
                    }
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClasses(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  {request.emergencyAccess && (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityClasses(true)}`}>
                      Emergency
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(request.requestedAt)}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <p><strong>Type:</strong> {request.requestType === 'permission' ? 'Individual Permission' : 'Permission Bundle'}</p>
                <p><strong>Duration:</strong> {request.duration === 'permanent' ? 'Permanent' : `Temporary (${request.temporaryDays} days)`}</p>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <p><strong>Justification:</strong></p>
                <p className="mt-1 pl-2 border-l-2 border-gray-200">{request.justification}</p>
              </div>

              {request.businessImpact && (
                <div className="text-sm text-gray-600 mb-3">
                  <p><strong>Business Impact:</strong></p>
                  <p className="mt-1 pl-2 border-l-2 border-red-200">{request.businessImpact}</p>
                </div>
              )}

              {request.reviewedAt && (
                <div className="text-sm text-gray-600 mb-2">
                  <p><strong>Reviewed:</strong> {formatDate(request.reviewedAt)}</p>
                  {request.reviewedBy && <p><strong>Reviewed by:</strong> {request.reviewedBy}</p>}
                </div>
              )}

              {request.reviewComments && (
                <div className="text-sm text-gray-600 mb-2">
                  <p><strong>Review Comments:</strong></p>
                  <p className="mt-1 pl-2 border-l-2 border-blue-200">{request.reviewComments}</p>
                </div>
              )}

              {request.status === 'approved' && request.duration === 'temporary' && request.expiresAt && (
                <div className="text-sm text-gray-600">
                  <p><strong>Expires:</strong> {formatDate(request.expiresAt)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PermissionRequestHistory;
