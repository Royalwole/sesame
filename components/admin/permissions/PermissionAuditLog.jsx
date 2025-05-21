import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

/**
 * Component for displaying permission changes audit log
 */
const PermissionAuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAuditLogs();
  }, [page]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/audit-logs/permissions?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setAuditLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError(error.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatActionType = (type) => {
    switch(type) {
      case 'ROLE_ASSIGNED': return 'Role Assigned';
      case 'ROLE_REMOVED': return 'Role Removed';
      case 'PERMISSION_GRANTED': return 'Permission Granted';
      case 'PERMISSION_REVOKED': return 'Permission Revoked';
      default: return type.replace(/_/g, ' ');
    }
  };

  const formatDateTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Permission Changes Audit Log</h2>
      
      {loading && <p className="text-gray-500">Loading audit logs...</p>}
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {!loading && !error && (
        <>
          {auditLogs.length === 0 ? (
            <p className="text-gray-500">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-4 text-left">Date/Time</th>
                    <th className="py-3 px-4 text-left">Action</th>
                    <th className="py-3 px-4 text-left">User</th>
                    <th className="py-3 px-4 text-left">Target User</th>
                    <th className="py-3 px-4 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{formatDateTime(log.timestamp)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          log.actionType.includes('REMOVED') || log.actionType.includes('REVOKED')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {formatActionType(log.actionType)}
                        </span>
                      </td>
                      <td className="py-3 px-4">{log.performedBy?.name || log.performedBy?.email || 'System'}</td>
                      <td className="py-3 px-4">{log.targetUser?.name || log.targetUser?.email || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {log.details?.role && <span>Role: {log.details.role.name}</span>}
                        {log.details?.permission && <span>Permission: {log.details.permission}</span>}
                        {log.details?.notes && <p className="text-sm text-gray-500 mt-1">{log.details.notes}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border`}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border-t border-b">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    page === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PermissionAuditLog;
