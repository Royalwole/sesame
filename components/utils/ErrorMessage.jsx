import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function ErrorMessage({ 
  message = 'An error occurred', 
  details,
  retry
}) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-700 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <FiAlertCircle className="h-5 w-5 text-red-500" />
        </div>
        
        <div className="ml-3">
          <h3 className="font-medium">{message}</h3>
          
          {details && (
            <div className="mt-2 text-sm">
              {typeof details === 'string' ? (
                <p>{details}</p>
              ) : (
                <pre className="whitespace-pre-wrap">{JSON.stringify(details, null, 2)}</pre>
              )}
            </div>
          )}
          
          {retry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FiRefreshCw className="mr-1.5 -ml-0.5 h-4 w-4" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
