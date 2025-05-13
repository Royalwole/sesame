import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast'; // Using react-hot-toast instead of Chakra's useToast
import { 
  ROLES, 
  getRoleDisplayName, 
  getAssignableRoles 
} from '../../lib/role-management';

/**
 * UserRoleManager Component
 * 
 * Allows admins to change user roles with a clean interface
 * and displays the current role with visual indicators.
 */
const UserRoleManager = ({ userId, currentRole, onRoleChange, isDisabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole || ROLES.USER);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const cancelRef = useRef();

  // Update selected role when currentRole prop changes
  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    }
  }, [currentRole]);

  // Map of role colors for badges
  const getRoleBadgeColor = (role) => {
    const colors = {
      [ROLES.ADMIN]: 'bg-red-100 text-red-800',
      [ROLES.SUPER_ADMIN]: 'bg-red-100 text-red-800',
      [ROLES.AGENT]: 'bg-purple-100 text-purple-800',
      [ROLES.AGENT_PENDING]: 'bg-yellow-100 text-yellow-800',
      [ROLES.USER]: 'bg-gray-100 text-gray-800',
      [ROLES.SUPPORT]: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Handler for role change confirmation
  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setIsConfirmOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      toast.success(`User role has been changed to ${getRoleDisplayName(selectedRole)}`);

      // Call the onRoleChange prop if provided
      if (onRoleChange) {
        onRoleChange(selectedRole);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
    }
  };

  // Get the list of available roles (using the constants)
  const availableRoles = Object.values(ROLES);

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm mt-4 bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">User Role</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium ${getRoleBadgeColor(currentRole)}`}>
            Current: {getRoleDisplayName(currentRole) || 'None'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Assign Role
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={isDisabled || isLoading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {getRoleDisplayName(role)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            {selectedRole === currentRole ? 
              "User already has this role" : 
              "Changing roles will affect user permissions"}
          </p>
        </div>
        
        <button
          type="button"
          className={`w-full mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isDisabled || isLoading || selectedRole === currentRole 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
          onClick={() => setIsConfirmOpen(true)}
          disabled={isDisabled || isLoading || selectedRole === currentRole}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            selectedRole === currentRole ? 'No Change' : 'Update Role'
          )}
        </button>
      </div>

      {/* Modal dialog for confirmation (replaces Chakra AlertDialog) */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsConfirmOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Confirm Role Change
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to change this user's role from
                        <span className={`mx-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getRoleBadgeColor(currentRole)}`}>
                          {getRoleDisplayName(currentRole)}
                        </span>
                        to
                        <span className={`mx-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getRoleBadgeColor(selectedRole)}`}>
                          {getRoleDisplayName(selectedRole)}
                        </span>?
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        This will affect their permissions and access levels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  onClick={handleRoleChange}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Confirm Change'}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsConfirmOpen(false)}
                  ref={cancelRef}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleManager;