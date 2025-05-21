// Helper component that detects and resolves dashboard loading issues
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const LoadingHelper = ({ isLoading, threshold = 8000 }) => {
  const [showHelper, setShowHelper] = useState(false);
  const router = useRouter();

  // Show helper after threshold time if still loading
  useEffect(() => {
    let timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowHelper(true);
      }, threshold);
    } else {
      setShowHelper(false);
    }

    return () => clearTimeout(timeout);
  }, [isLoading, threshold]);

  if (!showHelper) return null;

  // The URL path to visit to fix the issue
  const fixPath = `/dashboard/fix-agent`;

  // The URL to bypass loading issues directly
  const bypassPath = `/dashboard/agent/bypass`;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 max-w-xs border border-yellow-200">
      <h4 className="font-medium text-gray-800 mb-2">
        Loading taking too long?
      </h4>
      <p className="text-sm text-gray-600 mb-3">
        The dashboard seems to be stuck loading. Try one of these options to
        resolve the issue.
      </p>
      <div className="space-y-2">
        <a
          href={fixPath}
          className="block w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          Fix Dashboard Issues
        </a>
        <a
          href={bypassPath}
          className="block w-full py-1.5 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded transition-colors"
        >
          Bypass Loading
        </a>
        <button
          onClick={() => window.location.reload()}
          className="block w-full py-1.5 px-3 bg-transparent hover:bg-gray-100 text-gray-600 text-sm font-medium border border-gray-300 rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default LoadingHelper;
