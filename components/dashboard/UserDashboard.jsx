import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiHeart, FiCalendar, FiClock } from 'react-icons/fi';
import { getImageUrl, handleImageError } from '../../lib/image-utils';
import Image from 'next/image';

export default function UserDashboard() {
  const { dbUser } = useAuth();
  
  // Mock data for dashboard statistics
  const stats = {
    savedListings: 5,
    viewedListings: 12,
    upcomingInspections: 2,
    recentSearches: 8,
  };
  
  // Mock data for saved listings
  const savedListings = [
    {
      id: '1',
      title: '3 Bedroom Apartment',
      price: 250000,
      address: '123 Main St, Downtown',
      image: '/images/placeholder-property.jpg',
    },
    {
      id: '2',
      title: 'Luxury Villa with Pool',
      price: 500000,
      address: '456 Ocean View, Beachfront',
      image: '/images/placeholder-property-2.jpg',
    },
  ];
  
  // Mock data for upcoming inspections
  const upcomingInspections = [
    {
      id: '1',
      propertyTitle: '3 Bedroom Apartment',
      date: '2023-12-15',
      time: '10:00 AM',
      address: '123 Main St, Downtown',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {dbUser?.firstName || 'User'}!
        </h1>
        <p className="mt-1 text-gray-600">
          Here's what's happening with your property search.
        </p>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-blue-100 text-blue-600">
              <FiHeart size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Saved Listings</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.savedListings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-green-100 text-green-600">
              <FiHome size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Viewed Properties</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.viewedListings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-purple-100 text-purple-600">
              <FiCalendar size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inspections</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingInspections}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-yellow-100 text-yellow-600">
              <FiClock size={20} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Searches</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.recentSearches}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Saved Listings */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Saved Listings</h2>
        </div>
        
        <div className="divide-y">
          {savedListings.length > 0 ? (
            savedListings.map(listing => (
              <div key={listing.id} className="flex items-center p-4 hover:bg-gray-50">
                <div className="h-16 w-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                  {listing.image && (
                    <img
                      src={getImageUrl(listing.image)}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                      onError={(e) => handleImageError(e, true)}
                    />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium text-gray-900">{listing.title}</h3>
                  <p className="text-gray-600 text-sm">{listing.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${listing.price.toLocaleString()}</p>
                  <a href={`/listings/${listing.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                    View Details
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No saved listings yet.
              <div className="mt-2">
                <a href="/listings" className="text-blue-600 hover:text-blue-800">
                  Browse listings
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Upcoming Inspections */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Inspections</h2>
        </div>
        
        <div className="divide-y">
          {upcomingInspections.length > 0 ? (
            upcomingInspections.map(inspection => (
              <div key={inspection.id} className="flex items-center p-4 hover:bg-gray-50">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <FiCalendar size={20} />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium text-gray-900">{inspection.propertyTitle}</h3>
                  <p className="text-gray-600 text-sm">{inspection.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {new Date(inspection.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 text-sm">{inspection.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No upcoming inspections.
              <div className="mt-2">
                <a href="/listings" className="text-blue-600 hover:text-blue-800">
                  Schedule an inspection
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
