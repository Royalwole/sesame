import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";

/**
 * Custom hook for fetching and filtering property listings
 */
export function useFetchListings(initialFilters = {}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    total: 0,
  });

  // Add fetch attempt tracking
  const fetchAttempts = useRef(0);
  const maxAttempts = 3;

  // Track if component is mounted
  const isMounted = useRef(true);

  // Prevent excessive re-renders
  const fetchInProgress = useRef(false);

  // Debug info
  const debugInfo = useRef({
    lastFetchTime: null,
    responseStatus: null,
    responseData: null,
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Helper function to build query string from filters and pagination
  const buildQueryString = useCallback((filters, pagination) => {
    const params = new URLSearchParams();

    if (pagination) {
      if (pagination.currentPage) params.append("page", pagination.currentPage);
      if (pagination.limit) params.append("limit", pagination.limit);
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, value);
          }
        }
      });
    }

    return params.toString();
  }, []);

  // Function to fetch listings with improved error handling
  const fetchListings = useCallback(
    async (currentPage = 1) => {
      // Don't start a new fetch if one is already in progress or component unmounted
      if (fetchInProgress.current || !isMounted.current) return;

      // Clear any previous errors
      setError(null);
      fetchInProgress.current = true;
      setLoading(true);

      debugInfo.current.lastFetchTime = new Date().toISOString();
      fetchAttempts.current += 1;
      console.log(
        `[Listings] Fetch attempt ${fetchAttempts.current}, page ${currentPage}`
      );

      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(new Error("Fetch timeout"));
      }, 8000); // Reduced from 15000 to faster feedback

      try {
        const queryString = buildQueryString(filters, {
          page: currentPage,
          limit: pagination.limit,
        });

        console.log(`[Listings] Fetching with query: ${queryString}`);

        // Direct fetch (avoiding withCache middleware issues)
        const response = await fetch(
          `/api/listings?${queryString}&_cb=${Date.now()}`, // Always add cache buster
          {
            signal: controller.signal,
            headers: {
              "Cache-Control": "no-cache, no-store",
              Pragma: "no-cache",
            },
          }
        );

        // Track response status for debugging
        debugInfo.current.responseStatus = response.status;
        console.log(`[Listings] Response status: ${response.status}`);

        clearTimeout(timeoutId);

        if (!isMounted.current) {
          fetchInProgress.current = false;
          return;
        }

        // Handle non-OK responses
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        debugInfo.current.responseData = data;

        console.log(
          `[Listings] Fetch successful, got ${
            data.listings?.length || 0
          } listings`
        );

        if (isMounted.current) {
          // Reset fetch attempts on success
          fetchAttempts.current = 0;

          // Ensure we have an array even if API returned null/undefined
          const safeListings = Array.isArray(data.listings)
            ? data.listings
            : [];

          // Set listings - critical fix! Make sure this runs
          setListings(safeListings);
          console.log(
            "[Listings] State updated with",
            safeListings.length,
            "listings"
          );

          // Use fallback pagination if missing
          setPagination({
            currentPage: data.pagination?.currentPage || 1,
            totalPages: data.pagination?.totalPages || 1,
            limit: data.pagination?.limit || 10,
            total: data.pagination?.total || safeListings.length,
          });

          // Always set loading to false on success
          setLoading(false);
        }
      } catch (error) {
        clearTimeout(timeoutId);

        if (!isMounted.current) {
          fetchInProgress.current = false;
          return;
        }

        console.error("[Listings] Error fetching listings:", error);

        // Set appropriate error message
        let errorMessage = "Failed to load listings";
        if (error.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection.";
        }

        setError(errorMessage);

        // Use mock data as fallback on error
        const mockListings = getMockListings();
        setListings(mockListings);
        console.log(
          "[Listings] Using mock data due to error, count:",
          mockListings.length
        );

        // Update pagination with mock data
        setPagination({
          currentPage: 1,
          totalPages: 1,
          limit: mockListings.length,
          total: mockListings.length,
        });

        // Show toast only on complete failure (all attempts)
        if (fetchAttempts.current >= maxAttempts) {
          toast.error("Could not load listings. Using fallback data.");
        }
      } finally {
        // Always ensure loading state is turned off
        if (isMounted.current) {
          setLoading(false);
        }
        fetchInProgress.current = false;
      }
    },
    [filters, pagination.limit, buildQueryString]
  );

  // Fix dependency array and use a timeout to avoid fetch on hot reload
  useEffect(() => {
    // Only run on client-side to prevent hydration issues
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      if (isMounted.current) {
        console.log("[Listings] Initial fetch triggered");
        fetchListings(pagination.currentPage);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [fetchListings, pagination.currentPage, filters]);

  // Mock data for development/fallback
  const getMockListings = () => {
    return [
      {
        _id: "mock1",
        title: "Modern 3 Bedroom Apartment",
        price: 250000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1400,
        location: { city: "Lagos", state: "Lagos" },
        images: ["/images/sample-property-1.jpg"],
        type: "apartment",
      },
      {
        _id: "mock2",
        title: "Spacious 4 Bedroom Villa",
        price: 450000,
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2200,
        location: { city: "Abuja", state: "FCT" },
        images: ["/images/sample-property-2.jpg"],
        type: "house",
      },
      {
        _id: "mock3",
        title: "Cozy 2 Bedroom Townhouse",
        price: 180000,
        bedrooms: 2,
        bathrooms: 1.5,
        squareFeet: 1100,
        location: { city: "Port Harcourt", state: "Rivers" },
        images: ["/images/sample-property-3.jpg"],
        type: "townhouse",
      },
    ];
  };

  // Public API functions
  const applyFilters = useCallback((newFilters) => {
    console.log("[Listings] Applying new filters:", newFilters);
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const goToPage = useCallback((page) => {
    console.log("[Listings] Going to page:", page);
    setPagination((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const refreshListings = useCallback(() => {
    console.log("[Listings] Manual refresh triggered");
    if (typeof window !== "undefined" && !fetchInProgress.current) {
      fetchAttempts.current = 0;
      fetchListings(pagination.currentPage);
    }
  }, [fetchListings, pagination.currentPage]);

  return {
    listings: listings || [],
    loading,
    error,
    filters,
    pagination,
    applyFilters,
    goToPage,
    refreshListings,
    debug: debugInfo.current,
  };
}
