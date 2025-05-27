import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Permission Catalog component
 * 
 * Displays a searchable, filterable table of permissions with their descriptions
 * and whether the current user has them
 */
function PermissionCatalog({ permissions = [], userPermissions = [], showAvailability = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  // Extract unique domains
  const domains = useMemo(() => {
    const domainSet = new Set();
    permissions.forEach(permission => {
      if (permission.domain) {
        domainSet.add(permission.domain);
      }
    });
    return Array.from(domainSet).sort();
  }, [permissions]);

  // Filter permissions based on search and domain
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      const matchesSearch = !searchQuery || 
        permission.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDomain = !domainFilter || permission.domain === domainFilter;
      
      return matchesSearch && matchesDomain;
    });
  }, [permissions, searchQuery, domainFilter]);

  if (!permissions || permissions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          No permissions available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search permissions
            </label>
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by domain
            </label>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All domains</option>
              {domains.map((domain, index) => (
                <option key={index} value={domain}>{domain}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredPermissions.length} of {permissions.length} permissions
        </div>
      </div>

      {/* Permissions table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                {showAvailability && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map((permission) => {
                  const hasPermission = userPermissions.includes(permission.id);
                  
                  return (
                    <tr key={permission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {permission.id}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {permission.domain}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {permission.description}
                        </div>
                        {permission.details && (
                          <div className="text-xs text-gray-500 mt-1">
                            {permission.details}
                          </div>
                        )}
                      </td>
                      {showAvailability && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              hasPermission
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {hasPermission ? '✓ Granted' : '✗ Not granted'}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={showAvailability ? 4 : 3} className="px-6 py-8 text-center text-gray-500">
                    No permissions found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PermissionCatalog;