import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useUser, useClerk } from "@clerk/nextjs";
import Head from "next/head";
import { useEffect, useState, useRef } from "react";

export default function SignInPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showSignIn, setShowSignIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  // Add ref to track redirects
  const hasRedirected = useRef(false);

  // Get the redirect URL from the query string or use a default
  const redirectTo = router.query.redirect_url || "/dashboard";

  // Force sign out if requested via query parameter
  const forceSignOut = router.query.force === "true";

  // Handle existing sessions
  useEffect(() => {
    // Don't do anything until Clerk is loaded
    if (!isLoaded) return;

    // Handle signed-in users
    if (isSignedIn) {
      // If forcing sign-out, do that first
      if (forceSignOut) {
        setIsSigningOut(true);
        signOut().then(() => {
          setIsSigningOut(false);
          setShowSignIn(true);
        });
        return;
      }

      // Otherwise redirect to dashboard if not already redirected
      if (!hasRedirected.current && !forceSignOut) {
        console.log("Already signed in, redirecting to:", redirectTo);
        hasRedirected.current = true;

        // Short delay to avoid immediate redirects
        setTimeout(() => {
          router.replace(redirectTo);
        }, 100);
      }
    } else {
      // Not signed in, show sign-in UI
      setShowSignIn(true);
    }
  }, [isSignedIn, isLoaded, router, redirectTo, forceSignOut, signOut]);

  // Debug information
  useEffect(() => {
    console.log("Sign-in page state:", {
      isLoaded,
      isSignedIn,
      redirectTo,
      showSignIn,
      isSigningOut,
      query: router.query,
    });
  }, [
    isLoaded,
    isSignedIn,
    redirectTo,
    showSignIn,
    isSigningOut,
    router.query,
  ]);

  return (
    <>
      <Head>
        <title>Sign In | TopDial</title>
        <meta name="description" content="Sign in to your TopDial account" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {isSigningOut && (
          <div className="mb-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Signing out...</p>
          </div>
        )}

        {!isLoaded && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading...</p>
          </div>
        )}

        {isLoaded && !isSignedIn && showSignIn && (
          <div className="max-w-md w-full">
            <SignIn
              path="/auth/sign-in"
              routing="path"
              signUpUrl="/auth/sign-up"
              afterSignInUrl={redirectTo} // Updated from redirectUrl to afterSignInUrl
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-xl border border-gray-200",
                  headerTitle: "text-2xl font-bold",
                  headerSubtitle: "text-gray-500",
                },
              }}
            />

            {/* Show a message if coming from a forced sign-out */}
            {forceSignOut && (
              <div className="mt-4 text-center text-sm text-gray-600">
                You've been signed out. Please sign in again.
              </div>
            )}
          </div>
        )}

        {isLoaded && isSignedIn && !forceSignOut && (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              You're already signed in
            </h2>
            <p className="text-gray-600 mb-4">
              Would you like to continue to your dashboard or sign in with a
              different account?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(redirectTo)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Continue to Dashboard
              </button>
              <button
                onClick={() => {
                  router.push(
                    `/auth/sign-in?force=true&redirect_url=${encodeURIComponent(
                      redirectTo
                    )}`
                  );
                }}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Sign in with a different account
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Set custom layout to avoid showing header/footer
SignInPage.getLayout = (page) => page;
