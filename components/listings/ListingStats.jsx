import { FiRefreshCw } from 'react-icons/fi';
import { useListingStats } from '../hooks/useListingStats';

export default function ListingStats({ listingId, showRefresh = false }) {
  const { views, inquiries, isLoading, error, refreshStats } = useListingStats(listingId);

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <span className="text-sm text-gray-500 mr-1">Views:</span>
        <span className="text-sm font-medium">{views}</span>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-500 mr-1">Inquiries:</span>
        <span className="text-sm font-medium">{inquiries}</span>
      </div>
      {showRefresh && (
        <button
          onClick={refreshStats}
          disabled={isLoading}
          className={`p-1 rounded-full hover:bg-gray-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Refresh stats"
        >
          <FiRefreshCw className={`h-4 w-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      )}
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  );
}