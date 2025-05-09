import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    FiHome, FiHeart, FiCalendar, FiSearch, FiTrendingUp,
    FiMap, FiAlertCircle, FiPlus, FiChevronRight, FiArrowRight,
    FiCheckCircle, FiBell, FiUser, FiLogOut, FiMenu,
    FiEye, FiStar, FiX
} from 'react-icons/fi';
import { getImageUrl, handleImageError } from '../../lib/image-utils';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { fetchUserDashboardData, fetchUserFavorites, fetchUserInspections } from '../../services/dashboardService';

export default function UserDashboard() {
    const { dbUser, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [showFallbackBanner, setShowFallbackBanner] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [savedListings, setSavedListings] = useState([]);
    const [upcomingInspections, setUpcomingInspections] = useState([]);
    const [recentListings, setRecentListings] = useState([]);
    const [error, setError] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const data = await fetchUserDashboardData();
                setDashboardData(data);
                const favorites = await fetchUserFavorites({ limit: 6 });
                setSavedListings(favorites || []);
                const inspections = await fetchUserInspections({ limit: 5, futureOnly: true });
                setUpcomingInspections(inspections || []);
                setIsLoading(false);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
                setError("Failed to load dashboard data. Please try again later.");
                setIsLoading(false);
                setShowFallbackBanner(true);
                initializeFallbackData();
            }
        };
        fetchData();
    }, []);

    const initializeFallbackData = () => {
        setDashboardData({
            stats: {
                savedListings: 0,
                viewedListings: 0,
                upcomingInspections: 0,
                recentSearches: 0,
                matches: 0,
                notifications: 0
            }
        });
        setSavedListings([]);
        setUpcomingInspections([]);
        setRecentListings([
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
        ]);
    };

    useEffect(() => {
        if (showFallbackBanner) {
            const timer = setTimeout(() => {
                setShowFallbackBanner(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showFallbackBanner]);

    const handleSignOut = async () => {
        try {
            await logout();
            router.push('/auth/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const getCurrentGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getWelcomeMessage = () => {
        const messages = [
            "Welcome back to your property journey!",
            "Your dream home awaits you.",
            "Explore new listings curated for you.",
            "Let's find your perfect property today.",
            "Your real estate adventure starts here."
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const lastLoginTime = dbUser?.lastLogin
        ? new Date(dbUser.lastLogin).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
        : 'First visit';

    const stats = dashboardData?.stats || {
        savedListings: 0,
        viewedListings: 0,
        upcomingInspections: 0,
        recentSearches: 0,
        matches: 0,
        notifications: 0
    };

    const daysAgo = (date) => {
        const diff = new Date().getTime() - new Date(date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
    };

    return (
        <div className="min-h-screen pt-16" style={{ backgroundColor: "#F8F1F1" }}>
            {/* Fallback Banner */}
            {showFallbackBanner && (
                <div className="fixed top-4 right-4 z-50 max-w-sm">
                    <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <FiAlertCircle className="mr-2 h-5 w-5" />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => setShowFallbackBanner(false)}
                            className="text-white hover:text-red-200 transition-colors"
                        >
                            <FiX className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="flex flex-col items-center">
                        <div className="h-12 w-12 border-4 border-[#70343c] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Loading your dashboard...</p>
                    </div>
                </div>
            )}

            {!isLoading && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-[#70343c] to-[#8D4C55] rounded-2xl shadow-xl p-8 mb-8 text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    {getCurrentGreeting()}, {dbUser?.firstName || 'Valued Client'}
                                </h1>
                                <p className="mt-2 text-indigo-100">{getWelcomeMessage()}</p>
                                <p className="mt-1 text-sm opacity-80">
                                    Last login: {lastLoginTime}
                                </p>
                            </div>
                            <div className="hidden md:flex items-center space-x-4">
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center text-white hover:text-indigo-200 transition-colors"
                                >
                                    <FiUser className="mr-2 h-5 w-5" />
                                    <span>Edit Profile</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center text-white hover:text-red-200 transition-colors"
                                >
                                    <FiLogOut className="mr-2 h-5 w-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                            <button
                                className="md:hidden text-white"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                <FiMenu className="h-6 w-6" />
                            </button>
                        </div>
                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="mt-4 md:hidden">
                                <div className="flex flex-col space-y-2">
                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center text-white hover:text-indigo-200 py-2"
                                    >
                                        <FiUser className="mr-2 h-5 w-5" />
                                        Edit Profile
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center text-white hover:text-red-200 py-2"
                                    >
                                        <FiLogOut className="mr-2 h-5 w-5" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                        {[
                            { icon: FiHeart, label: 'Saved Listings', value: stats.savedListings },
                            { icon: FiEye, label: 'Viewed Listings', value: stats.viewedListings },
                            { icon: FiCalendar, label: 'Inspections', value: stats.upcomingInspections },
                            { icon: FiSearch, label: 'Recent Searches', value: stats.recentSearches },
                            { icon: FiStar, label: 'Matches', value: stats.matches }
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4 hover:shadow-md transition-shadow"
                            >
                                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(112, 52, 60, 0.1)' }}>
                                    <stat.icon className="h-6 w-6" style={{ color: '#70343c' }} />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Saved Listings */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-xl font-semibold text-gray-900">Saved Listings</h2>
                                    <Link
                                        href="/dashboard/favorites"
                                        className="text-[#70343c] hover:text-[#8D4C55] text-sm font-medium flex items-center"
                                    >
                                        View All <FiChevronRight className="ml-1" />
                                    </Link>
                                </div>
                                {savedListings.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <FiHeart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900">No saved properties</h3>
                                        <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                            You haven't saved any properties yet. Browse listings and tap the heart icon to save properties for later.
                                        </p>
                                        <Link
                                            href="/listings"
                                            className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-[#70343c] text-white hover:bg-[#8D4C55] transition-colors"
                                        >
                                            Browse Properties
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                                        {savedListings.map((listing) => (
                                            <div
                                                key={listing.id}
                                                className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                <div className="relative h-48">
                                                    <Image
                                                        src={getImageUrl(listing.image)}
                                                        alt={listing.title}
                                                        layout="fill"
                                                        objectFit="cover"
                                                        onError={(e) => handleImageError(e, true)}
                                                    />
                                                    {listing.verified && (
                                                        <div className="absolute bottom-2 right-2 bg-emerald-500 rounded-full p-1">
                                                            <FiCheckCircle className="h-4 w-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-medium text-gray-900 line-clamp-1">{listing.title}</h3>
                                                    <p className="text-[#70343c] font-medium">₦{listing.price.toLocaleString()}</p>
                                                    <p className="text-gray-500 text-sm mt-1 line-clamp-1">{listing.address}</p>
                                                    <p className="text-gray-400 text-xs mt-1">{daysAgo(listing.listedDate)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Inspections */}
                        <div>
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-xl font-semibold text-gray-900">Upcoming Inspections</h2>
                                    <Link
                                        href="/dashboard/inspections"
                                        className="text-[#70343c] hover:text-[#8D4C55] text-sm font-medium flex items-center"
                                    >
                                        View All <FiChevronRight className="ml-1" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {upcomingInspections.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <FiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900">No upcoming inspections</h3>
                                            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                                Schedule inspections for your favorite properties to visit them in person.
                                            </p>
                                            <Link
                                                href="/listings"
                                                className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-[#70343c] text-white hover:bg-[#8D4C55] transition-colors"
                                            >
                                                Browse Properties
                                            </Link>
                                        </div>
                                    ) : (
                                        upcomingInspections.map((inspection) => (
                                            <div
                                                key={inspection.id}
                                                className="p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center">
                                                    <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                                                        <Image
                                                            src={getImageUrl(inspection.listing.image)}
                                                            alt={inspection.listing.title}
                                                            layout="fill"
                                                            objectFit="cover"
                                                            onError={(e) => handleImageError(e, true)}
                                                        />
                                                    </div>
                                                    <div className="ml-4 flex-1">
                                                        <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
                                                            {inspection.listing.title}
                                                        </h3>
                                                        <p className="text-gray-500 text-xs mt-1">{inspection.listing.address}</p>
                                                        <p className="text-[#34A39B] text-xs mt-1">
                                                            {new Date(inspection.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Listings */}
                    <div className="mt-8">
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-xl font-semibold text-gray-900">Recent Listings</h2>
                                <Link
                                    href="/listings"
                                    className="text-[#70343c] hover:text-[#8D4C55] text-sm font-medium flex items-center"
                                >
                                    View All <FiChevronRight className="ml-1" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                {recentListings.map((listing) => (
                                    <div
                                        key={listing.id}
                                        className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div className="relative h-48">
                                            <Image
                                                src={getImageUrl(listing.image)}
                                                alt={listing.title}
                                                layout="fill"
                                                objectFit="cover"
                                                onError={(e) => handleImageError(e, true)}
                                            />
                                            {listing.verified && (
                                                <div className="absolute bottom-2 right-2 bg-emerald-500 rounded-full p-1">
                                                    <FiCheckCircle className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-900 line-clamp-1">{listing.title}</h3>
                                            <p className="text-[#70343c] font-medium">₦{listing.price.toLocaleString()}</p>
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-1">{listing.address}</p>
                                            <p className="text-gray-400 text-xs mt-1">{daysAgo(listing.listedDate)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 bg-gray-50">
                                <p className="text-xs text-gray-500 text-center">
                                    Showing {recentListings.length} of recent listings
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="mt-8 bg-[#70343c] rounded-xl shadow-xl p-8 text-center text-white">
                        <h2 className="text-2xl font-bold">Ready to Find Your Dream Home?</h2>
                        <p className="mt-2 text-white opacity-90 max-w-md mx-auto">
                            Explore our curated selection of properties and schedule inspections today.
                        </p>
                        <Link
                            href="/listings/search"
                            className="mt-6 inline-flex items-center px-6 py-3 rounded-lg bg-[#f1f3f3] text-[#70343c] hover:bg-[#70343c] transition-colors font-medium"
                        >
                            Explore Properties <FiArrowRight className="ml-2" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}