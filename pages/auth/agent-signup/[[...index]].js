import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect } from "react";

export default function AgentSignUpPage() {
  const router = useRouter();
  const { query } = router;
  const redirectTo = query.redirect_url || "/dashboard/agent";
  const roleSetUrl = `/api/auth/set-role-agent?redirect=${encodeURIComponent(redirectTo)}`;

  // Set a flag in sessionStorage to indicate this is a fresh signup
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("freshSignup", "true");
    }
  }, []);

  return (
    <>
      <Head>
        <title>Sign Up as Agent | Topdial</title>
        <meta name="description" content="Create a Topdial agent account" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center mb-6 space-y-4">
          <h1 className="text-3xl font-bold text-wine">
            Join Topdial as an Agent
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Create your agent account to start listing properties and connect
            with potential buyers.
          </p>
        </div>

        <SignUp
          path="/auth/agent-signup"
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
      </div>
    </>
  );
}

// Use custom layout
AgentSignUpPage.getLayout = (page) => page;
