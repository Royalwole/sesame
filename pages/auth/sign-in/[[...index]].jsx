import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [redirectPath, setRedirectPath] = useState("/dashboard");
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  
  // Process the redirect URL from query params 
  const processRedirectUrl = useCallback(() => {
    if (!router.isReady) return "/dashboard";
    
    try {
      const redirectParam = router.query.redirect_url;
      
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
      
      return decodedUrl;
    } catch (e) {
      console.error("Error processing redirect URL:", e);
      return "/dashboard";
    }
  }, [router.isReady, router.query.redirect_url]);
  
  // Set redirect path when router is ready
  useEffect(() => {
    if (router.isReady) {
      const path = processRedirectUrl();
      console.log("Redirect path set to:", path);
      setRedirectPath(path);
    }
  }, [router.isReady, processRedirectUrl]);
  
  // Handle redirect for already signed-in users
  useEffect(() => {
    // Only process when auth is loaded and not already handling redirect
    if (!isLoaded || isProcessingRedirect) return;
    
    if (isSignedIn) {
      console.log("User already signed in, redirecting to:", redirectPath);
      setIsProcessingRedirect(true);
      
      // Use location.replace for a clean redirect
      window.location.replace(redirectPath);
    }
  }, [isLoaded, isSignedIn, redirectPath, isProcessingRedirect]);
  
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
