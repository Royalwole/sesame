import { useState, useEffect } from "react";

export function useListingStats(listingId) {
  const [stats, setStats] = useState({
    views: 0,
    inquiries: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Function to fetch current stats
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}/stats`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch stats");
        }

        setStats((prev) => ({
          ...prev,
          views: data.views,
          inquiries: data.inquiries,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        console.error("Error fetching listing stats:", error);
        setStats((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    };

    // Initial fetch
    if (listingId) {
      fetchStats();
    }

    // Set up polling for updates every 30 seconds
    const pollInterval = setInterval(fetchStats, 30000);

    // Cleanup
    return () => clearInterval(pollInterval);
  }, [listingId]);

  // Function to manually refresh stats
  const refreshStats = async () => {
    setStats((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`/api/listings/${listingId}/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refresh stats");
      }

      setStats({
        views: data.views,
        inquiries: data.inquiries,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error refreshing stats:", error);
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  };

  return {
    ...stats,
    refreshStats,
  };
}
