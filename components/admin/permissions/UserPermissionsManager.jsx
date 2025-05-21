import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Component for managing user permissions in the admin panel
 */
const UserPermissionsManager = ({ users, roles, refreshUsers }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    if (selectedUser) {
      // Load user roles when a user is selected
      const currentRoles = selectedUser.roles || [];
      setUserRoles(currentRoles);
    }
  }, [selectedUser]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleRoleToggle = (roleId) => {
    setUserRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const saveUserRoles = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: userRoles }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user roles');
      }
      
      toast.success('User roles updated successfully');
      if (refreshUsers) refreshUsers();
    } catch (error) {
      console.error('Error updating user roles:', error);
      toast.error(error.message || 'Failed to update user roles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">User Permissions Manager</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User selection panel */}
        <div>
          <h3 className="font-medium mb-2">Select User</h3>
          <div className="max-h-96 overflow-y-auto border rounded">
            {users?.length > 0 ? (
              <ul className="divide-y">
                {users.map(user => (
                  <li 
                    key={user.id} 
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition ${
                      selectedUser?.id === user.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="font-medium">{user.name || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.roles?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.roles.map(roleId => {
                          const role = roles.find(r => r.id === roleId);
                          return (
                            <span key={roleId} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {role?.name || roleId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-gray-500">No users found</p>
            )}
          </div>
        </div>
        
        {/* Role assignment panel */}
        <div>
          <h3 className="font-medium mb-2">Assign Roles</h3>
          {selectedUser ? (
            <>
              <div className="mb-4">
                <div className="font-medium">{selectedUser.name || selectedUser.email}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
              </div>
              
              <div className="max-h-64 overflow-y-auto border rounded p-3 mb-4">
                {roles?.length > 0 ? (
                  <ul className="space-y-2">
                    {roles.map(role => (
                      <li key={role.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={userRoles.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`role-${role.id}`} className="ml-2 block">
                          <span className="font-medium">{role.name}</span>
                          {role.description && (
                            <p className="text-sm text-gray-500">{role.description}</p>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No roles available</p>
                )}
              </div>
              
              <button
                onClick={saveUserRoles}
                disabled={loading}
                className={`w-full py-2 px-4 rounded font-medium ${
                  loading 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Saving...' : 'Save Role Changes'}
              </button>
            </>
          ) : (
            <p className="text-gray-500 p-4 border rounded">Select a user to manage their roles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsManager;
