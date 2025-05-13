import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { HasPermission } from '../auth/PermissionGate';

/**
 * Admin component for managing user permissions through Clerk metadata
 */
export default function PermissionsManager({ user, onUpdate }) {
  const { DOMAINS, PERMISSIONS } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPermissions, setCurrentPermissions] = useState([]);
  const [domainFilter, setDomainFilter] = useState('');
  
  // Load current permissions when user changes
  useEffect(() => {
    if (user?.publicMetadata?.permissions) {
      setCurrentPermissions(user.publicMetadata.permissions);
    } else {
      setCurrentPermissions([]);
    }
  }, [user]);

  // Handle granting a permission
  async function handleAddPermission(permission) {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/users/permissions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          permissions: [permission],
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add permission');
      }
      
      setCurrentPermissions(data.permissions);
      setSuccess(`Added permission: ${permission}`);
      
      if (onUpdate) {
        onUpdate(data.permissions);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle revoking a permission
  async function handleRemovePermission(permission) {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/users/permissions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          permissions: [permission],
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove permission');
      }
      
      setCurrentPermissions(data.permissions);
      setSuccess(`Removed permission: ${permission}`);
      
      if (onUpdate) {
        onUpdate(data.permissions);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Reset permissions to default based on user's role
  async function handleResetPermissions() {
    if (!user?.id) return;
    
    if (!confirm('Are you sure you want to reset permissions to defaults?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/users/permissions/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to reset permissions');
      }
      
      setCurrentPermissions([]);
      setSuccess(`Permissions reset to defaults for role: ${data.role}`);
      
      if (onUpdate) {
        onUpdate([]);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }
  
  // Check if a permission is currently assigned
  function hasPermission(permission) {
    return currentPermissions.includes(permission);
  }
  
  // Get formatted name for a permission
  function getPermissionName(permission) {
    const [domain, action] = permission.split(':');
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return (
    <HasPermission permission="users:change_role">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Manage User Permissions</h2>
        
        {!user && (
          <p className="text-gray-500">Select a user to manage permissions</p>
        )}
        
        {user && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p><strong>User:</strong> {user.firstName} {user.lastName}</p>
              <p><strong>Email:</strong> {user.emailAddresses?.[0]?.emailAddress}</p>
              <p><strong>Role:</strong> {user.publicMetadata?.role || 'user'}</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                {success}
              </div>
            )}
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Current Explicit Permissions</h3>
                <button
                  onClick={handleResetPermissions}
                  disabled={loading}
                  className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Reset to Defaults
                </button>
              </div>
              
              {currentPermissions.length === 0 ? (
                <p className="text-gray-500 italic">
                  No explicit permissions. Using role-based defaults.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {currentPermissions.map(permission => (
                    <div
                      key={permission}
                      className="flex justify-between items-center p-2 bg-blue-50 rounded"
                    >
                      <span className="text-sm">{permission}</span>
                      <button
                        onClick={() => handleRemovePermission(permission)}
                        disabled={loading}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Add Permissions</h3>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-500 mb-1">
                  Filter by Domain
                </label>
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">All Domains</option>
                  {Object.keys(DOMAINS).map(domain => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(PERMISSIONS)
                  .filter(([domain]) => !domainFilter || domain === domainFilter)
                  .map(([domain, domainPermissions]) => (
                    <div key={domain} className="mb-4">
                      <h4 className="font-medium text-sm mb-2">{domain}</h4>
                      <div className="space-y-1">
                        {Object.values(domainPermissions).map(permission => {
                          const isAssigned = hasPermission(permission);
                          
                          return (
                            <div 
                              key={permission}
                              className={`p-2 rounded flex justify-between items-center ${
                                isAssigned ? 'bg-green-50' : 'bg-gray-50'
                              }`}
                            >
                              <span className="text-sm">{getPermissionName(permission)}</span>
                              {isAssigned ? (
                                <button
                                  onClick={() => handleRemovePermission(permission)}
                                  disabled={loading}
                                  className="text-xs px-2 py-1 text-red-600 hover:bg-red-100 rounded"
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAddPermission(permission)}
                                  disabled={loading}
                                  className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-100 rounded"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </HasPermission>
  );
}