import { useRouter } from "next/router";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AuthProvider } from "../contexts/AuthContext";
import { DatabaseProvider } from "../contexts/DatabaseContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "../styles/globals.css";
import Head from "next/head";
import NextNProgress from "nextjs-progressbar";
import dynamic from 'next/dynamic';
import { useHydration } from "../lib/useHydration";

// Import monitoring conditionally to avoid build errors
const initMonitoring = () => {
  if (typeof window !== "undefined") {
    // Use requestIdleCallback to initialize monitoring during browser idle time
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        // Load monitoring module (if available)
        import("../lib/monitoring")
          .then(({ initClientMonitoring }) => {
            initClientMonitoring();
          })
          .catch((err) => {
            // Non-critical, can safely continue without monitoring
            console.log("Monitoring module not available");
          });
          
        // Initialize the safer webpack monitoring
        import("../lib/next-module-helper")
          .then(({ monitorWebpackCompilation }) => {
            if (typeof monitorWebpackCompilation === 'function') {
              monitorWebpackCompilation();
            }
          })
          .catch(() => {
            // Also non-critical
          });
      });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        import("../lib/monitoring")
          .then(({ initClientMonitoring }) => {
            initClientMonitoring();
          })
          .catch(() => {});
      }, 2000); // Delay by 2 seconds
    }
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

function isNoLayoutRoute(pathname) {
  return noLayoutRoutes.some(route => {
    if (route.includes("[") && route.includes("]")) {
      const baseRoute = route.split("[")[0];
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4">
      <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
      <pre className="mt-2 text-sm text-red-500">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

// Create a client-side only component for dev tools
const DevTools = dynamic(
  () => import('../components/debug/DevTools').then(mod => mod.default),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const isHydrated = useHydration();

  // Initialize monitoring safely on component mount with a delay
  useEffect(() => {
    setIsMounted(true);
    
    // Delay non-critical operations
    const timer = setTimeout(() => {
      initMonitoring();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Use layout from component if available, otherwise use default layout
  const getLayout = Component.getLayout || ((page) => page);
  const showStandardLayout = !isNoLayoutRoute(router.pathname);

  // Don't render layout-sensitive content until after hydration
  if (!isMounted || !isHydrated) {
    return (
      <ClerkProvider
        {...pageProps}
        navigate={(to) => router.push(to)}
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      >
        <div className="min-h-screen" />
      </ClerkProvider>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      <ClerkProvider
        {...pageProps}
        navigate={(to) => router.push(to)}
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      >
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <DatabaseProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <NextNProgress />
              <Toaster position="top-right" />
              
              {showStandardLayout && <Header />}
              <main className="flex-1">
                {getLayout(<Component {...pageProps} />)}
              </main>
              {showStandardLayout && <Footer />}
              
              {process.env.NODE_ENV === 'development' && <DevTools />}
            </div>
          </AuthProvider>
        </DatabaseProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
