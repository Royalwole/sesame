import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Permission Request Review Component
 * 
 * Allows administrators to review and approve/deny permission requests
 */
function PermissionRequestReview() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    action: 'approve',
    comments: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, [filter]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/permissions/requests?status=${filter}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch permission requests');
      }

      setRequests(data.requests || []);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load permission requests');
    } finally {
      setLoading(false);
    }
  };

  // Open review modal
  const openReviewModal = (request) => {
    setReviewModal(request);
    setReviewForm({
      action: 'approve',
      comments: ''
    });
  };

  // Close review modal
  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewForm({
      action: 'approve',
      comments: ''
    });
  };

  // Handle review form changes
  const handleReviewFormChange = (field, value) => {
    setReviewForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit review decision
  const handleSubmitReview = async () => {
    if (!reviewModal) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/permissions/requests/${reviewModal.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: reviewForm.action,
          comments: reviewForm.comments,
          reviewedBy: user.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success(`Request ${reviewForm.action === 'approve' ? 'approved' : 'denied'} successfully`);
      
      // Refresh the requests list
      fetchPendingRequests();
      closeReviewModal();
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

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
          <span className="ml-3 text-gray-600">Loading permission requests...</span>
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
        <h2 className="text-xl font-semibold">Permission Request Review</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="all">All Requests</option>
          </select>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'pending' 
              ? "No pending permission requests to review."
              : `No ${filter} requests found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
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
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {formatDate(request.requestedAt)}
                  </span>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => openReviewModal(request)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <p><strong>Requester:</strong> {request.userEmail || request.userId}</p>
                  <p><strong>Type:</strong> {request.requestType === 'permission' ? 'Individual Permission' : 'Permission Bundle'}</p>
                </div>
                <div>
                  <p><strong>Duration:</strong> {request.duration === 'permanent' ? 'Permanent' : `Temporary (${request.temporaryDays} days)`}</p>
                  {request.emergencyAccess && <p className="text-red-600"><strong>Priority:</strong> Emergency Access</p>}
                </div>
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
                <div className="text-sm text-gray-600 border-t pt-3">
                  <p><strong>Reviewed:</strong> {formatDate(request.reviewedAt)} by {request.reviewedBy}</p>
                  {request.reviewComments && (
                    <div className="mt-1">
                      <p><strong>Review Comments:</strong></p>
                      <p className="pl-2 border-l-2 border-blue-200">{request.reviewComments}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Review Permission Request</h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={closeReviewModal}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Request Details:</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>Permission:</strong> {reviewModal.requestType === 'permission' ? reviewModal.permission : `Bundle ${reviewModal.bundleId}`}</p>
                <p><strong>Requester:</strong> {reviewModal.userEmail || reviewModal.userId}</p>
                <p><strong>Duration:</strong> {reviewModal.duration}</p>
                {reviewModal.emergencyAccess && <p className="text-red-600"><strong>Emergency Access Required</strong></p>}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Decision</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={reviewForm.action === 'approve'}
                    onChange={(e) => handleReviewFormChange('action', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-green-700">Approve Request</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="deny"
                    checked={reviewForm.action === 'deny'}
                    onChange={(e) => handleReviewFormChange('action', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-red-700">Deny Request</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {reviewForm.action === 'deny' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reviewForm.comments}
                onChange={(e) => handleReviewFormChange('comments', e.target.value)}
                rows="3"
                placeholder={reviewForm.action === 'approve' 
                  ? "Optional: Add any comments about the approval..."
                  : "Required: Explain why this request is being denied..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={closeReviewModal}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  reviewForm.action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
                onClick={handleSubmitReview}
                disabled={processing || (reviewForm.action === 'deny' && !reviewForm.comments.trim())}
              >
                {processing ? 'Processing...' : (reviewForm.action === 'approve' ? 'Approve' : 'Deny')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PermissionRequestReview;
