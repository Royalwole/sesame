import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Admin component for managing synchronization between Clerk and MongoDB
 * Provides UI for triggering sync operations and viewing sync status
 */
export default function ClerkSyncManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [batchSize, setBatchSize] = useState(100);
  const [lastSync, setLastSync] = useState(null);
  const { isAdmin } = useAuth();

  // Get last sync info on component mount
  useEffect(() => {
    if (!isAdmin) return;
    
    async function getLastSyncInfo() {
      try {
        const res = await fetch('/api/admin/sync-status');
        const data = await res.json();
        
        if (data.success && data.lastSync) {
          setLastSync(data.lastSync);
        }
      } catch (err) {
        console.error("Error fetching sync status:", err);
      }
    }
    
    getLastSyncInfo();
  }, [isAdmin]);

  // Handle full sync of users from Clerk to MongoDB
  async function handleFullSync() {
    setLoading(true);
    setError(null);
    setSyncResult(null);
    
    try {
      const response = await fetch(`/api/admin/sync-clerk-users?batchSize=${batchSize}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setSyncResult(result);
      
      // Update last sync info
      if (result.success) {
        setLastSync({
          date: new Date().toISOString(),
          totalUsers: result.data.total,
          createdUsers: result.data.created,
          updatedUsers: result.data.updated,
          failedUsers: result.data.failed,
        });
      }
      
    } catch (err) {
      setError(err.message || "Failed to sync users");
      console.error("Error syncing users:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle syncing a single user by Clerk ID
  async function handleSyncUser(event) {
    event.preventDefault();
    const clerkId = event.target.clerkId.value.trim();
    
    if (!clerkId) {
      setError("Clerk ID is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/sync-clerk-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clerkId })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSyncResult({
          success: true,
          message: `User ${clerkId} synced successfully`,
          data: { user: result.user }
        });
      } else {
        throw new Error(result.error || "Failed to sync user");
      }
      
    } catch (err) {
      setError(err.message);
      console.error("Error syncing single user:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Clerk Data Synchronization</h2>
      
      {lastSync && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Last Synchronization</h3>
          <p>Date: {new Date(lastSync.date).toLocaleString()}</p>
          <p>Total Users: {lastSync.totalUsers}</p>
          <p>Created: {lastSync.createdUsers}, Updated: {lastSync.updatedUsers}, Failed: {lastSync.failedUsers || 0}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {syncResult && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          <p>{syncResult.message}</p>
          {syncResult.data && (
            <p className="mt-1 text-sm">
              Total: {syncResult.data.total || 0}, 
              Created: {syncResult.data.created || 0}, 
              Updated: {syncResult.data.updated || 0}, 
              Failed: {syncResult.data.failed || 0}
            </p>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-3">Sync All Users</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Batch Size</span>
            <input 
              type="number" 
              min="10" 
              max="500"
              value={batchSize} 
              onChange={(e) => setBatchSize(parseInt(e.target.value))} 
              className="border rounded px-3 py-2 w-24"
            />
          </label>
          
          <button 
            onClick={handleFullSync} 
            disabled={loading} 
            className={`px-4 py-2 rounded-md ${
              loading 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Processing..." : "Sync All Users"}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          This operation will synchronize all users from Clerk to MongoDB. 
          It may take some time depending on the number of users.
        </p>
      </div>
      
      <div>
        <h3 className="font-medium mb-3">Sync Single User</h3>
        <form onSubmit={handleSyncUser} className="flex flex-col gap-4">
          <div>
            <label htmlFor="clerkId" className="block text-sm text-gray-500 mb-1">
              Clerk User ID
            </label>
            <input 
              id="clerkId"
              name="clerkId"
              type="text" 
              placeholder="user_123..."
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          
          <div>
            <button 
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md ${
                loading 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? "Processing..." : "Sync User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}