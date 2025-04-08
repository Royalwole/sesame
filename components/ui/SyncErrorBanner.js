import { useState } from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

export default function SyncErrorBanner({ error, onRetry }) {
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle retry with loading state
  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      // Set a timeout to avoid flickering if the retry is very fast
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 py-2">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center text-amber-800">
          <FiAlertCircle className="flex-shrink-0 mr-2" />
          <p className="text-sm">
            {error === "Error syncing user data"
              ? "We're having trouble syncing your account data."
              : error}
          </p>
        </div>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded flex items-center disabled:opacity-50"
        >
          <FiRefreshCw className={`mr-1 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Syncing..." : "Retry"}
        </button>
      </div>
    </div>
  );
}
