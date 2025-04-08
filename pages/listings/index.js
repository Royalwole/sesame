import { useState, useEffect } from "react";
import Head from "next/head";
import { useFetchListings } from "../../components/hooks/useFetchListings";
import ListingsGrid from "../../components/listings/ListingsGrid";
import Pagination from "../../components/common/Pagination";
import ListingsFilter from "../../components/listings/ListingsFilter";
import { useHydration } from "../../lib/useHydration";

export default function ListingsPage() {
  const hasHydrated = useHydration();
  const [showFilters, setShowFilters] = useState(false);
  const {
    listings,
    loading,
    error,
    pagination,
    applyFilters,
    goToPage,
    refreshListings,
    debug,
  } = useFetchListings();

  // Track if initial fetch completed
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Debug logs to help track state transitions
  useEffect(() => {
    console.log("ListingsPage state:", {
      loading,
      error,
      listingsCount: listings?.length || 0,
      hasHydrated,
    });

    if (!loading && hasHydrated) {
      setInitialFetchDone(true);
    }
  }, [loading, listings, hasHydrated, error]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <>
      <Head>
        <title>Property Listings | TopDial</title>
        <meta
          name="description"
          content="Browse our selection of properties for sale and rent"
        />
      </Head>

      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Property Listings
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={toggleFilters}
                className="text-blue-600 hover:text-blue-800 px-4 py-2 border border-blue-600 rounded-md text-sm"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              {!loading && initialFetchDone && (
                <button
                  onClick={refreshListings}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-md text-sm"
                  data-testid="refresh-button"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
              <ListingsFilter onApplyFilters={applyFilters} />
            </div>
          )}

          {/* Debug info in development - always visible to help debug */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 p-2 bg-yellow-50 text-xs text-yellow-800 rounded">
              <p>
                <strong>Status:</strong>{" "}
                {loading ? "Loading..." : error ? "Error" : "Loaded"}
              </p>
              <p>
                <strong>Found:</strong> {listings?.length || 0} listings
              </p>
              <p>
                <strong>Page:</strong> {pagination?.currentPage || 1} of{" "}
                {pagination?.totalPages || 1}
              </p>
              <p>
                <strong>Hydrated:</strong> {hasHydrated ? "Yes" : "No"}
              </p>
              {debug && (
                <div className="mt-1 pt-1 border-t border-yellow-200">
                  <p>
                    <strong>Last fetch:</strong> {debug.lastFetchTime || "N/A"}
                  </p>
                  <p>
                    <strong>Response status:</strong>{" "}
                    {debug.responseStatus || "N/A"}
                  </p>
                  {error && (
                    <p>
                      <strong>Error:</strong> {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mb-8">
            <ListingsGrid
              listings={listings}
              loading={loading}
              error={error}
              data-testid="listings-grid"
            />
          </div>

          {hasHydrated &&
            pagination &&
            pagination.totalPages > 1 &&
            !loading && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={goToPage}
                data-testid="pagination"
              />
            )}
        </div>
      </main>
    </>
  );
}

// Use getServerSideProps to ensure we have initial listings data
export async function getServerSideProps() {
  // We'll let client-side fetch handle the data for now
  // but this function ensures Next.js knows this is a server-rendered page
  return {
    props: {},
  };
}
