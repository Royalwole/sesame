import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";

export default function AdminSignUpPage() {
  const router = useRouter();
  const { query } = router;
  const redirectTo = query.redirect_url || "/dashboard/admin";
  const roleSetUrl = `/api/auth/set-role-admin?redirect=${encodeURIComponent(redirectTo)}`;

  // Set a flag in sessionStorage to indicate this is a fresh signup
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("freshSignup", "true");
    }
  }, []);

  return (
    <>
      <Head>
        <title>Admin Sign Up | Topdial</title>
        <meta
          name="description"
          content="Create a Topdial administrator account"
        />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center mb-6 space-y-4">
          <h1 className="text-3xl font-bold text-wine">
            Administrator Registration
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Create your Topdial administrator account.
          </p>
        </div>

        <SignUp
          path="/auth/admin-signup"
          routing="path"
          signInUrl="/auth/sign-in"
          afterSignUpUrl={roleSetUrl}
          afterSignInUrl={redirectTo}
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "mx-auto",
              socialButtonsBlockButton: "max-w-full",
            },
          }}
        />

        <div className="mt-6 text-sm text-red-600">
          <p>Note: This page is for authorized administrative staff only.</p>
          <p>New admin accounts require approval by a super administrator.</p>
        </div>
      </div>
    </>
  );
}

// Use custom layout
AdminSignUpPage.getLayout = (page) => page;
