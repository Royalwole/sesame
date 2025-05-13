import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const [redirectPath, setRedirectPath] = useState("/dashboard");
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [loopDetected, setLoopDetected] = useState(false);
  
  // Process the redirect URL from query params 
  const processRedirectUrl = useCallback(() => {
    if (!router.isReady) return "/dashboard";
    
    try {
      const redirectParam = router.query.redirect_url;
      const breakLoopParam = router.query.breakLoop;
      
      // If breakLoop is present, there's a risk of loop
      if (breakLoopParam === "true") {
        console.warn("Loop protection triggered via URL param");
        setLoopDetected(true);
      }
      
      if (!redirectParam) {
        return "/dashboard"; // Default if no param
      }
      
      // Handle decoded or encoded URLs
      let decodedUrl;
      try {
        decodedUrl = decodeURIComponent(redirectParam);
      } catch (e) {
        decodedUrl = redirectParam; // Already decoded
      }
      
      // For full URLs, extract just the path
      if (decodedUrl.startsWith('http')) {
        try {
          const url = new URL(decodedUrl);
          return url.pathname + url.search + url.hash;
        } catch (e) {
          console.error("Invalid URL:", decodedUrl);
          return "/dashboard";
        }
      }
      
      // Check specifically for admin dashboard redirect loops
      if (decodedUrl.includes("/dashboard/admin")) {
        // Count timestamps in the URL as a loop indicator
        const timestamps = (decodedUrl.match(/t=/g) || []).length;
        if (timestamps > 1) {
          console.warn("Detected potential admin dashboard redirect loop");
          setLoopDetected(true);
        }
      }
      
      return decodedUrl;
    } catch (e) {
      console.error("Error processing redirect URL:", e);
      return "/dashboard";
    }
  }, [router.isReady, router.query]);
  
  // Set redirect path when router is ready
  useEffect(() => {
    if (router.isReady) {
      const path = processRedirectUrl();
      console.log("Redirect path set to:", path);
      setRedirectPath(path);
    }
  }, [router.isReady, processRedirectUrl]);
  
  // Effect to handle redirect for already signed-in users
  useEffect(() => {
    // Only process when auth is loaded and not already handling redirect
    if (!isLoaded || isProcessingRedirect) return;
    
    if (isSignedIn && user) {
      setIsProcessingRedirect(true);
      
      try {
        // Use direct role checking to avoid import dependencies that may cause issues
        const directRole = user.publicMetadata?.role || "user";
        const isApproved = user.publicMetadata?.approved === true;
        
        // Determine dashboard path directly based on role
        let roleDashboard = "/dashboard/user"; // Default fallback
        
        if ((directRole === "admin" || directRole === "super_admin") && isApproved) {
          roleDashboard = "/dashboard/admin";
        } else if (directRole === "agent" && isApproved) {
          roleDashboard = "/dashboard/agent";
        } else if (directRole === "agent_pending") {
          roleDashboard = "/dashboard/pending";
        }
        
        console.log("Role-based dashboard path:", roleDashboard, "Role:", directRole, "Approved:", isApproved);
        
        // ENHANCED LOOP DETECTION
        // More aggressive loop detection
        let finalRedirectPath = redirectPath;
        let queryParams = new URLSearchParams(window.location.search);
        const hasBreakLoop = queryParams.has('breakLoop');
        const hasMultipleTimestamps = (window.location.search.match(/t=/g) || []).length > 1;
        const hasRcParam = queryParams.has('rc');
        
        // Consider multiple signs of loop detection
        const loopDetectedNow = loopDetected || hasBreakLoop || hasMultipleTimestamps || hasRcParam;
        
        // Force loop breaking if needed
        if (loopDetectedNow) {
          console.log("Breaking potential redirect loop");
          finalRedirectPath = roleDashboard + "?breakLoop=true&noRedirect=true&t=" + Date.now();
        } 
        // Detect if redirect_url is to another sign-in page or an invalid path
        else if (
            redirectPath.includes("/auth/sign-in") || 
            (redirectPath.includes("/dashboard/admin") && directRole !== "admin" && directRole !== "super_admin") ||
            (redirectPath.includes("/dashboard/agent") && !(directRole === "agent" && isApproved))
        ) {
          console.log("Detected redirect to inappropriate path, redirecting to role-specific dashboard");
          finalRedirectPath = roleDashboard + "?breakLoop=true&t=" + Date.now();
        }
        // Going to generic dashboard - ensure role-specific path
        else if (redirectPath === "/dashboard") {
          finalRedirectPath = roleDashboard;
        }
        
        // Always add cache-breaking parameter if not present
        if (!finalRedirectPath.includes("t=")) {
          const separator = finalRedirectPath.includes("?") ? "&" : "?";
          finalRedirectPath = `${finalRedirectPath}${separator}t=${Date.now()}`;
        }
        
        console.log("User already signed in, redirecting to:", finalRedirectPath);
        
        // Clear any redirect cookies
        document.cookie = "td_redirect_count=0; path=/; max-age=3600";
        
        // Use location.replace for a clean redirect - but add a small delay to ensure cookie is cleared
        setTimeout(() => {
          window.location.replace(finalRedirectPath);
        }, 50);
      } catch (error) {
        console.error("Error during role-based redirection:", error);
        // Fallback to user dashboard if there's an error - with circuit breaker
        window.location.replace("/dashboard/user?breakLoop=true&error=redirect_failed&t=" + Date.now());
      }
    }
  }, [isLoaded, isSignedIn, redirectPath, isProcessingRedirect, user, loopDetected]);
  
  // Loading state when Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }
  
  // If loop detected and user is signed in, show a manual redirect option
  if (loopDetected && isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-yellow-500 text-5xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Navigation Issue Detected</h2>
          <p className="mb-6 text-gray-600">
            We detected a potential navigation loop. Please select where you'd like to go:
          </p>
          <div className="flex flex-col space-y-3">
            <a 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Dashboard Home
            </a>
            {user?.publicMetadata?.role === 'admin' && (
              <a 
                href="/dashboard/admin?breakLoop=true" 
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              >
                Admin Dashboard 
              </a>
            )}
            {(user?.publicMetadata?.role === 'agent' || user?.publicMetadata?.role === 'pending_agent') && (
              <a 
                href="/dashboard/agent?breakLoop=true" 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Agent Dashboard
              </a>
            )}
            <a 
              href="/dashboard/user?breakLoop=true" 
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              User Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // If already signed in but redirect hasn't happened yet, show processing state
  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">You're already signed in. Redirecting...</p>
          <button
            onClick={() => window.location.href = redirectPath}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Click here if you're not redirected automatically
          </button>
        </div>
      </div>
    );
  }
  
  // Show sign-in form for not authenticated users
  return (
    <>
      <Head>
        <title>Sign In | Topdial</title>
        <meta name="description" content="Sign in to your Topdial.ng account" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mb-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <img src="/logo.svg" alt="TopDial" className="h-12 mx-auto" />
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">Sign in to your Topdial account</p>
          </div>
        
          <SignIn
            path="/auth/sign-in"
            routing="path"
            signUpUrl="/auth/sign-up"
            redirectUrl={redirectPath}
            afterSignInUrl={redirectPath}
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl border border-gray-200",
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-gray-500",
              },
            }}
          />
          
          <div className="mt-4 text-center">
            <Link href="/auth/sign-up" className="text-sm text-blue-600 hover:text-blue-800 underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
        
        {/* Debug info - only in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 p-4 rounded text-xs max-w-md w-full mt-6 opacity-80 hover:opacity-100">
            <p><strong>Debug Info:</strong></p>
            <p>Redirect path: {redirectPath}</p>
            <p>Loop detected: {loopDetected ? "Yes" : "No"}</p>
            <p>Query parameters: {JSON.stringify(router.query)}</p>
            <p>Auth loaded: {isLoaded ? "Yes" : "No"}</p>
          </div>
        )}
      </div>
    </>
  );
}

// Use custom layout without header/footer
SignInPage.getLayout = (page) => page;
