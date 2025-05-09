import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import UserDashboard from "../../components/dashboard/UserDashboard";
import Loader from "../../components/utils/Loader";
import ErrorMessage from "../../components/utils/ErrorMessage";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";
import Link from "next/link";
import toast from "react-hot-toast";

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
        setLoadingState("ready"); // Changed from "error" to "ready" to avoid blocking
        // Show a non-blocking toast instead of error state
        toast.error("Some data is taking longer to load. You can still use your dashboard.");
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
      
      // Show non-blocking notification if there were sync issues
      if (hasError && error) {
        if (typeof error === 'object') {
          toast.error(error.message || "Background sync issue - using available data");
        } else {
          toast.error("Background sync issue - using available data");
        }
      }
    }
  }, [authLoading, isAuthenticated, dbUser, router, hasError, error]);

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
      // Don't block access on dashboard data errors
      setLoadingState("ready");
      // Show a toast instead of blocking error
      toast.error("Some dashboard data couldn't be loaded. You can still use your dashboard.");
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
    toast.promise(
      (async () => {
        setLoadingState("syncing");
        try {
          await syncUserData(true); // Force refresh
          await fetchDashboardData();
          return "Data synchronized successfully";
        } catch (err) {
          console.error("Sync error:", err);
          // Always continue to dashboard even on error
          setLoadingState("ready");
          throw new Error("Sync failed, but you can continue using your dashboard");
        }
      })(),
      {
        loading: 'Synchronizing data...',
        success: (message) => message,
        error: (err) => err.message,
      }
    );
  };

  // Loading states
  if (authLoading || loadingState === "loading" || loadingState === "initial") {
    return <Loader message="Loading your dashboard..." />;
  }

  if (loadingState === "syncing") {
    return <Loader message="Synchronizing your data..." />;
  }

  // ALWAYS show the dashboard for authenticated users, even with fallback data
  // We'll completely skip the error/setup screens and go straight to the dashboard
  if (isAuthenticated && dbUser) {
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
        
        {/* If we're using fallback data, show a subtle info banner */}
        {dbUser?.isFallback && process.env.NODE_ENV !== 'development' && (
          <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-2 text-center text-sm z-50">
            We're using locally available data while your profile syncs. Some features may be limited.
            <button 
              onClick={handleManualSync}
              className="ml-2 bg-white text-blue-700 px-2 py-0.5 text-xs rounded hover:bg-blue-50"
            >
              Sync Now
            </button>
          </div>
        )}
        
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

  // Error state - This should rarely be reached now since we show the dashboard with fallback data
  if (loadingState === "error" || dataError) {
    return (
      <ErrorMessage 
        message="We're having trouble loading your dashboard. Please refresh the page."
        onRetry={fetchDashboardData}
      />
    );
  }

  // Loading state as final fallback
  return <Loader message="Preparing your dashboard..." />;
}
