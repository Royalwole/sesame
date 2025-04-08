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
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const hasRedirected = useRef(false);
  const loadingTimeoutRef = useRef(null);
  const [syncAttempts, setSyncAttempts] = useState(0);

  // Add a debug log
  console.log("UserDashboard render:", {
    authLoading,
    isAuthenticated,
    hasDbUser: !!dbUser,
    isFallbackUser: dbUser?.isFallback,
    isLoading,
    syncAttempts,
    hasError,
    error,
  });

  // Add safety timeout to prevent endless loading
  useEffect(() => {
    // Set a timeout to force loading to end after 5 seconds max
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.log("Safety timeout triggered - forcing loading to end");
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  // Handle authentication and redirection
  useEffect(() => {
    // Check if authentication is still loading
    if (authLoading) {
      console.log("Auth still loading...");
      return; // Wait for auth to finish loading
    }

    // Handle not authenticated case
    if (!isAuthenticated && !hasRedirected.current) {
      console.log("Redirecting unauthenticated user to sign-in");
      hasRedirected.current = true;
      router.push(
        `/auth/sign-in?redirect_url=${encodeURIComponent("/dashboard/user")}`
      );
      return;
    }

    // Handle authenticated case
    if (isAuthenticated) {
      console.log(
        "User is authenticated - dbUser present:",
        !!dbUser,
        "fallback:",
        dbUser?.isFallback || false
      );
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, dbUser]);

  // Function to handle manual sync of user data
  const handleSyncUserData = async () => {
    setSyncAttempts((prev) => prev + 1);
    try {
      setIsLoading(true);
      console.log("Manually syncing user data...");
      await syncUserData(); // Call the syncUserData function from AuthContext

      // Short delay to allow state to update
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error syncing user data:", err);
      setIsLoading(false);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching dashboard data");

      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // For this example, use mock data
      setTimeout(() => {
        if (hasRedirected.current) return; // Don't update state if redirected

        setFavorites([
          // Mock favorites data
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
        ]);
        setInspections([
          {
            id: "insp1",
            propertyId: "1",
            propertyTitle: "Modern 3 Bedroom Apartment",
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            status: "scheduled",
          },
        ]);
        setIsLoading(false);
        console.log("Dashboard data loaded");
      }, 500);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setDataError("Failed to load dashboard data. Please try again later.");
      setIsLoading(false);
    }
  };

  // Handle sign out and retry
  const handleSignOutAndRetry = async () => {
    try {
      const { signOut } = useAuth();
      await signOut();
      router.push("/auth/sign-in?redirect_url=/dashboard/user&restore=1");
    } catch (err) {
      console.error("Error signing out:", err);
      // Force reload as fallback
      window.location.href = "/auth/sign-in";
    }
  };

  // Show loader while auth is being determined
  if (authLoading) {
    return <Loader message="Verifying your account..." />;
  }

  // Show loader while redirecting
  if (!isAuthenticated && hasRedirected.current) {
    return <Loader message="Redirecting to sign in..." />;
  }

  // If authenticated but data is loading, show loading state
  if (isAuthenticated && isLoading) {
    return <Loader message="Loading your dashboard..." />;
  }

  // Force render even without complete dbUser in case of auth issues
  if (isAuthenticated && (!dbUser || dbUser.isFallback) && !isLoading) {
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
                Your profile information is still being synchronized. This may
                happen due to:
              </p>

              <ul className="list-disc pl-5 mb-6 text-gray-600">
                <li>Your account was just created and is being set up</li>
                <li>There may be a temporary database connection issue</li>
                <li>Your browser session needs to be refreshed</li>
              </ul>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium mb-1">
                    Try these quick solutions:
                  </h3>
                  <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-2">
                    <li>Wait a few seconds and refresh the page</li>
                    <li>Use the "Sync User Data" button to retry</li>
                    <li>If problems persist, sign out and sign in again</li>
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
                      <strong>Profile Status:</strong>{" "}
                      {hasError ? "Error" : "Setting Up"}
                    </p>
                    <p>
                      <strong>Sync Attempts:</strong> {syncAttempts}
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
                  {syncAttempts >= 3
                    ? "Sync Attempts Exhausted"
                    : "Sync User Data"}
                </button>

                {syncAttempts >= 2 && (
                  <button
                    onClick={handleSignOutAndRetry}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Sign Out & Sign In Again
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
                      ? "Maximum attempts reached. Try signing out and signing in again."
                      : "Trying to synchronize your account data..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state for dashboard data
  if (dataError) {
    return <ErrorMessage message={dataError} onRetry={fetchDashboardData} />;
  }

  // Render dashboard when everything is ready
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
