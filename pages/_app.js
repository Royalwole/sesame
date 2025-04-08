import { useRouter } from "next/router";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AuthProvider } from "../contexts/AuthContext";
import { DatabaseProvider } from "../contexts/DatabaseContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "../styles/globals.css";
import Head from "next/head";
import NextNProgress from "nextjs-progressbar";

// Import monitoring conditionally to avoid build errors
const initMonitoring = () => {
  if (typeof window !== "undefined") {
    // Dynamic import to prevent build errors if package is missing
    import("../lib/monitoring")
      .then(({ initClientMonitoring }) => {
        initClientMonitoring();
      })
      .catch((err) => {
        console.log("Monitoring module not available", err);
      });
  }
};

// Routes that should not show the standard layout
const noLayoutRoutes = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/sign-out",
  "/auth/callback",
  "/auth/[[...clerk]]",
  "/dashboard/admin",
  "/dashboard/agent",
];

// Add this helper function to better match routes including catch-all patterns
function isNoLayoutRoute(pathname) {
  return noLayoutRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`) ||
      (pathname.includes("/sign-in/") && route === "/auth/sign-in") ||
      (pathname.includes("/sign-up/") && route === "/auth/sign-up")
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  // Log the error to our monitoring system - safely
  useEffect(() => {
    console.error("Application error:", error);

    // Try to log to monitoring system if available
    if (typeof window !== "undefined") {
      import("../lib/monitoring")
        .then(({ logClientError }) => {
          logClientError(error, { component: "GlobalErrorBoundary" });
        })
        .catch(() => {
          // Monitoring not available
        });
    }
  }, [error]);

  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="text-red-500 text-4xl mb-4 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-16 w-16 inline-block"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-center mb-4">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">
          We're sorry for the inconvenience. Our team has been notified of this
          issue.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Initialize monitoring safely on component mount
  useEffect(() => {
    initMonitoring();
  }, []);

  // Use the improved route matching function
  const showStandardLayout = !isNoLayoutRoute(router.pathname);

  // Use layout from component if available, otherwise use default layout
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      <ClerkProvider
        {...pageProps}
        navigate={(to) => router.push(to)}
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          layout: {
            termsPageUrl: "https://example.com/terms",
            privacyPageUrl: "https://example.com/privacy",
          },
          variables: {
            colorPrimary: "#4f46e5",
          },
        }}
      >
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta
            name="description"
            content="TopDial - Your Premier Real Estate Platform"
          />
          <meta property="og:title" content="TopDial Real Estate" />
          <meta
            property="og:description"
            content="Find your dream home with TopDial."
          />
          <meta property="og:type" content="website" />
          <meta name="theme-color" content="#ffffff" />
        </Head>

        <NextNProgress
          color="#4f46e5"
          startPosition={0.3}
          stopDelayMs={200}
          height={3}
          showOnShallow={true}
          options={{ showSpinner: false }}
        />

        <DatabaseProvider>
          <AuthProvider>
            {process.env.NODE_ENV === "development" && (
              <div className="fixed bottom-0 right-0 bg-black text-white text-xs p-1 z-50">
                Path: {router.pathname}
              </div>
            )}

            {showStandardLayout ? (
              <>
                <Header />
                <main className="min-h-[calc(100vh-200px)]">
                  {getLayout(<Component {...pageProps} />)}
                </main>
                <Footer />
              </>
            ) : (
              getLayout(<Component {...pageProps} />)
            )}

            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#4CAF50",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: "#E53E3E",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </AuthProvider>
        </DatabaseProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
