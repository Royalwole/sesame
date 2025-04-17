import { useState } from "react";
import Head from "next/head";
import { FiFilter, FiRefreshCw } from "react-icons/fi";
import { ListingsProvider, useListings } from "../../contexts/ListingsContext";
import ListingsGrid from "../../components/listings/ListingsGrid";
import ListingsFilter from "../../components/listings/ListingsFilter";
import Pagination from "../../components/common/Pagination";
import { getPublicListings } from "../../lib/listing-api";

// Main listings component (inside the provider)
function ListingsContent() {
  const [showFilters, setShowFilters] = useState(false);
  const { 
    listings, 
    loading, 
    error, 
    filters, 
    meta, 
    applyFilters, 
    changePage, 
    refreshListings 
  } = useListings();

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Property Listings</h1>
        <p className="mt-2 text-lg text-gray-600">
          Browse our curated selection of properties
        </p>
      </div>
      
      {/* Filters section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={toggleFilters}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
          >
            <FiFilter className="mr-2" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          
          <button
            onClick={refreshListings}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 disabled:opacity-50"
            aria-label="Refresh listings"
          >
            <FiRefreshCw className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <ListingsFilter initialFilters={filters} onApply={applyFilters} />
          </div>
        )}
      </div>
      
      {/* Listings grid */}
      <ListingsGrid listings={listings} loading={loading} error={error} />
      
      {/* Pagination */}
      {!loading && !error && listings.length > 0 && meta.pages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.pages}
            onPageChange={changePage}
          />
        </div>
      )}
      
      {/* Results count */}
      {!loading && !error && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {listings.length} of {meta.total} properties
        </div>
      )}
    </div>
  );
}

// Page component with data fetching
export default function ListingsPage({ initialData }) {
  return (
    <>
      <Head>
        <title>Property Listings | TopDial</title>
        <meta
          name="description"
          content="Browse our selection of properties for rent and sale"
        />
        <meta name="robots" content="index, follow" />
      </Head>
      
      <ListingsProvider initialData={initialData}>
        <ListingsContent />
      </ListingsProvider>
    </>
  );
}

// Server-side data fetching for initial render
export async function getServerSideProps({ query }) {
  try {
    // Extract filters from query params
    const { search, city, propertyType, listingType, minPrice, maxPrice, page = 1 } = query;
    const filters = {
      ...(search && { search }),
      ...(city && { city }),
      ...(propertyType && { propertyType }),
      ...(listingType && { listingType }),
      ...(minPrice && { minPrice }),
      ...(maxPrice && { maxPrice })
    };
    
    // Fetch initial data server-side to prevent hydration mismatch
    const result = await getPublicListings(filters, parseInt(page) || 1, 12);
    
    // Check if we got valid data
    const validListings = Array.isArray(result.listings);
    const validPagination = typeof result.pagination === 'object';
    
    return {
      props: {
        initialData: {
          listings: validListings ? result.listings : [],
          meta: validPagination ? {
            page: result.pagination.currentPage || 1,
            pages: result.pagination.totalPages || 1,
            total: result.pagination.total || 0,
            limit: result.pagination.limit || 12
          } : {
            page: 1,
            pages: 1,
            total: 0,
            limit: 12
          }
        }
      }
    };
  } catch (error) {
    // On error, return empty initial data
    console.error("Error in getServerSideProps for listings:", error);
    return {
      props: {
        initialData: {
          listings: [],
          meta: {
            page: 1,
            pages: 1, 
            total: 0,
            limit: 12
          }
        }
      }
    };
  }
}
