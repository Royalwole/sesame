import { useEffect, useState } from 'react';
import ListingDebugTool from '../../components/debug/ListingDebugTool';
import { quickHealthCheck } from '../../lib/listing-debugger';

export default function ListingDebugPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  
  // Run a quick health check on page load
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await quickHealthCheck();
        setHealthStatus(status);
      } catch (error) {
        setHealthStatus({
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
    
    checkHealth();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Listing API Diagnostics</h1>
          <p className="mt-2 text-gray-600">
            Use this tool to diagnose and debug issues with the listing API functionality
          </p>
        </div>
        
        {healthStatus && (
          <div className={`mb-8 p-4 rounded-lg text-center ${
            healthStatus.healthy 
              ? 'bg-green-100 border border-green-300' 
              : 'bg-red-100 border border-red-300'
          }`}>
            <h2 className="text-lg font-medium">
              System Health Check: {' '}
              <span className={healthStatus.healthy ? 'text-green-600' : 'text-red-600'}>
                {healthStatus.healthy ? 'HEALTHY' : 'ISSUES DETECTED'}
              </span>
            </h2>
            {!healthStatus.healthy && healthStatus.error && (
              <p className="mt-2 text-red-700">{healthStatus.error}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
            </p>
          </div>
        )}
        
        <ListingDebugTool />
        
        <div className="mt-12 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">Common Issues</h3>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Authentication errors may occur if you are not signed in or your session has expired</li>
                <li>API timeouts can happen if the server is under heavy load</li>
                <li>Listing data may be unavailable if the database connection is experiencing issues</li>
                <li>Image loading issues may indicate problems with the storage provider</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">How to Fix</h3>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Try signing out and signing back in to refresh your authentication</li>
                <li>Clear your browser cache if you're seeing stale data</li>
                <li>If images aren't loading, check your network connection</li>
                <li>For persistent issues, contact the system administrator</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
