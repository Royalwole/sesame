/**
 * Central monitoring setup for the application
 * Configures client-side and server-side monitoring
 */

// Configuration parameters
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV;
const IS_BROWSER = typeof window !== "undefined";
const IS_PRODUCTION = NODE_ENV === "production";

// Variable to track if Sentry is initialized
let sentryInitialized = false;

/**
 * Dynamically initialize Sentry if available - with performance improvements
 * @returns {Promise<boolean>} Whether Sentry was initialized
 */
async function initSentryIfAvailable() {
  // Don't attempt to initialize Sentry if not in production or no DSN available
  if (!IS_PRODUCTION || !SENTRY_DSN) {
    return false;
  }

  // Add a slight delay for non-critical monitoring to avoid blocking initial render
  if (IS_BROWSER) {
    return new Promise((resolve) => {
      // Use requestIdleCallback for browsers that support it to wait for idle time
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          initSentryCore().then(resolve);
        });
      } else {
        // Fallback to setTimeout with a small delay
        setTimeout(() => {
          initSentryCore().then(resolve);
        }, 2000); // Delay initialization by 2 seconds
      }
    });
  }

  return initSentryCore();
}

/**
 * Core Sentry initialization logic - separated to improve performance
 */
async function initSentryCore() {
  try {
    // Use dynamic import with a shorter timeout
    const importPromise = import("@sentry/browser");

    // Add a timeout to prevent hanging if Sentry can't be imported
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Sentry import timeout")), 3000);
    });

    const Sentry = await Promise.race([importPromise, timeoutPromise]).catch(
      () => null
    );

    if (!Sentry) {
      console.log(
        "Sentry package not found - skipping error monitoring integration"
      );
      return false;
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: NODE_ENV,
      release: process.env.NEXT_PUBLIC_VERSION || "1.0.0",
      tracesSampleRate: 0.1, // Reduced from 0.2 to improve performance
      beforeSend(event) {
        // Only send errors in production
        if (!IS_PRODUCTION) return null;
        return event;
      },
      integrations: [
        new Sentry.BrowserTracing({
          // Reduce trace sample rate for better performance
          tracesSampleRate: 0.05,
        }),
      ],
    });

    sentryInitialized = true;
    return true;
  } catch (e) {
    console.log("Failed to initialize Sentry:", e);
    return false;
  }
}

/**
 * Initialize client-side error monitoring - with improved performance
 */
export function initClientMonitoring() {
  if (!IS_BROWSER) return;

  // Use a non-blocking approach for monitoring initialization
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      setupMonitoring();
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      setupMonitoring();
    }, 1000); // Delay by 1 second to not block rendering
  }
}

/**
 * Setup the actual monitoring after page load
 */
function setupMonitoring() {
  // Basic error handlers for development
  if (!IS_PRODUCTION || !SENTRY_DSN) {
    // Set up basic error handlers
    window.addEventListener("error", (event) => {
      console.error("[Monitoring] Unhandled error:", event.error);
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("[Monitoring] Unhandled promise rejection:", event.reason);
    });
    return;
  }

  // Try to initialize Sentry
  initSentryIfAvailable().catch(() => {
    // Fallback error handlers if initialization fails
    window.addEventListener("error", (event) => {
      console.error("[Monitoring] Unhandled error:", event.error);
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("[Monitoring] Unhandled promise rejection:", event.reason);
    });
  });
}

/**
 * Log client-side error
 */
export async function logClientError(error, context = {}) {
  // Always log to console
  console.error("Client error:", error, context);

  // Only try to use Sentry if we're in a browser and in production
  if (IS_BROWSER && IS_PRODUCTION && SENTRY_DSN) {
    try {
      // If Sentry isn't initialized yet, try to initialize it
      if (!sentryInitialized) {
        await initSentryIfAvailable();
      }

      if (sentryInitialized) {
        const Sentry = await import("@sentry/browser");
        Sentry.withScope((scope) => {
          // Add context information for better debugging
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });

          // Add user context if available
          try {
            const userToken = localStorage.getItem("userToken");
            if (userToken) {
              scope.setUser({ id: userToken });
            }
          } catch (e) {
            // Local storage might be unavailable
          }

          Sentry.captureException(error);
        });
      }
    } catch (e) {
      // Sentry not available or failed, just continue
      console.log("Error logging to Sentry:", e);
    }
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (!IS_BROWSER) return;

  // Set up web vitals reporting if available
  if (IS_PRODUCTION) {
    try {
      // Use updated web-vitals imports without deprecated functions
      import("web-vitals")
        .then((webVitals) => {
          // Use onCLS, onFID, etc. instead of deprecated getCLS, getFID, etc.
          webVitals.onCLS(sendToAnalytics);
          webVitals.onFID(sendToAnalytics);
          webVitals.onLCP(sendToAnalytics);
          webVitals.onFCP(sendToAnalytics);
          webVitals.onTTFB(sendToAnalytics);
        })
        .catch(() => {
          console.log("Web vitals not available");
        });
    } catch {
      // Package not available
    }
  }
}

/**
 * Send metrics to your analytics platform
 */
function sendToAnalytics({ name, delta }) {
  // Removed unused 'id' parameter
  // This would typically send data to your analytics platform
  if (IS_PRODUCTION) {
    console.log(`Metric: ${name} | Value: ${delta}`);

    // Example analytic event - only if gtag is available
    if (typeof window !== "undefined" && window.gtag) {
      try {
        window.gtag("event", name, {
          event_category: "Web Vitals",
          value: Math.round(delta),
          non_interaction: true,
        });
      } catch (e) {
        // Error sending to analytics
      }
    }
  }
}

// Initialize monitoring conditionally
if (IS_BROWSER) {
  // Delay initialization to ensure everything is loaded first
  setTimeout(() => {
    try {
      // Added error handling to prevent unused 'e' variable
      initClientMonitoring();
      initPerformanceMonitoring();
    } catch (error) {
      console.error("Error initializing monitoring:", error);
    }
  }, 0);
}
