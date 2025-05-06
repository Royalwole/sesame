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
  const isHydrated = useHydration();

  // Fetch listings with proper hydration handling
  const fetchListings = useCallback(async () => {
    if (!isHydrated) return;

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/listings?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch listings');
      }

      setListings(data.listings);
      setTotalListings(data.total);
    } catch (err) {
      setError(err.message);
      setListings([]);
      setTotalListings(0);
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

      const response = await fetch('/api/listings/upload-images', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload images');
      }

      return data.images;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  // Handle image deletion
  const deleteImage = async (imagePath) => {
    try {
      const response = await fetch(`/api/listings/delete-image?path=${encodeURIComponent(imagePath)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete image');
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  // Update listing with new images
  const updateListingImages = async (listingId, newImages, existingImages = []) => {
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: [...existingImages, ...newImages]
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update listing images');
      }

      return data.listing;
    } catch (error) {
      console.error('Error updating listing images:', error);
      throw error;
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