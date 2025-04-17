import { SignIn, SignUp, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Head from "next/head";

export default function AuthPage() {
  const router = useRouter();
  const { pathname, query } = router;
  const { signOut } = useClerk();

  const redirectTo = query.redirect_url || "/";

  // Handle sign-in and all its subpaths
  if (pathname.includes("/sign-in") || pathname === "/auth") {
    return (
      <>
        <Head>
          <title>Sign In | TopDial</title>
          <meta name="description" content="Sign in to your TopDial account" />
        </Head>
        <div className="flex min-h-screen items-center justify-center">
          <SignIn
            path="/auth/sign-in"
            routing="path"
            signUpUrl="/auth/sign-up"
            afterSignInUrl={redirectTo} // Updated from redirectUrl to afterSignInUrl
          />
        </div>
      </>
    );
  }

  // Handle sign-up and all its subpaths (including verification)
  if (pathname.includes("/sign-up")) {
    return (
      <>
        <Head>
          <title>Sign Up | TopDial</title>
          <meta name="description" content="Create a TopDial account" />
        </Head>
        <div className="flex min-h-screen items-center justify-center">
          <SignUp
            path="/auth/sign-up"
            routing="path"
            signInUrl="/auth/sign-in"
            afterSignUpUrl={redirectTo} // Updated from redirectUrl to afterSignUpUrl
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "mx-auto",
                socialButtonsBlockButton: "max-w-full",
              },
            }}
          />
        </div>
      </>
    );
  }

  // Handle sign-out
  if (pathname.includes("/sign-out")) {
    signOut();
    router.push("/");
    return null;
  }

  // Default fallback
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
        <div className="space-y-4">
          <button
            onClick={() => router.push("/auth/sign-in")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/auth/sign-up")}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

// Use custom layout
AuthPage.getLayout = (page) => page;
