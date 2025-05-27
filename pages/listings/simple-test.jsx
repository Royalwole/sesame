import { useState } from "react";
import Head from "next/head";
import { getPublicListings } from "../../lib/listing-api";

// Simple test component without context
function SimpleListingsTest({ initialData }) {
  console.log('SimpleListingsTest rendered with initialData:', {
    hasListings: !!initialData.listings,
    listingsCount: initialData.listings?.length || 0,
    firstListing: initialData.listings?.[0]?.title || 'No listings'
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Simple Listings Test | TopDial</title>
      </Head>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple Listings Test</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <p>Initial data provided: {initialData ? 'Yes' : 'No'}</p>
        <p>Listings count: {initialData.listings?.length || 0}</p>
        <p>Total from meta: {initialData.meta?.total || 0}</p>
      </div>
      
      {initialData.listings && initialData.listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialData.listings.map((listing, index) => (
            <div key={listing._id || index} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
              <p className="text-gray-600 mb-2">₦{listing.price?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{listing.city}, {listing.state}</p>
              <p className="text-sm text-gray-500">Status: {listing.status}</p>
              <p className="text-sm text-gray-500">Images: {listing.images?.length || 0}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No listings found</p>
        </div>
      )}
    </div>
  );
}

export default SimpleListingsTest;

// Server-side data fetching
export async function getServerSideProps({ query }) {
  console.log('getServerSideProps called for simple test');
  
  try {
    const result = await getPublicListings({}, 1, 12);
    
    console.log('getServerSideProps result:', {
      success: result.success,
      listingsCount: result.listings?.length || 0,
      firstListing: result.listings?.[0]?.title || 'No listings'
    });
    
    return {
      props: {
        initialData: {
          listings: result.listings || [],
          meta: {
            page: result.pagination?.currentPage || 1,
            pages: result.pagination?.totalPages || 1,
            total: result.pagination?.total || 0,
            limit: result.pagination?.limit || 12
          }
        }
      }
    };
  } catch (error) {
    console.error("Error in getServerSideProps for simple test:", error);
    return {
      props: {
        initialData: {
          listings: [],
          meta: { page: 1, pages: 1, total: 0, limit: 12 }
        }
      }
    };
  }
}
