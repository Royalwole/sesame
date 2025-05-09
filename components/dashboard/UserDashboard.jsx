import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiHome, 
  FiHeart, 
  FiCalendar, 
  FiClock, 
  FiSearch, 
  FiTrendingUp, 
  FiMap, 
  FiAlertCircle, 
  FiPlus,
  FiMoreHorizontal,
  FiChevronRight,
  FiArrowRight,
  FiCheckCircle,
  FiBell,
  FiAward,
  FiStar,
  FiClock as FiClockIcon,
  FiEye,
  FiUser,
  FiSettings,
  FiLogOut,
  FiX,
  FiMenu
} from 'react-icons/fi';
import { getImageUrl, handleImageError } from '../../lib/image-utils';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function UserDashboard() {
  const { dbUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showFallbackBanner, setShowFallbackBanner] = useState(true);
  const router = useRouter();
  
  // Hide fallback banner after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallbackBanner(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get current time to personalize greeting
  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Mock data for dashboard statistics - all starting at 0
  const stats = {
    savedListings: 0,
    viewedListings: 0,
    upcomingInspections: 0,
    recentSearches: 0,
    matches: 0,
    notifications: 0
  };
  
  // Empty saved listings for fallback state
  const savedListings = [];
  
  // Empty upcoming inspections for fallback state
  const upcomingInspections = [];

  // Recent listings on the platform - using Nigerian locations and Naira
  const recentListings = [
    {
      id: '101',
      title: 'Newly Built 4 Bedroom Terrace',
      price: 85000000,
      address: 'Osapa London, Lekki, Lagos',
      image: '/images/placeholder-property.jpg',
      listedDate: '2025-05-08',
      agent: 'Premium Homes Ltd',
      verified: true
    },
    {
      id: '102',
      title: 'Luxury 3 Bedroom Apartment',
      price: 65000000,
      address: 'Victoria Garden City, Lagos',
      image: '/images/placeholder-property-2.jpg',
      listedDate: '2025-05-07',
      agent: 'Royal Estate Group',
      verified: true
    },
    {
      id: '103',
      title: 'Executive 5 Bedroom Duplex',
      price: 150000000,
      address: 'Maitama District, Abuja',
      image: '/images/placeholder-property.jpg',
      listedDate: '2025-05-05',
      agent: 'Capital City Realtors',
      verified: false
    }
  ];

  // Empty recent searches for fallback state
  const recentSearches = [];

  // Format date in a nice way
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format price in Naira
  const formatNairaPrice = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate how many days ago
  const daysAgo = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="pb-12 pt-6 relative">
      {/* Fallback data notification banner */}
      {showFallbackBanner && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white py-3 px-4 shadow-md z-50 transition-opacity duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2" />
              <span>We're using locally available data while your profile syncs. Some features may be limited.</span>
            </div>
            <div className="flex items-center">
              <button 
                className="text-white bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md text-sm font-medium mr-3"
                onClick={() => {/* Sync function would go here */}}
              >
                Sync Now
              </button>
              <button 
                className="text-white hover:text-blue-100"
                onClick={() => setShowFallbackBanner(false)}
              >
                <FiX />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* User Profile & Actions Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex justify-end">
          <div className="relative inline-block text-left">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/profile" className="flex items-center text-gray-700 hover:text-wine transition-colors">
                <FiUser className="mr-2" />
                <span>Edit Profile</span>
              </Link>
              <button 
                onClick={handleSignOut}
                className="flex items-center text-gray-700 hover:text-red-500 transition-colors"
              >
                <FiLogOut className="mr-2" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner with improved padding and larger fonts */}
      <div className="bg-gradient-to-r from-wine/95 to-wine/75 rounded-xl shadow-xl mb-8 overflow-hidden relative">
        {/* Removed the problematic pattern image reference that was causing the error */}
        <div className="max-w-7xl mx-auto px-8 py-16 relative z-10"> {/* Increased vertical padding */}
          <div className="flex flex-col md:flex-row justify-between">
            <div className="space-y-5 text-white mb-8 md:mb-0"> {/* Increased spacing between elements */}
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight"> {/* Increased font size */}
                {getCurrentGreeting()}, {dbUser?.firstName || 'Valued Client'}
              </h1>
              <p className="text-xl opacity-90 max-w-2xl"> {/* Increased font size */}
                Welcome to your personal dashboard. Let's find your perfect property.
              </p>
              <div className="pt-4"> {/* Increased top padding */}
                <Link href="/listings/search" className="inline-flex items-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors px-8 py-4 rounded-lg text-lg font-medium border border-white/30 shadow-lg"> {/* Larger button */}
                  Explore Properties <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center">
              <div className="w-52 h-52 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center relative"> {/* Slightly larger circle */}
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-pulse"></div>
                <FiHome className="w-24 h-24 text-white" />
              </div>
            </div>
          </div>
          
          {/* Quick Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-10"> {/* Increased gap and margin-top */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center border border-white/20"> {/* Increased padding */}
              <div className="h-14 w-14 rounded-xl bg-white/15 flex items-center justify-center mr-4"> {/* Larger icon container */}
                <FiHeart className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Saved</p>
                <p className="text-white text-2xl font-bold">{stats.savedListings}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center border border-white/20">
              <div className="h-14 w-14 rounded-xl bg-white/15 flex items-center justify-center mr-4">
                <FiCalendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Inspections</p>
                <p className="text-white text-2xl font-bold">{stats.upcomingInspections}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center border border-white/20">
              <div className="h-14 w-14 rounded-xl bg-white/15 flex items-center justify-center mr-4">
                <FiEye className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Viewed</p>
                <p className="text-white text-2xl font-bold">{stats.viewedListings}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 flex items-center border border-white/20">
              <div className="h-14 w-14 rounded-xl bg-white/15 flex items-center justify-center mr-4">
                <FiBell className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Alerts</p>
                <p className="text-white text-2xl font-bold">{stats.notifications}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Tabs & Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'saved', 'inspections', 'insights'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-wine text-wine'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm sm:text-base capitalize transition-colors`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left 2/3 */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Saved Listings */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Saved Properties</h2>
                <Link href="/dashboard/saved" className="text-wine hover:text-wine/80 text-sm font-medium flex items-center">
                  View All <FiChevronRight className="ml-1" />
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {savedListings.length > 0 ? (
                  savedListings.map((listing, idx) => (
                    <div key={listing.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="relative h-48 sm:h-32 sm:w-48 rounded-lg overflow-hidden mb-4 sm:mb-0">
                          <div className="absolute inset-0 bg-gray-200">
                            <img
                              src={getImageUrl(listing.image)}
                              alt={listing.title}
                              className="h-full w-full object-cover"
                              onError={(e) => handleImageError(e, true)}
                            />
                          </div>
                          
                          {/* Tags */}
                          <div className="absolute top-2 left-2 flex flex-col gap-2">
                            {listing.isNew && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                                New
                              </span>
                            )}
                            {listing.isRecommended && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                                Recommended
                              </span>
                            )}
                          </div>
                          
                          {/* Quick actions */}
                          <div className="absolute top-2 right-2">
                            <button className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm">
                              <FiMoreHorizontal className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Details */}
                        <div className="sm:ml-6 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between">
                              <h3 className="font-medium text-lg text-gray-900 line-clamp-1">{listing.title}</h3>
                              <p className="font-bold text-wine">{formatNairaPrice(listing.price)}</p>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">{listing.address}</p>
                            
                            {/* Property features */}
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex items-center text-gray-500 text-sm">
                                <span className="font-medium text-gray-900">{listing.beds}</span>
                                <span className="ml-1">Beds</span>
                              </div>
                              <div className="flex items-center text-gray-500 text-sm">
                                <span className="font-medium text-gray-900">{listing.baths}</span>
                                <span className="ml-1">Baths</span>
                              </div>
                              <div className="flex items-center text-gray-500 text-sm">
                                <span className="font-medium text-gray-900">{listing.sqft.toLocaleString()}</span>
                                <span className="ml-1">sq.ft</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center">
                            <Link 
                              href={`/listings/${listing.id}`} 
                              className="text-sm text-wine hover:text-wine/80 font-medium flex items-center"
                            >
                              View Property
                              <FiArrowRight className="ml-2" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                      <FiHeart className="h-7 w-7 text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 text-lg font-medium mb-1">No saved properties yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      You have not saved any properties yet. When you find properties you're interested in, save them here for quick access.
                    </p>
                    <div className="mt-6">
                      <Link href="/listings" 
                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-wine hover:bg-wine/90">
                        Browse Properties
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upcoming Inspections */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Inspections</h2>
                <Link href="/dashboard/inspections" className="text-wine hover:text-wine/80 text-sm font-medium flex items-center">
                  Manage All <FiChevronRight className="ml-1" />
                </Link>
              </div>
              
              <div className="divide-y divide-gray-100">
                {upcomingInspections.length > 0 ? (
                  upcomingInspections.map(inspection => (
                    <div key={inspection.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row items-start">
                        {/* Date Display */}
                        <div className="bg-gray-100 rounded-lg py-3 px-4 text-center mb-4 sm:mb-0">
                          <p className="font-bold text-wine text-lg">
                            {new Date(inspection.date).getDate()}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {new Date(inspection.date).toLocaleDateString('en-US', { month: 'short' })}
                          </p>
                        </div>
                        
                        <div className="sm:ml-6 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{inspection.propertyTitle}</h3>
                              <p className="text-gray-600 text-sm mt-1">{inspection.address}</p>
                            </div>
                            
                            <div className="mt-3 sm:mt-0 sm:ml-4">
                              {inspection.status === 'confirmed' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <FiCheckCircle className="mr-1" /> Confirmed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Awaiting Confirmation
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-gray-700">
                              <span className="font-medium">Time:</span> {inspection.time}
                            </div>
                            
                            <div className="flex space-x-3">
                              <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center">
                                Reschedule
                              </button>
                              <Link 
                                href={`/inspections/${inspection.id}`}
                                className="text-sm text-wine hover:text-wine/80 font-medium flex items-center"
                              >
                                Details <FiChevronRight className="ml-1" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                      <FiCalendar className="h-7 w-7 text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 text-lg font-medium mb-1">No scheduled inspections</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      You haven't scheduled any property viewings yet. Schedule an inspection to see your potential new home in person.
                    </p>
                    <div className="mt-6">
                      <Link href="/listings" 
                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-wine hover:bg-wine/90">
                        Find Properties
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Sidebar - 1/3 */}
          <div className="space-y-8">
            {/* Quick Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Search</h2>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search properties..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-wine"
                />
                <FiSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 font-medium py-2 px-4 rounded-md text-sm">
                  Recent Filters
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 font-medium py-2 px-4 rounded-md text-sm">
                  Saved Searches
                </button>
              </div>
            </div>
            
            {/* Recent Listings */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-900">Recent Listings</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {recentListings.map((listing, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex">
                      {/* Small thumbnail */}
                      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-200">
                        <img
                          src={getImageUrl(listing.image)}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                          onError={(e) => handleImageError(e, true)}
                        />
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-medium text-gray-900 line-clamp-1">{listing.title}</h3>
                          {listing.verified && (
                            <span className="bg-amber-50 text-amber-700 text-xs px-1.5 py-0.5 rounded-sm flex items-center">
                              <FiStar className="w-3 h-3 mr-1" /> Verified
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-1">{listing.address}</p>
                        <div className="mt-1 flex justify-between items-end">
                          <span className="font-semibold text-wine">{formatNairaPrice(listing.price)}</span>
                          <Link 
                            href={`/listings/${listing.id}`}
                            className="text-xs font-medium text-wine hover:text-wine/80 flex items-center"
                          >
                            View property <FiChevronRight className="ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="px-6 py-4 text-center">
                  <Link 
                    href="/listings" 
                    className="text-wine hover:text-wine/80 text-sm font-medium flex items-center justify-center"
                  >
                    View All Listings <FiArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Recent Searches */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium text-gray-900">Recent Searches</h2>
              </div>
              
              <div>
                {recentSearches.length > 0 ? (
                  recentSearches.map((search, idx) => (
                    <div key={idx} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/listings/search?q=${encodeURIComponent(search.query)}`} className="text-sm text-gray-900 hover:text-wine">
                            {search.query}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(search.date).toLocaleDateString()}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-wine">
                          <FiSearch className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                      <FiSearch className="h-6 w-6 text-gray-300" />
                    </div>
                    <h3 className="text-gray-700 font-medium mb-1">No search history yet</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                      Your recent property searches will appear here for quick access
                    </p>
                  </div>
                )}
                
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <Link 
                    href="/listings/search" 
                    className="text-wine hover:text-wine/80 text-sm font-medium flex items-center justify-center"
                  >
                    Advanced Search <FiArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
