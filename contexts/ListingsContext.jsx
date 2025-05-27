import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { fetchJSON } from '../lib/fetchUtils';
import { useHydration } from '../lib/useHydration';

// Create the context
const ListingsContext = createContext({
  listings: [],
  isLoading: true,
  error: null,
  totalListings: 0,
  filters: {},
  setFilters: () => {},
  refetchListings: () => {},
  uploadImages: () => {},
  deleteImage: () => {},
  updateListingImages: () => {},
});

/**
 * Custom hook to access the listings context
 */
export const useListings = () => {
  const context = useContext(ListingsContext);
  if (context === undefined) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
};

/**
 * Listings Provider Component - handles all listings data fetching and state
 */
export const ListingsProvider = ({ children, initialListings = [] }) => {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalListings, setTotalListings] = useState(0);
  const [filters, setFilters] = useState({});
  const isHydrated = useHydration();  // Fetch listings with proper hydration handling
  const fetchListings = useCallback(async () => {
    if (!isHydrated) {
      console.log('[ListingsContext] Not hydrated yet, skipping fetch');
      return;
    }

    console.log('[ListingsContext] Starting fetchListings with filters:', filters);

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams(filters).toString();
      const url = `/api/listings${queryParams ? `?${queryParams}` : ''}`;
      
      console.log('[ListingsContext] Fetching URL:', url);
      
      // Use the imported fetchJSON utility for consistent error handling
      const data = await fetchJSON(url, {
        timeout: 15000,
        retries: 2,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-Source': 'listings-context',
        }
      });

      console.log('[ListingsContext] Raw API response:', data);

      // Check if the response indicates success
      if (!data.success) {
        console.error('[ListingsContext] API returned error:', data.message);
        throw new Error(data.message || 'Failed to fetch listings');
      }

      // Ensure we always have valid arrays
      const safeListings = Array.isArray(data.listings) ? data.listings : [];
      console.log('[ListingsContext] Processing listings:', {
        rawListings: data.listings,
        safeListings,
        count: safeListings.length,
        pagination: data.pagination,
        total: data.total
      });
      
      setListings(safeListings);
      setTotalListings(data.pagination?.total || data.total || safeListings.length);
    } catch (err) {
      console.error('[ListingsContext] Error fetching listings:', err);
      setError(err.message || 'Failed to load listings');
      setListings([]);
      setTotalListings(0);
      
      // Show user-friendly error message
      toast.error('Could not load listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isHydrated]);

  // Refetch handler
  const refetchListings = useCallback(() => {
    if (isHydrated) {
      fetchListings();
    }
  }, [fetchListings, isHydrated]);
  // Handle image upload
  const uploadImages = async (files, folder = 'listings') => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('folder', folder);

      // Add upload identifier to help with debugging
      formData.append('uploadId', `upload-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);

      // Use enhanced fetch with timeout
      const { fetchWithTimeout } = await import('../lib/fetch-with-timeout');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout for uploads
      
      const response = await fetchWithTimeout('/api/listings/upload-images', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }, 30000);
      
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload images');
      }

      return data.images;
    } catch (error) {
      console.error('Error uploading images:', error);
      // Show user-friendly error message
      toast.error(`Failed to upload images: ${error.message || 'Network error'}`);
      throw error;
    }
  };
  // Handle image deletion
  const deleteImage = async (imagePath) => {
    if (!imagePath) {
      console.error('No image path provided for deletion');
      return false;
    }
    
    try {
      // Add deletion ID for tracking issues
      const deletionId = `delete-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const encodedPath = encodeURIComponent(imagePath);
      
      // Use enhanced fetch with timeout
      const { fetchWithTimeout } = await import('../lib/fetch-with-timeout');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      const response = await fetchWithTimeout(
        `/api/listings/delete-image?path=${encodedPath}&deletionId=${deletionId}`, 
        {
          method: 'DELETE',
          headers: {
            'Cache-Control': 'no-cache',
            'X-Deletion-ID': deletionId
          },
          signal: controller.signal
        }, 
        15000
      );
      
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete image');
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      // Show user-friendly error message
      toast.error(`Failed to delete image: ${error.message || 'Network error'}`);
      return false;
    }
  };
  // Update listing with new images
  const updateListingImages = async (listingId, newImages, existingImages = []) => {
    if (!listingId) {
      console.error('No listing ID provided for image update');
      toast.error('Cannot update images: Missing listing information');
      return null;
    }
    
    try {
      // Add update ID for tracking issues
      const updateId = `update-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Ensure we have arrays to work with
      const safeNewImages = Array.isArray(newImages) ? newImages : [];
      const safeExistingImages = Array.isArray(existingImages) ? existingImages : [];
      
      // Use enhanced fetch with timeout
      const { fetchWithTimeout } = await import('../lib/fetch-with-timeout');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      const response = await fetchWithTimeout(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Update-ID': updateId
        },
        body: JSON.stringify({
          images: [...safeExistingImages, ...safeNewImages],
          updateId
        }),
        signal: controller.signal
      }, 15000);
      
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update listing images');
      }

      return data.listing;
    } catch (error) {
      console.error('Error updating listing images:', error);
      // Show user-friendly error message
      toast.error(`Failed to update listing images: ${error.message || 'Network error'}`);
      return null;
    }
  };

  // Initial fetch and filter changes
  useEffect(() => {
    if (isHydrated) {
      fetchListings();
    }
  }, [fetchListings, isHydrated]);

  // During SSR or before hydration, return initial state
  if (!isHydrated) {
    return (
      <ListingsContext.Provider
        value={{
          listings: initialListings,
          isLoading: true,
          error: null,
          totalListings: initialListings.length,
          filters: {},
          setFilters: () => {},
          refetchListings: () => {},
          uploadImages: () => {},
          deleteImage: () => {},
          updateListingImages: () => {},
        }}
      >
        {children}
      </ListingsContext.Provider>
    );
  }

  return (
    <ListingsContext.Provider
      value={{
        listings,
        isLoading,
        error,
        totalListings,
        filters,
        setFilters,
        refetchListings,
        uploadImages,
        deleteImage,
        updateListingImages,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
};