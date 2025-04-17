import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

// Custom hook to handle hydration safely
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

export default function Listings() {
  const router = useRouter();
  const hasMounted = useHasMounted(); // Add this hook
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 9,
    pages: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    city: "",
    propertyType: "",
    listingType: "",
    minPrice: "",
    maxPrice: "",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Handle query params for filtering
  useEffect(() => {
    if (!router.isReady) return;

    const {
      search,
      city,
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      page,
    } = router.query;

    const newFilters = {
      search: search || "",
      city: city || "",
      propertyType: propertyType || "",
      listingType: listingType || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
    };

    setFilters(newFilters);
    setMeta((prev) => ({
      ...prev,
      page: parseInt(page) || 1,
    }));

    setHydrated(true);
  }, [router.isReady, router.query]);

  // Fetch listings when filters or pagination changes
  useEffect(() => {
    if (!hydrated) return;

    async function fetchListings() {
      try {
        setLoading(true);
        const startTime = Date.now();

        // Build query string from filters and pagination
        const queryParams = new URLSearchParams();
        queryParams.append("page", meta.page);
        queryParams.append("limit", meta.limit);

        if (filters.search) queryParams.append("search", filters.search);
        if (filters.city) queryParams.append("city", filters.city);
        if (filters.propertyType)
          queryParams.append("propertyType", filters.propertyType);
        if (filters.listingType)
          queryParams.append("listingType", filters.listingType);
        if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
        if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);

        // Fetch from the API
        const response = await fetch(
          `/api/mobile/listings?${queryParams.toString()}`
        );
        setResponseStatus(response.status);

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setListings(data.data);
          setMeta(data.meta);
          setError(null);
        } else {
          setError(data.error || "Failed to fetch listings");
        }

        setLastFetchTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setError(err.message);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [filters, meta.page, meta.limit, hydrated]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();

    // Update URL with filters
    const query = {};

    if (filters.search) query.search = filters.search;
    if (filters.city) query.city = filters.city;
    if (filters.propertyType) query.propertyType = filters.propertyType;
    if (filters.listingType) query.listingType = filters.listingType;
    if (filters.minPrice) query.minPrice = filters.minPrice;
    if (filters.maxPrice) query.maxPrice = filters.maxPrice;

    // Reset to page 1 when filtering
    query.page = 1;

    router.push({
      pathname: "/listings",
      query,
    });

    setShowFilters(false);
  };

  // Handle pagination
  const changePage = (newPage) => {
    router.push({
      pathname: "/listings",
      query: {
        ...router.query,
        page: newPage,
      },
    });
  };

  // Only render content after component has mounted on client
  if (!hasMounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Property Listings</h1>
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Property Listings | TopDial</title>
        <meta
          name="description"
          content="Browse our exclusive property listings across Nigeria"
        />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Property Listings</h1>

        {/* Filters */}
        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 mb-4 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
            Show Filters
          </button>

          {showFilters && (
            <form
              onSubmit={applyFilters}
              className="bg-white p-6 rounded-lg shadow-md mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status:
                  </label>
                  <select
                    name="listingType"
                    value={filters.listingType}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Any</option>
                    <option value="rent">For Rent</option>
                    <option value="sale">For Sale</option>
                    <option value="lease">For Lease</option>
                    <option value="shortlet">Shortlet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type:
                  </label>
                  <select
                    name="propertyType"
                    value={filters.propertyType}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Any</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                    <option value="office">Office Space</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City:
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="e.g., Lagos, Abuja"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price (₦):
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="Minimum price"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price (₦):
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="Maximum price"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search:
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search listings..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      search: "",
                      city: "",
                      propertyType: "",
                      listingType: "",
                      minPrice: "",
                      maxPrice: "",
                    });
                    router.push("/listings");
                  }}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-md"
                >
                  Apply Filters
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-800">Error: {error}</p>
            <p className="text-sm text-red-700 mt-2">
              Please try again or contact support if the issue persists.
            </p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && listings.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find more
              properties.
            </p>
            <button
              onClick={() => {
                setFilters({
                  search: "",
                  city: "",
                  propertyType: "",
                  listingType: "",
                  minPrice: "",
                  maxPrice: "",
                });
                router.push("/listings");
              }}
              className="text-amber-600 hover:text-amber-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Listings grid */}
        {!loading && !error && listings.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-700">
                Found: <span className="font-medium">{meta.total}</span>{" "}
                listings
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {listings.map((listing) => (
                <Link href={`/listings/${listing.id}`} key={listing.id}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
                    <div className="relative h-48">
                      {listing.imageUrl ? (
                        <Image
                          src={listing.imageUrl}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-12 h-12 text-gray-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-0 right-0 bg-amber-600 text-white px-3 py-1 m-4 rounded-full text-xs font-medium">
                        {listing.listingType === "rent"
                          ? "For Rent"
                          : listing.listingType === "sale"
                            ? "For Sale"
                            : listing.listingType === "lease"
                              ? "For Lease"
                              : "Shortlet"}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                        {listing.title}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                        <span className="text-sm line-clamp-1">
                          {listing.location}
                        </span>
                      </div>

                      <div className="flex justify-between mb-4">
                        <div className="flex items-center text-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                            />
                          </svg>
                          <span className="text-sm">
                            {listing.bedrooms} Beds
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            ₦{Number(listing.price).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t pt-4">
                        <span className="text-xs text-gray-500">
                          {listing.propertyType.charAt(0).toUpperCase() +
                            listing.propertyType.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex justify-center my-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => changePage(Math.max(1, meta.page - 1))}
                    disabled={meta.page === 1}
                    className={`px-3 py-1 rounded ${
                      meta.page === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Previous
                  </button>

                  <div className="px-3 py-1">
                    Page: <span className="font-medium">{meta.page}</span> of{" "}
                    <span className="font-medium">{meta.pages}</span>
                  </div>

                  <button
                    onClick={() =>
                      changePage(Math.min(meta.pages, meta.page + 1))
                    }
                    disabled={meta.page === meta.pages}
                    className={`px-3 py-1 rounded ${
                      meta.page === meta.pages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Debug information - visible in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-12 border-t pt-4 text-xs text-gray-500">
            <p>
              Page: {meta.page} of {meta.pages}
            </p>
            <p>Hydrated: {hydrated ? "Yes" : "No"}</p>
            <p>Last fetch: {lastFetchTime || "N/A"}</p>
            <p>Response status: {responseStatus || "N/A"}</p>
          </div>
        )}
      </div>
    </>
  );
}
