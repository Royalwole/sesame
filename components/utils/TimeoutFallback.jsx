import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

/**
 * Component that displays when an operation times out
 */
export default function TimeoutFallback({ 
  message = "Loading took too long", 
  onRetry, 
  timeout = 30000, // 30 seconds default
  showRetryAfter = 10000, // Show retry button after 10 seconds
}) {
  const [showRetry, setShowRetry] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Show retry button after delay
  useEffect(() => {
    const retryTimer = setTimeout(() => {
      setShowRetry(true);
    }, showRetryAfter);
    
    // Show timeout message after timeout
    const timeoutTimer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);
    
    return () => {
      clearTimeout(retryTimer);
      clearTimeout(timeoutTimer);
    };
  }, [showRetryAfter, timeout]);
  
  // Handle retry click
  const handleRetry = () => {
    if (onRetry && !isRetrying) {
      setIsRetrying(true);
      
      // Reset UI state
      setShowTimeout(false);
      
      try {
        onRetry();
      } catch (error) {
        console.error("Retry error:", error);
      } finally {
        // Allow retries again after a delay
        setTimeout(() => {
          setIsRetrying(false);
        }, 3000);
      }
    }
  };
  
  // Early loading indicator
  if (!showTimeout) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
          <div className="w-16 h-16 rounded-full border-4 border-t-blue-600 animate-spin absolute top-0 left-0"></div>
        </div>
        <h2 className="mt-6 text-xl font-medium text-gray-700">Loading...</h2>
        
        {showRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw className={`mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>
        )}
      </div>
    );
  }
  
  // Timeout message
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto mt-10 text-center">
      <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100">
        <FiAlertCircle className="h-8 w-8 text-red-600" />
      </div>
      
      <h2 className="mt-4 text-lg font-medium text-gray-900">
        {message}
      </h2>
      
      <p className="mt-2 text-gray-600">
        This could be due to a slow connection or server issues. Please try again.
      </p>
      
      <div className="mt-6">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300"
        >
          <FiRefreshCw className={`mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? "Retrying..." : "Refresh Page"}
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="mt-3 inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
}
