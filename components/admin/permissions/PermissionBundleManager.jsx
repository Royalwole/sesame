import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

function PermissionBundleManager() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/permission-bundles');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch bundles');
      }
      
      setBundles(data.bundles || []);
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setError(err.message);
      toast.error('Failed to load permission bundles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading permission bundles...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Permission Bundle Manager</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Permission bundles will be displayed here.</p>
        {bundles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No permission bundles found
          </div>
        )}
      </div>
    </div>
  );
}

export default PermissionBundleManager;