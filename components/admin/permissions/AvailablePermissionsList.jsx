import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

/**
 * AvailablePermissionsList Component
 * 
 * Displays all available permissions in the system with search and filter capabilities
 * for admin users to reference when assigning permissions
 */
const AvailablePermissionsList = () => {
  const [permissions, setPermissions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');  const [filteredPermissions, setFilteredPermissions] = useState([]);
  
  // Fetch permissions data when component mounts
  useEffect(() => {
    fetchPermissions();
  }, []);
  
  // Filter permissions when search query or domain filter changes
  useEffect(() => {
    if (!permissions.length) return;
    
    let filtered = [...permissions];
    
    // Apply domain filter
    if (domainFilter) {
      filtered = filtered.filter(p => p.domain === domainFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.id.toLowerCase().includes(query) || 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredPermissions(filtered);
  }, [searchQuery, domainFilter, permissions]);
  
  // Fetch permissions from API
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/permissions/available');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPermissions(data.permissions || []);
        setFilteredPermissions(data.permissions || []);
        setDomains(data.domains || []);
      } else {
        throw new Error(data.error || 'Failed to load permissions');
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err.message || 'Failed to load permissions data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle domain filter change
  const handleDomainChange = (e) => {
    setDomainFilter(e.target.value);
  };
    // Display loading state
  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading permissions...</p>
      </div>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Error loading permissions: {error}
        </div>
      </div>
    );
  }
    return (
    <div>
      <h2 className="text-lg font-semibold mb-4">System Permissions</h2>
      <p className="mb-4 text-gray-600">
        Below is a comprehensive list of all permissions available in the system.
        Use this reference when assigning permissions to users or creating permission bundles.
      </p>
      
      {/* Search and filter tools */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select 
          value={domainFilter}
          onChange={handleDomainChange}
          className="max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Filter by domain</option>
          {domains.map(domain => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Results count */}
      <p className="text-sm text-gray-500 mb-2">
        Showing {filteredPermissions.length} of {permissions.length} permissions
      </p>
      
      {/* Permissions table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPermissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No permissions found matching your criteria
                </td>
              </tr>
            ) : filteredPermissions.map(permission => (
              <tr 
                key={permission.id} 
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-sm font-mono text-gray-900">
                  {permission.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{permission.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeClasses(permission.domain)}`}>
                    {permission.domain}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{permission.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper to assign consistent colors to permission domains
function getBadgeClasses(domain) {
  const colorMap = {
    ADMIN: 'bg-purple-100 text-purple-800',
    USERS: 'bg-blue-100 text-blue-800',
    LISTINGS: 'bg-green-100 text-green-800',
    MESSAGES: 'bg-cyan-100 text-cyan-800',
    REPORTS: 'bg-orange-100 text-orange-800',
    SETTINGS: 'bg-gray-100 text-gray-800',
    FINANCE: 'bg-yellow-100 text-yellow-800',
    INSPECTIONS: 'bg-teal-100 text-teal-800',
    ANALYTICS: 'bg-pink-100 text-pink-800'
  };
  
  return colorMap[domain] || 'bg-gray-100 text-gray-800';
}

export default AvailablePermissionsList;