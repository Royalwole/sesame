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
    hasError,
    error,
  } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loadingState, setLoadingState] = useState("authenticating"); // Centralized loading state
  const [dataError, setDataError] = useState(null);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const hasRedirected = useRef(false);
  const loadingTimeoutRef = useRef(null);

  // Debug logging utility with timestamp
  const logDebug = (message, data = {}) => {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
  };

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (loadingState !== "ready") {
        logDebug("Safety timeout triggered - forcing loading to end");
        setLoadingState("ready");
        setDataError("Loading took too long. Please try refreshing.");
      }
    }, 5000);

    return () => clearTimeout(loadingTimeoutRef.current);
  }, []); // Run once on mount

  // Handle authentication and redirection
  useEffect(() => {
    logDebug("Auth check", { authLoading, isAuthenticated, dbUser: !!dbUser });

    if (authLoading) {
      setLoadingState("authenticating");
      return;
    }

    if (!isAuthenticated && !hasRedirected.current) {
      logDebug("Redirecting unauthenticated user to sign-in");
      hasRedirected.current = true;
      router.push(
        `/auth/sign-in?redirect_url=${encodeURIComponent("/dashboard/user")}`
      );
      setLoadingState("redirecting");
      return;
    }

    if (isAuthenticated) {
      logDebug("User authenticated", {
        hasDbUser: !!dbUser,
        isFallback: dbUser?.isFallback,
      });
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, dbUser, router]); // Proper dependencies

  // Fetch mock dashboard data
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
      }, 500);
    });
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (hasRedirected.current) return;

    try {
      setLoadingState("fetching");
      logDebug("Fetching dashboard data");

      const { favorites, inspections } = await fetchMockDashboardData();
      setFavorites(favorites);
      setInspections(inspections);
      setLoadingState("ready");
      logDebug("Dashboard data loaded successfully");
    } catch (err) {
      logDebug("Error fetching dashboard data", { error: err.message });
      setDataError("Failed to load dashboard data. Please try again.");
      setLoadingState("ready");
    }
  };

  // Manual sync with retry limit and backoff
  const handleSyncUserData = async () => {
    if (syncAttempts >= 3) {
      logDebug("Sync attempts exhausted");
      return;
    }

    setSyncAttempts((prev) => prev + 1);
    setLoadingState("syncing");
    try {
      logDebug("Manually syncing user data", { attempt: syncAttempts + 1 });
      await syncUserData();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      fetchDashboardData(); // Refresh data after sync
    } catch (err) {
      logDebug("Error syncing user data", { error: err.message });
      setDataError("Sync failed. Try again or sign out.");
      setLoadingState("ready");
    }
  };

  // Sign out and retry
  const handleSignOutAndRetry = async () => {
    try {
      logDebug("Signing out and retrying");
      const { signOut } = useAuth();
      await signOut();
      router.push("/auth/sign-in?redirect_url=/dashboard/user&restore=1");
    } catch (err) {
      logDebug("Error signing out", { error: err.message });
      window.location.href = "/auth/sign-in"; // Fallback
    }
  };

  // Loading states
  if (loadingState === "authenticating") {
    return <Loader message="Verifying your account..." />;
  }
  if (loadingState === "redirecting") {
    return <Loader message="Redirecting to sign in..." />;
  }
  if (loadingState === "fetching" || loadingState === "syncing") {
    return <Loader message="Loading your dashboard..." />;
  }

  // Incomplete setup state
  if (isAuthenticated && (!dbUser || dbUser.isFallback)) {
    return (
      <>
        <Head>
          <title>Account Setup | TopDial</title>
        </Head>
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center mb-4 text-orange-500">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h1 className="text-2xl font-bold text-gray-900">
                  Account Setup In Progress
                </h1>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg text-blue-800">
                <p className="font-medium">Welcome to TopDial!</p>
                <p>We're setting up your account profile.</p>
              </div>

              <p className="text-gray-600 mb-4">
                Your profile information is still being synchronized due to:
              </p>

              <ul className="list-disc pl-5 mb-6 text-gray-600">
                <li>Recent account creation</li>
                <li>Temporary database connection issues</li>
                <li>Browser session needing refresh</li>
              </ul>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-1">Quick Solutions:</h3>
                  <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2">
                    <li>Refresh the page after a few seconds</li>
                    <li>Click "Sync User Data" to retry</li>
                    <li>Sign out and sign in if issues persist</li>
                  </ol>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-1">Account Information:</h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      <strong>Name:</strong> {dbUser?.firstName || "Unknown"}{" "}
                      {dbUser?.lastName || ""}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {hasError ? "Error" : "Setting Up"}
                    </p>
                    <p>
                      <strong>Sync Attempts:</strong> {syncAttempts}/3
                    </p>
                    {error && (
                      <p className="text-red-600">
                        <strong>Error:</strong> {error}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={handleSyncUserData}
                  disabled={syncAttempts >= 3}
                  className={`px-4 py-2 ${
                    syncAttempts >= 3
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  } text-white rounded transition-colors`}
                >
                  Sync User Data
                </button>
                {syncAttempts >= 2 && (
                  <button
                    onClick={handleSignOutAndRetry}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Sign Out & Retry
                  </button>
                )}
                <Link
                  href="/"
                  className="px-4 py-2 bg-gray-200 text-center text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Return to Homepage
                </Link>
              </div>

              {syncAttempts > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 text-sm text-yellow-700 rounded-md">
                  <p>
                    Sync attempt {syncAttempts}/3.{" "}
                    {syncAttempts >= 3
                      ? "Max attempts reached. Please sign out and retry."
                      : "Retrying synchronization..."}
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
  if (dataError) {
    return <ErrorMessage message={dataError} onRetry={fetchDashboardData} />;
  }

  // Render dashboard
  return (
    <>
      <Head>
        <title>User Dashboard | TopDial</title>
      </Head>
      <UserDashboard
        user={dbUser || { firstName: "User" }}
        favorites={favorites}
        inspections={inspections}
      />
    </>
  );
}
