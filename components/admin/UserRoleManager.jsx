import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../lib/role-management";

/**
 * Admin component for managing user roles
 * Provides UI to view and modify user roles with proper validation
 */
export default function UserRoleManager({ userId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { isAdmin } = useAuth();

  // New role selection
  const [newRole, setNewRole] = useState("");
  const [approved, setApproved] = useState(false);

  // Fetch user role information
  useEffect(() => {
    if (!userId || !isAdmin) return;
    
    async function fetchUserData() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/debug/role-debug?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching user data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.roleInfo) {
          setUserData(data.roleInfo);
          // Set initial form values based on current role
          setNewRole(data.roleInfo.database.role);
          setApproved(data.roleInfo.database.approved);
        } else {
          throw new Error(data.error || "Failed to load user data");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading user role data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [userId, isAdmin]);

  // Handle role change submission
  async function handleRoleChange(e) {
    e.preventDefault();
    if (!userId || !newRole) return;
    
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    
    try {
      const response = await fetch("/api/users/change-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: newRole,
          approved: newRole === ROLES.AGENT ? approved : false,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change role");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`User role updated successfully to ${data.newRole}`);
        // Refresh user data
        const refreshResponse = await fetch(`/api/debug/role-debug?userId=${userId}`);
        const refreshData = await refreshResponse.json();
        setUserData(refreshData.roleInfo);
        
        // Notify parent component if provided
        if (onUpdate) onUpdate(data);
      } else {
        throw new Error(data.error || "Operation failed");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error changing role:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle forced sync between systems
  async function handleSyncSystems(direction) {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '';
      
      if (direction === 'toClerk') {
        endpoint = `/api/users/sync-to-clerk?userId=${userId}`;
      } else {
        endpoint = `/api/users/sync-from-clerk?userId=${userId}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sync");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Sync ${direction === 'toClerk' ? 'to Clerk' : 'from Clerk'} successful!`);
        
        // Refresh user data
        const refreshResponse = await fetch(`/api/debug/role-debug?userId=${userId}`);
        const refreshData = await refreshResponse.json();
        setUserData(refreshData.roleInfo);
      } else {
        throw new Error(data.error || "Sync operation failed");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error syncing:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return <div className="text-red-600">Admin access required</div>;
  }

  if (loading && !userData) {
    return <div className="text-gray-500">Loading user role data...</div>;
  }

  if (error && !userData) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!userData) {
    return <div className="text-gray-500">No user data available</div>;
  }

  const { roleMatch, approvalMatch } = userData;
  const hasInconsistency = !roleMatch || !approvalMatch;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">User Role Manager</h2>
      
      {/* Role consistency status */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="font-semibold mr-2">Role Status:</span>
          <span 
            className={`px-3 py-1 rounded-full text-sm font-medium ${hasInconsistency 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'}`}
          >
            {hasInconsistency ? "Inconsistent" : "Consistent"}
          </span>
        </div>
        
        {hasInconsistency && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-sm">
            <p>Warning: User role data is inconsistent between Clerk and Database!</p>
            <div className="mt-2">
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-xs mr-2"
                onClick={() => handleSyncSystems('toClerk')}
                disabled={loading}
              >
                Sync DB to Clerk
              </button>
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-xs"
                onClick={() => handleSyncSystems('fromClerk')}
                disabled={loading}
              >
                Sync Clerk to DB
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Current role information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-bold mb-2">Clerk Data</h3>
          <p><span className="font-medium">Role:</span> {userData.clerk.role}</p>
          <p><span className="font-medium">Approved:</span> {userData.clerk.approved ? "Yes" : "No"}</p>
          <p><span className="font-medium">Email:</span> {userData.clerk.email}</p>
          <p><span className="font-medium">Name:</span> {userData.clerk.firstName} {userData.clerk.lastName}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-bold mb-2">Database Data</h3>
          <p><span className="font-medium">Role:</span> {userData.database.role}</p>
          <p><span className="font-medium">Approved:</span> {userData.database.approved ? "Yes" : "No"}</p>
          <p><span className="font-medium">Email:</span> {userData.database.email}</p>
          <p><span className="font-medium">Name:</span> {userData.database.firstName} {userData.database.lastName}</p>
        </div>
      </div>
      
      {/* Change role form */}
      <form onSubmit={handleRoleChange} className="mb-4">
        <h3 className="font-bold mb-3">Change User Role</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">New Role</label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            disabled={loading}
          >
            <option value={ROLES.USER}>User</option>
            <option value={ROLES.AGENT_PENDING}>Agent (Pending)</option>
            <option value={ROLES.AGENT}>Agent</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>
        </div>
        
        {newRole === ROLES.AGENT && (
          <div className="mb-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={approved} 
                onChange={(e) => setApproved(e.target.checked)}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm font-medium">Approved Agent</span>
            </label>
          </div>
        )}
        
        {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}
        {successMessage && <div className="text-green-600 mb-4 text-sm">{successMessage}</div>}
        
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Role"}
        </button>
      </form>
    </div>
  );
}