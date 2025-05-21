// A simple error boundary component specifically for the Agent Dashboard
// This component will catch loading issues and provide a recovery path

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AgentDashboardErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const router = useRouter();

  // Check for stalled loading
  useEffect(() => {
    // Set a timeout to detect if the loading takes too long
    const loadingTimeout = setTimeout(() => {
      // If we're still on the page after this time, something might be wrong
      setLoadingTooLong(true);
    }, 5000); // 5 seconds

    return () => clearTimeout(loadingTimeout);
  }, []);

  // Error handler
  useEffect(() => {
    const handleError = (error, errorInfo) => {
      setHasError(true);
      setErrorDetails({
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack
      });
      console.error('Agent Dashboard Error:', error, errorInfo);
    };

    // Add global error handler
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Reset method
  const handleReset = () => {
    // Clear localStorage caches
    localStorage.removeItem('td_user_cache');
    localStorage.removeItem('td_permissions');
    
    // Redirect to the fix page
    router.push('/dashboard/fix-agent-dashboard');
  };

  // If there's an error or loading is taking too long, show helper UI
  if (hasError || loadingTooLong) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center p-6 z-50">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-md w-full">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-4">
            {hasError ? 'Something went wrong' : 'Taking too long to load?'}
          </h2>
          
          <p className="mb-4 text-gray-600">
            {hasError 
              ? 'The agent dashboard encountered an error. This could be due to authentication or data loading issues.'
              : 'The agent dashboard seems to be taking longer than expected to load. This might be due to authentication issues.'}
          </p>
          
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Fix Dashboard Issues
            </button>
            
            <a
              href="/fix-permission-cache"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-center"
            >
              Clear Permission Cache
            </a>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Refresh Page
            </button>
          </div>
          
          {hasError && errorDetails && (
            <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600 overflow-auto max-h-32">
              <p className="font-bold">Error: {errorDetails.message}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
}
