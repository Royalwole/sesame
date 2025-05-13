import React, { useState } from 'react';
import { Button, Card, Text, Alert, Spinner, Badge } from '../ui';

/**
 * Role Verification Tool Component
 * Provides an interface for admins to verify and fix role consistency
 */
export default function RoleVerificationTool() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  /**
   * Run verification without fixing inconsistencies
   */
  const runVerification = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/verify-roles');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to verify roles');
      }
      
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Run verification and fix inconsistencies
   */
  const runFixes = async () => {
    if (!confirm('Are you sure you want to fix all role inconsistencies? This will update Clerk metadata for affected users.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/verify-roles', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fix roles');
      }
      
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render status badges
   */
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'consistent':
        return <Badge color="green">Consistent</Badge>;
      case 'inconsistent':
        return <Badge color="red">Inconsistent</Badge>;
      case 'fixed':
        return <Badge color="blue">Fixed</Badge>;
      case 'error':
        return <Badge color="orange">Error</Badge>;
      case 'missing-clerk-id':
        return <Badge color="gray">No Clerk ID</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <Text variant="h3">User Role Verification Tool</Text>
        <Text className="text-gray-600">
          Verify and fix inconsistencies between user roles in MongoDB and Clerk
        </Text>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="flex gap-3 mb-6">
        <Button 
          onClick={runVerification} 
          disabled={loading}
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Verify Roles
        </Button>
        
        <Button 
          onClick={runFixes} 
          disabled={loading}
          variant="secondary"
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Fix Inconsistencies
        </Button>
      </div>

      {results && (
        <div className="mt-4">
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Text className="text-sm text-gray-500">Total Users</Text>
                <Text className="text-lg font-medium">{results.total}</Text>
              </div>
              <div>
                <Text className="text-sm text-gray-500">Consistent Roles</Text>
                <Text className="text-lg font-medium text-green-600">{results.consistent}</Text>
              </div>
              <div>
                <Text className="text-sm text-gray-500">Inconsistent Roles</Text>
                <Text className="text-lg font-medium text-red-600">{results.inconsistent}</Text>
              </div>
              <div>
                <Text className="text-sm text-gray-500">Missing Clerk IDs</Text>
                <Text className="text-lg font-medium text-gray-600">{results.missing}</Text>
              </div>
              {results.fixed > 0 && (
                <div>
                  <Text className="text-sm text-gray-500">Fixed</Text>
                  <Text className="text-lg font-medium text-blue-600">{results.fixed}</Text>
                </div>
              )}
              {results.errors > 0 && (
                <div>
                  <Text className="text-sm text-gray-500">Errors</Text>
                  <Text className="text-lg font-medium text-orange-600">{results.errors}</Text>
                </div>
              )}
            </div>
          </div>

          {results.details && results.details.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <Text className="font-medium">Detailed Results</Text>
                <Button 
                  variant="text" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {showDetails && (
                <div className="mt-2 max-h-96 overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DB Role</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clerk Role</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.details.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.userId}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            {renderStatusBadge(item.status)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.dbRole || item.role || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.clerkRole || item.role || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}