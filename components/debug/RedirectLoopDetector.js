import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * RedirectLoopDetector - A component that detects potential redirect loops
 * and provides self-healing capabilities for permission issues
 */
export default function RedirectLoopDetector({ onDetect }) {
  const router = useRouter();
  const [loopDetected, setLoopDetected] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    timestamps: 0,
    redirectCounters: 0,
    urlLength: 0,
    query: {},
    pathHistory: [],
  });
  const [hasAppliedFix, setHasAppliedFix] = useState(false);

  // Run diagnostics on mount and route changes
  useEffect(() => {
    // Track path history in session storage
    try {
      const pathHistory = JSON.parse(sessionStorage.getItem('topdial_path_history') || '[]');
      const currentPath = window.location.pathname + window.location.search;
      
      // Add current path to history
      pathHistory.push({
        path: currentPath,
        timestamp: Date.now()
      });
      
      // Keep only the last 10 paths
      if (pathHistory.length > 10) {
        pathHistory.shift();
      }
      
      sessionStorage.setItem('topdial_path_history', JSON.stringify(pathHistory));

      // Basic loop detection
      const pathCounts = {};
      let potentialLoop = false;
      
      // Check for the same path appearing multiple times in recent history
      pathHistory.forEach(entry => {
        const cleanPath = entry.path.split('?')[0]; // Ignore query params for detection
        pathCounts[cleanPath] = (pathCounts[cleanPath] || 0) + 1;
        if (pathCounts[cleanPath] >= 3) {
          potentialLoop = true;
        }
      });
      
      // Check for additional signs of redirect loops
      const { search, pathname } = window.location;
      const urlParams = new URLSearchParams(search);
      
      // Count timestamps in URL
      const timestamps = (search.match(/[?&]t=/g) || []).length;
      
      // Check for redirect counters
      const hasRedirectCounters = urlParams.has('rc') || search.includes('redirectCount');
      
      // Excessive URL length can indicate accumulating parameters
      const urlLengthExcessive = search.length > 200;
      
      // Loop detection
      const automaticLoopDetected = 
        potentialLoop || 
        timestamps >= 2 || 
        urlLengthExcessive;
      
      // Update diagnostics
      setDiagnostics({
        timestamps,
        redirectCounters: hasRedirectCounters ? 1 : 0,
        urlLength: search.length,
        query: Object.fromEntries(urlParams.entries()),
        pathHistory: pathHistory.map(p => p.path),
      });
      
      // Set loop detected state
      if (automaticLoopDetected && !loopDetected) {
        setLoopDetected(true);
        
        // Call the onDetect callback if provided
        if (onDetect && typeof onDetect === 'function') {
          onDetect({
            isLoop: true,
            diagnostics: {
              timestamps,
              redirectCounters: hasRedirectCounters ? 1 : 0,
              urlLength: search.length,
              query: Object.fromEntries(urlParams.entries()),
              pathHistory: pathHistory.map(p => p.path),
            }
          });
        }
        
        console.warn('[RedirectLoopDetector] Potential redirect loop detected', {
          timestamps,
          urlLengthExcessive,
          hasRedirectCounters,
          pathHistory: pathHistory.map(p => p.path),
        });
      }
    } catch (error) {
      console.error('[RedirectLoopDetector] Error in loop detection:', error);
    }
  }, [router.asPath, loopDetected, onDetect]);

  // Function to attempt fixing permissions automatically
  const attemptAutoFix = async () => {
    try {
      setHasAppliedFix(true);
      
      // Call the direct-fix API endpoint to fix user roles/permissions
      const res = await fetch('/api/direct-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check if the fix was successful
      if (res.ok) {
        // Reload the page with circuit breaker parameters
        window.location.href = `/dashboard/agent?fixed=true&breakLoop=true&t=${Date.now()}`;
      } else {
        // If the fix failed, redirect to the ultra-fix page which has less JS dependencies
        window.location.href = `/ultra-fix?from=auto-fix&t=${Date.now()}`;
      }
    } catch (error) {
      console.error('[RedirectLoopDetector] Error applying auto-fix:', error);
      // Redirect to ultra-fix page on error
      window.location.href = `/ultra-fix?from=auto-fix-error&t=${Date.now()}`;
    }
  };

  // Only render the component if a loop is detected
  if (!loopDetected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-50 border-b border-red-200 p-3 z-50">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h2 className="text-red-600 font-semibold">Redirect Loop Detected</h2>
            <p className="text-sm text-red-800">
              Your account may have permission issues causing redirect loops.
            </p>
          </div>
          
          <div className="mt-2 md:mt-0">
            {!hasAppliedFix ? (
              <button
                onClick={attemptAutoFix}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
              >
                Auto-Fix Permissions
              </button>
            ) : (
              <span className="text-sm text-red-600">Applying fix...</span>
            )}
            
            <a 
              href="/ultra-fix"
              className="ml-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-1 rounded text-sm"
            >
              Go to Fix Tools
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
