import React, { useState, useEffect } from 'react';
import { PERMISSIONS, DOMAINS } from '../../../lib/permissions-manager';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * Component for admins to manage user-specific permissions
 * Allows granting and revoking specific permissions beyond role-based ones
 */
function UserPermissionManager({ userId, userName, userEmail, onRefresh }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(Object.keys(DOMAINS)[0]);
  const [selectedPermission, setSelectedPermission] = useState('');
  const [temporaryPermission, setTemporaryPermission] = useState(false);
  const [expirationDate, setExpirationDate] = useState(null);
  const [reason, setReason] = useState('');

  // Fetch user's current permissions
  useEffect(() => {
    if (!userId) return;

    const fetchUserPermissions = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(`/api/users/${userId}/permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUserPermissions(data.permissions || []);
        } else {
          console.error('Failed to fetch user permissions');
          toast.error('Failed to load user permissions');
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Error loading permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [userId, getToken]);

  // Filter available permissions by domain
  const domainPermissions = selectedDomain ? 
    Object.entries(PERMISSIONS[selectedDomain] || {}) : [];

  // Handle permission change
  const handlePermissionChange = async (action) => {
    if (!selectedPermission) {
      toast.error('Please select a permission');
      return;
    }

    if (action === 'grant' && temporaryPermission && !expirationDate) {
      toast.error('Please select an expiration date for temporary permission');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/users/permissions/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          action,
          permission: selectedPermission,
          expiresAt: temporaryPermission ? expirationDate.toISOString() : undefined,
          reason: reason || `${action === 'grant' ? 'Granted' : 'Revoked'} by admin`
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Permission ${action === 'grant' ? 'granted' : 'revoked'} successfully`);
        
        // Update local state with the new permissions
        if (data.user?.permissions) {
          setUserPermissions(data.user.permissions);
        } else if (onRefresh) {
          onRefresh(); // Trigger parent refresh if available
        }
        
        // Reset form after successful operation
        setSelectedPermission('');
        setTemporaryPermission(false);
        setExpirationDate(null);
        setReason('');
      } else {
        toast.error(data.message || 'Failed to update permission');
      }
    } catch (error) {
      console.error(`Error ${action}ing permission:`, error);
      toast.error(`Error ${action}ing permission`);
    } finally {
      setLoading(false);
    }
  };

  // Check if a permission is already granted
  const isPermissionGranted = (permission) => {
    return userPermissions.includes(permission);
  };

  if (!userId) {
    return <div className="text-gray-500">Please select a user to manage permissions</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-800">Permission Manager</h2>
        <p className="text-gray-600 mt-1">
          Manage permissions for {userName || userEmail || userId}
        </p>
      </div>

      {/* Current Permissions */}
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Current Custom Permissions</h3>
        {userPermissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userPermissions.map((perm) => (
              <div key={perm} className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <span>{perm}</span>
                <button
                  onClick={() => handlePermissionChange('revoke', perm)}
                  disabled={loading}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No custom permissions granted</p>
        )}
      </div>

      {/* Add Permission Form */}
      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-700 mb-4">Grant New Permission</h3>
        
        <div className="space-y-4">
          {/* Domain Selection */}
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              Permission Domain
            </label>
            <select
              id="domain"
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setSelectedPermission('');
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              disabled={loading}
            >
              {Object.entries(DOMAINS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {/* Permission Selection */}
          <div>
            <label htmlFor="permission" className="block text-sm font-medium text-gray-700">
              Permission
            </label>
            <select
              id="permission"
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              disabled={loading || !selectedDomain}
            >
              <option value="">Select a permission</option>
              {domainPermissions.map(([key, value]) => (
                <option key={key} value={value}>
                  {key.toLowerCase().replace(/_/g, ' ')} ({value})
                </option>
              ))}
            </select>
          </div>

          {/* Temporary Permission Toggle */}
          <div className="flex items-center">
            <input
              id="temporary"
              type="checkbox"
              checked={temporaryPermission}
              onChange={(e) => setTemporaryPermission(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="temporary" className="ml-2 block text-sm text-gray-700">
              Temporary permission (with expiration)
            </label>
          </div>

          {/* Expiration Date */}
          {temporaryPermission && (
            <div>
              <label htmlFor="expiration" className="block text-sm font-medium text-gray-700">
                Expiration Date
              </label>
              <DatePicker
                id="expiration"
                selected={expirationDate}
                onChange={setExpirationDate}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                disabled={loading}
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason (optional)
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this permission being granted?"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => handlePermissionChange('grant')}
              disabled={loading || !selectedPermission || isPermissionGranted(selectedPermission)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Grant Permission'}
            </button>
            <button
              onClick={() => handlePermissionChange('revoke')}
              disabled={loading || !selectedPermission || !isPermissionGranted(selectedPermission)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Revoke Permission'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserPermissionManager;