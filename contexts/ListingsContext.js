import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { fetchJSON } from '../lib/fetchUtils';

// Create the context
const ListingsContext = createContext();

/**
 * Custom hook to access the listings context
 */
export const useListings = () => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
};

/**
 * Normalize listings data to ensure consistent structure
 * This helps prevent hydration mismatches between SSR and client
 */
const normalizeListings = (data) => {
  // Ensure listings is an array
  const listings = Array.isArray(data?.listings) ? data.listings : [];
  
  // Ensure pagination/meta has consistent structure
  const pagination = {
    page: data?.pagination?.currentPage || data?.meta?.page || 1,
    pages: data?.pagination?.totalPages || data?.meta?.pages || 1,
    total: data?.pagination?.total || data?.meta?.total || 0,
    limit: data?.pagination?.limit || data?.meta?.limit || 12
  };
  
  return { listings, pagination };
};

/**
 * Listings Provider Component - handles all listings data fetching and state
 */
export const ListingsProvider = ({ children, initialData = {} }) => {
  const router = useRouter();
  
  // Use strict refs to track initialization state
  const isInitialRender = useRef(true);
  const isServerInitialized = useRef(!!initialData.listings);
  const isRouterReady = useRef(false);
  
  // Normalize initial data to ensure consistent structure
  const normalizedInitial = normalizeListings(initialData);
  
  // Initialize state with normalized server-side data
  const [listings, setListings] = useState(normalizedInitial.listings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(normalizedInitial.pagination);

  // Extract initial filters from router query or use empty defaults
  const defaultFilters = {
    search: '',
    city: '',
    propertyType: '',
    listingType: '',
    minPrice: '',
    maxPrice: '',
  };
  
  const [filters, setFilters] = useState(defaultFilters);
  
  // Track if component is mounted on client
  const isMounted = useRef(false);
  
  // Function to build query string from filters
  const buildQueryParams = useCallback((currentFilters, currentPage = 1) => {
    const params = new URLSearchParams();
    
    // Add page number
    if (currentPage > 1) {
      params.append('page', currentPage.toString());
    }
    
    // Add all non-empty filters
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value.toString());
      }
    });
    
    return params.toString();
  }, []);

  // Safe state update function that checks if component is mounted
  const safeSetState = useCallback((setter, value) => {
    if (isMounted.current) {
      setter(value);
    }
  }, []);

  // Function to fetch listings based on current filters and page
  const fetchListings = useCallback(async (currentFilters = filters, page = meta.page) => {
    if (!isMounted.current) return;
    
    try {
      safeSetState(setLoading, true);
      safeSetState(setError, null);

      // Build query string
      const queryParams = buildQueryParams(currentFilters, page);
      const url = `/api/listings?${queryParams}`;
      
      // Add cache buster to avoid stale data
      const cacheBuster = `_cb=${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const separator = url.includes('?') ? '&' : '?';
      const urlWithCache = `${url}${separator}${cacheBuster}`;
      
      console.log(`Fetching listings from: ${urlWithCache}`);
      
      // Fetch with improved error handling
      const data = await fetchJSON(urlWithCache);
      
      if (!isMounted.current) return;
      
      // Normalize response to ensure consistent structure
      const normalizedData = normalizeListings(data);
      
      // Update state with normalized data
      safeSetState(setListings, normalizedData.listings);
      safeSetState(setMeta, normalizedData.pagination);
      
      // Show toast for fallback data
      if (data.fallback && typeof window !== 'undefined') {
        toast(data.message || 'Using fallback data', {
          icon: '⚠️',
          style: {
            borderRadius: '10px',
            background: '#FFF0C2',
            color: '#664D03',
          },
        });
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      console.error('Error fetching listings:', err);
      safeSetState(setError, err.message || 'Failed to load listings');
      
      // Show toast only on client
      if (typeof window !== 'undefined') {
        toast.error(err.message || 'Failed to load listings');
      }
    } finally {
      if (isMounted.current) {
        safeSetState(setLoading, false);
      }
    }
  }, [filters, meta.page, buildQueryParams, safeSetState]);

  // Apply new filters and refresh listings
  const applyFilters = useCallback((newFilters) => {
    if (!isMounted.current) return;
    
    // Merge with existing filters (this allows partial updates)
    const updatedFilters = { ...filters, ...newFilters };
    safeSetState(setFilters, updatedFilters);
    
    // Update URL to reflect new filters
    const queryParams = buildQueryParams(updatedFilters, 1); // Reset to page 1
    router.push(`/listings?${queryParams}`, undefined, { shallow: true });
    
    // Fetch listings with new filters
    fetchListings(updatedFilters, 1);
  }, [filters, router, buildQueryParams, fetchListings, safeSetState]);

  // Change page
  const changePage = useCallback((newPage) => {
    if (!isMounted.current || newPage === meta.page) return;
    
    // Update URL with new page
    const queryParams = buildQueryParams(filters, newPage);
    router.push(`/listings?${queryParams}`, undefined, { shallow: true });
    
    // Fetch listings for new page
    fetchListings(filters, newPage);
  }, [filters, meta.page, router, buildQueryParams, fetchListings]);

  // Refresh listings
  const refreshListings = useCallback(() => {
    if (!isMounted.current) return;
    fetchListings(filters, meta.page);
  }, [filters, meta.page, fetchListings]);

  // Initialize from URL when router is ready
  useEffect(() => {
    if (!router.isReady) return;
    
    // Mark router as ready for subsequent processing
    isRouterReady.current = true;
    
    // Only process URL parameters on client after hydration
    if (typeof window !== 'undefined' && isMounted.current) {
      // Extract filters and page from URL
      const {
        search,
        city,
        propertyType,
        listingType,
        minPrice,
        maxPrice,
        page
      } = router.query;
      
      // Update filters state from URL parameters
      const urlFilters = {
        search: search || '',
        city: city || '',
        propertyType: propertyType || '',
        listingType: listingType || '',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
      };
      
      // Update filters without triggering a fetch yet
      safeSetState(setFilters, urlFilters);
    }
  }, [router.isReady, router.query, safeSetState]);
  
  // Mark as mounted and handle client-side initialization
  useEffect(() => {
    // Mark as mounted on client
    isMounted.current = true;
    
    // Client-side initialization logic
    if (isInitialRender.current && isRouterReady.current) {
      isInitialRender.current = false;
      
      // If we have server data, don't fetch immediately to avoid hydration issues
      if (isServerInitialized.current && listings.length > 0) {
        console.log('Using server-initialized data, skipping initial fetch');
      } else {
        // No server data, safe to fetch
        const {
          search,
          city,
          propertyType,
          listingType,
          minPrice,
          maxPrice,
          page
        } = router.query;
        
        // Build filters from URL
        const urlFilters = {
          search: search || '',
          city: city || '',
          propertyType: propertyType || '',
          listingType: listingType || '',
          minPrice: minPrice || '',
          maxPrice: maxPrice || '',
        };
        
        // Update filters and fetch data
        safeSetState(setFilters, urlFilters);
        fetchListings(
          urlFilters,
          page ? parseInt(page, 10) : 1
        );
      }
    }
    
    // Cleanup function to mark component as unmounted
    return () => {
      isMounted.current = false;
    };
  }, [router.isReady, router.query, fetchListings, listings.length, safeSetState]);

  // Context value - ensure consistent interface
  const value = {
    listings,
    loading,
    error,
    filters,
    meta,
    applyFilters,
    changePage,
    refreshListings,
    isClient: isMounted.current
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};