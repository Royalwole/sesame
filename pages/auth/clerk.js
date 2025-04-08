import { SignIn, SignUp, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function AuthPage() {
  const { pathname } = useRouter();
  const { signOut } = useClerk();

  // Determine which component to show based on the route
  if (pathname.includes("/sign-in")) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        key="sign-in"
      >
        <SignIn routing="path" path="/auth/sign-in" />
      </div>
    );
  }

  if (pathname.includes("/sign-up")) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        key="sign-up"
      >
        <SignUp routing="path" path="/auth/sign-up" />
      </div>
    );
  }

  if (pathname.includes("/sign-out")) {
    // Handle sign-out
    signOut();
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        key="sign-out"
      >
        <p className="text-xl">Signing you out...</p>
      </div>
    );
  }

  // Default auth landing page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Authentication</h1>
      <div className="flex gap-4">
        <a
          href="/auth/sign-in"
          className="px-4 py-2 bg-wine text-white rounded hover:bg-opacity-90"
        >
          Sign In
        </a>
        <a
          href="/auth/sign-up"
          className="px-4 py-2 bg-wine text-white rounded hover:bg-opacity-90"
        >
          Sign Up
        </a>
      </div>
    </div>
  );
}
