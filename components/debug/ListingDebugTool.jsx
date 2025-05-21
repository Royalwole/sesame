import React, { useState, useEffect } from 'react';
import { getPublicListings, getListingById } from '../../lib/listing-api-wrapper';
import { debugListingApi } from '../../lib/listing-debugger';

/**
 * Component to test listing functionality
 */
export default function ListingDebugComponent() {
  const [debugResults, setDebugResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listingId, setListingId] = useState('');
  
  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await debugListingApi(listingId || null);
      setDebugResults(results);
    } catch (err) {
      setError(err.message || 'An unknown error occurred');
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format a test result status with appropriate styling
  const formatStatus = (status) => {
    const statusColors = {
      success: 'text-green-600',
      warning: 'text-amber-500',
      failed: 'text-red-600'
    };
    
    return <span className={statusColors[status] || 'text-gray-700'}>{status}</span>;
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Listing API Debug Tool</h1>
      
      <div className="mb-6 flex space-x-4 items-end">
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test with Listing ID (Optional)
          </label>
          <input
            type="text"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="Enter a listing ID to test specific listing"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className={`px-4 py-2 font-medium rounded ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Running Tests...' : 'Run Diagnostic Tests'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {debugResults && (
        <div className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Test Results</h2>
            <p className={`font-medium ${debugResults.success ? 'text-green-600' : 'text-red-600'}`}>
              {debugResults.summary}
            </p>
            <p className="text-gray-500 text-sm">
              Timestamp: {debugResults.timestamp}
            </p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Test Details</h3>
            <div className="overflow-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-100 border-b text-left">Test</th>
                    <th className="py-2 px-4 bg-gray-100 border-b text-left">Status</th>
                    <th className="py-2 px-4 bg-gray-100 border-b text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(debugResults.tests).map((testKey) => {
                    const test = debugResults.tests[testKey];
                    return (
                      <tr key={testKey} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">{test.name}</td>
                        <td className="py-2 px-4">{formatStatus(test.status)}</td>
                        <td className="py-2 px-4">
                          <p>{test.details}</p>
                          {test.error && (
                            <p className="text-red-600 text-sm mt-1">{test.error}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {debugResults.errors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Errors Found</h3>
              <ul className="list-disc pl-5 space-y-1">
                {debugResults.errors.map((error, index) => (
                  <li key={index} className="text-red-600">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
