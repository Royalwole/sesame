/**
 * Central monitoring setup for the application
 * Configures client-side and server-side monitoring
 */

// Configuration parameters
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV;
const IS_BROWSER = typeof window !== 'undefined';
const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Initialize client-side error monitoring
 */
export function initClientMonitoring() {
  if (!IS_BROWSER) return;
  
  // Check if we need to initialize Sentry
  if (IS_PRODUCTION && SENTRY_DSN) {
    console.log('Production environment detected - monitoring would be initialized with a proper Sentry DSN');
    
    // Safely check if Sentry is available without causing build errors
    try {
      // Instead of importing directly, check if the module is available
      const sentryModule = require('@sentry/browser');
      if (sentryModule) {
        const Sentry = sentryModule;
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: NODE_ENV,
          release: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
          tracesSampleRate: 0.2,
          // Rest of the configuration...
        });
        console.log('Sentry browser monitoring initialized');
      }
    } catch (e) {
      console.log('Sentry not available - error monitoring disabled');
      // Fallback to console logging for errors in development
      if (NODE_ENV !== 'production') {
        // Set up a basic error handler as fallback
        window.addEventListener('error', (event) => {
          console.error('Unhandled error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
          console.error('Unhandled promise rejection:', event.reason);
        });
      }
    }
  } else {
    console.log('Client monitoring disabled in development/test mode');
  }
}

/**
 * Log client-side error
 */
export function logClientError(error, context = {}) {
  // Always log to console
  console.error('Client error:', error, context);
  
  // Only try to use Sentry if we're in a browser and in production
  if (IS_BROWSER && IS_PRODUCTION && SENTRY_DSN) {
    try {
      // Check if Sentry is available without causing imports
      const Sentry = window.Sentry || require('@sentry/browser');
      if (Sentry) {
        Sentry.withScope(scope => {
          // Add context information for better debugging
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
          
          // Add user context if available
          try {
            const userToken = localStorage.getItem('userToken');
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
      // Sentry not available, skip error reporting
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
      // Use a dynamic import that won't break the build if the package is missing
      import('web-vitals').then(({ getCLS, getFID, getLCP, getFCP, getTTFB }) => {
        getCLS(sendToAnalytics);
        getFID(sendToAnalytics);
        getLCP(sendToAnalytics);
        getFCP(sendToAnalytics);
        getTTFB(sendToAnalytics);
      }).catch(e => {
        console.log('Web vitals not available');
      });
    } catch (e) {
      // Package not available
    }
  }
}

/**
 * Send metrics to your analytics platform
 */
function sendToAnalytics({ name, delta, id }) {
  // This would typically send data to your analytics platform
  if (IS_PRODUCTION) {
    console.log(`Metric: ${name} | Value: ${delta}`);
    
    // Example analytic event - only if gtag is available
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', name, {
          event_category: 'Web Vitals',
          event_label: id,
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
    initClientMonitoring();
    initPerformanceMonitoring();
  }, 0);
}
