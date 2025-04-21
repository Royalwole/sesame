import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import UserDashboard from "../../components/dashboard/UserDashboard";
import Loader from "../../components/utils/Loader";
import ErrorMessage from "../../components/utils/ErrorMessage";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";

export default function UserDashboardPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    dbUser,
    isLoading: authLoading,
    syncUserData,
    syncAttempts,
    hasError,
    error,
  } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loadingState, setLoadingState] = useState("initial"); 
  const [dataError, setDataError] = useState(null);
  const loadingTimeoutRef = useRef(null);

  // Debug logging utility
  const logDebug = (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[UserDashboard] ${message}`, data);
    }
  };

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (loadingState === "loading") {
        logDebug("Safety timeout triggered");
        setLoadingState("error");
        setDataError("Loading took too long. Please try refreshing.");
      }
    }, 10000);

    return () => clearTimeout(loadingTimeoutRef.current);
  }, [loadingState]);

  // Handle authentication status
  useEffect(() => {
    if (authLoading) {
      logDebug("Authentication loading");
      setLoadingState("loading");
      return;
    }

    if (!isAuthenticated) {
      logDebug("User not authenticated, redirecting to sign-in");
      const currentUrl = window.location.pathname;
      router.replace(`/auth/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // If we have a user, load the dashboard data
    if (dbUser) {
      logDebug("User authenticated, loading dashboard data");
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, dbUser, router]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoadingState("loading");
    logDebug("Fetching dashboard data");

    try {
      const { favorites, inspections } = await fetchMockDashboardData();
      setFavorites(favorites);
      setInspections(inspections);
      setLoadingState("ready");
      logDebug("Data loaded successfully");
    } catch (err) {
      logDebug("Error fetching data", { error: err.message });
      setDataError("Failed to load dashboard data. Please try again.");
      setLoadingState("error");
    }
  };

  // Fetch mock dashboard data (simulated API call)
  const fetchMockDashboardData = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          favorites: [
            {
              id: "1",
              title: "Modern 3 Bedroom Apartment",
              location: "Lagos",
              price: 250000,
              image: "/images/sample-property-1.jpg",
            },
            {
              id: "2",
              title: "Spacious 4 Bedroom Villa",
              location: "Abuja",
              price: 450000,
              image: "/images/sample-property-2.jpg",
            },
          ],
          inspections: [
            {
              id: "insp1",
              propertyId: "1",
              propertyTitle: "Modern 3 Bedroom Apartment",
              date: new Date(Date.now() + 86400000).toISOString(),
              status: "scheduled",
            },
          ],
        });
      }, 800);
    });
  };

  // Handle manual refresh
  const handleManualSync = async () => {
    setLoadingState("syncing");
    try {
      await syncUserData(true); // Force refresh
      await fetchDashboardData();
    } catch (err) {
      setDataError("Sync failed. Please try again.");
      setLoadingState("error");
    }
  };

  // Loading states
  if (authLoading || loadingState === "loading" || loadingState === "initial") {
    return <Loader message="Loading your dashboard..." />;
  }

  if (loadingState === "syncing") {
    return <Loader message="Synchronizing your data..." />;
  }

  // Account setup in progress (using fallback data)
  if (isAuthenticated && dbUser?.isFallback) {
    return (
      <>
        <Head>
          <title>Account Setup | TopDial</title>
        </Head>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4 text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h1 className="text-2xl font-bold">Account Setup</h1>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-md">
                <p className="font-medium text-blue-800">Welcome to TopDial!</p>
                <p className="text-blue-700">We're finishing up your account setup.</p>
              </div>

              <p className="text-gray-600 mb-4">
                We're still syncing your profile information. This may be because:
              </p>

              <ul className="list-disc pl-5 mb-6 space-y-1 text-gray-600">
                <li>You've recently created your account</li>
                <li>There may be temporary connection issues</li>
                <li>Your browser session might need to be refreshed</li>
              </ul>

              {hasError && (
                <div className="p-4 bg-red-50 rounded-md mb-6">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-700">{error || "Unknown error occurred"}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleManualSync}
                  disabled={syncAttempts >= 3}
                  className={`px-4 py-2 ${
                    syncAttempts >= 3
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  } text-white rounded`}
                >
                  {syncAttempts >= 3 ? "Try Again Later" : "Retry Synchronization"}
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Refresh Page
                </button>

                <Link
                  href="/"
                  className="px-4 py-2 bg-white border border-gray-300 text-center text-gray-800 rounded hover:bg-gray-50"
                >
                  Return to Homepage
                </Link>
              </div>

              {syncAttempts > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    Sync attempt {syncAttempts}/3
                    {syncAttempts >= 3
                      ? ". Maximum attempts reached. Please try again later."
                      : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (loadingState === "error" || dataError) {
    return (
      <ErrorMessage 
        message={dataError || "An error occurred loading your dashboard"} 
        onRetry={fetchDashboardData}
      />
    );
  }

  // Render dashboard when everything is ready
  return (
    <>
      <Head>
        <title>User Dashboard | TopDial</title>
      </Head>
      <UserDashboard
        user={dbUser}
        favorites={favorites}
        inspections={inspections}
      />
      
      {/* Debug panel in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-white p-3 border rounded shadow-lg text-xs max-w-xs opacity-70 hover:opacity-100 z-50">
          <h3 className="font-bold mb-1">Debug Info</h3>
          <p>Auth: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>Role: {dbUser?.role || 'None'}</p>
          <p>State: {loadingState}</p>
          <p>Fallback: {dbUser?.isFallback ? 'Yes' : 'No'}</p>
          <div className="mt-1 flex gap-1">
            <button 
              onClick={handleManualSync}
              className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
            >
              Sync
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs"
            >
              Reload
            </button>
          </div>
        </div>
      )}
    </>
  );
}
