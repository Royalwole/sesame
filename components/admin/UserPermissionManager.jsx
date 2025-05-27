import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PERMISSIONS } from '../../lib/permissions-manager';

/**
 * UserPermissionManager Component
 * 
 * Allows admins to manage user-specific permissions with a clean interface
 * and supports adding temporary permissions with expiration dates.
 */
const UserPermissionManager = ({ userId, userRole, currentPermissions = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState(currentPermissions);
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [temporaryPermissions, setTemporaryPermissions] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [permissionToRevoke, setPermissionToRevoke] = useState(null);

  // Fetch user permissions on load
  useEffect(() => {
    fetchUserPermissions();
    // Get all available permissions
    const allPermissions = Object.keys(PERMISSIONS).map(key => ({ 
      name: key, 
      description: PERMISSIONS[key].description 
    }));
    setAvailablePermissions(allPermissions);
    setFilteredPermissions(allPermissions);
  }, [userId]);

  // Filter available permissions based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = availablePermissions.filter(
        perm => perm.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                perm.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPermissions(filtered);
    } else {
      setFilteredPermissions(availablePermissions);
    }
  }, [searchQuery, availablePermissions]);

  // Fetch user permissions and temporary permissions data
  const fetchUserPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user permissions');
      }
      
      setPermissions(data.permissions || []);
      setTemporaryPermissions(data.temporaryPermissions || {});
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Grant a permission to the user
  const handleGrantPermission = async () => {
    if (!selectedPermission) return;
    
    setIsLoading(true);
    try {
      const expiresAt = isTemporary ? 
        new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() :
        null;

      const response = await fetch(`/api/users/permissions/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          permission: selectedPermission,
          grant: true,
          temporary: isTemporary,
          expiresAt
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant permission');
      }

      toast.success(`${selectedPermission} permission has been granted to user${isTemporary ? ' (temporary)' : ''}`);

      // Refresh permissions
      fetchUserPermissions();
      
      // Reset form
      setSelectedPermission('');
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm permission revocation
  const openRevokeConfirmation = (permission) => {
    setPermissionToRevoke(permission);
    setIsConfirmOpen(true);
  };

  // Revoke a permission from the user
  const handleRevokePermission = async () => {
    if (!permissionToRevoke) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/permissions/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          permission: permissionToRevoke,
          grant: false
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke permission');
      }

      toast.success(`${permissionToRevoke} permission has been revoked from user`);

      // Refresh permissions
      fetchUserPermissions();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
      setPermissionToRevoke(null);
    }
  };

  // Format expiration date for display
  const formatExpirationDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days remaining until expiration
  const getDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expDate = new Date(expiresAt);
    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get badge color based on days remaining
  const getExpirationColorClasses = (expiresAt) => {
    const daysRemaining = getDaysRemaining(expiresAt);
    if (daysRemaining <= 1) return 'bg-red-100 text-red-800 border-red-200';
    if (daysRemaining <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysRemaining <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">User Permissions</h3>
          <button 
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Grant Permission
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {isLoading && (
          <div className="flex justify-center items-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {!isLoading && permissions.length === 0 && (
          <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
            <p className="text-gray-500">No custom permissions granted to this user.</p>
            <p className="text-sm text-gray-400 mt-1">
              User has standard permissions from their {userRole} role.
            </p>
          </div>
        )}
        
        {!isLoading && permissions.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              User has {permissions.length} custom permission(s) in addition to standard {userRole} role permissions.
            </p>
            
            <div className="overflow-x-auto mt-3">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map((permission) => {
                    const isTemp = temporaryPermissions[permission];
                    const expiresAt = isTemp ? temporaryPermissions[permission].expiresAt : null;
                    
                    return (
                      <tr key={permission}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div title={PERMISSIONS[permission]?.description || 'Custom permission'}>
                            <span className="text-xs font-mono text-gray-900">
                              {permission}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isTemp ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Temporary
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Permanent
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isTemp ? (
                            <div title={`Expires on ${formatExpirationDate(expiresAt)}`}>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getExpirationColorClasses(expiresAt)}`}>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {getDaysRemaining(expiresAt)} days left
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="text-xs text-red-600 hover:text-red-900"
                            onClick={() => openRevokeConfirmation(permission)}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Grant Permission Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Grant Permission</h3>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Permissions</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button 
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery('')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Permission</label>
                <select
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a permission to grant</option>
                  {filteredPermissions.map((perm) => (
                    <option key={perm.name} value={perm.name}>
                      {perm.name} - {perm.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the permission you want to grant to this user
                </p>
              </div>
              
              <div className="mb-4 flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isTemporary}
                    onChange={() => setIsTemporary(!isTemporary)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Temporary Permission</span>
                </label>
              </div>
              
              {isTemporary && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiration (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Permission will automatically expire after this many days
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  onClick={handleGrantPermission}
                  disabled={isLoading || !selectedPermission}
                >
                  {isLoading ? 'Granting...' : 'Grant Permission'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Revoke Permission Confirmation */}
        {isConfirmOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold mb-4">Revoke Permission</h3>

              <div className="mb-4">
                <p>Are you sure you want to revoke the <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">{permissionToRevoke}</span> permission from this user?</p>
                
                <p className="mt-2 text-sm text-gray-600">
                  This action cannot be undone and may affect the user's access to certain features.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  onClick={handleRevokePermission}
                  disabled={isLoading}
                >
                  {isLoading ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPermissionManager;
