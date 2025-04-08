import { SignIn, SignUp } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Safely access pathname on the client side
    setIsSignUp(window.location.pathname.includes("sign-up"));
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen py-12">
      {isSignUp ? (
        <SignUp
          path="/auth/sign-up"
          routing="path"
          signInUrl="/auth/sign-in"
          redirectUrl="/dashboard"
          onError={(error) => alert(`Sign Up Error: ${error.message}`)} // Error handling
        />
      ) : (
        <SignIn
          path="/auth/sign-in"
          routing="path"
          signUpUrl="/auth/sign-up"
          redirectUrl="/dashboard"
          onError={(error) => alert(`Sign In Error: ${error.message}`)} // Error handling
        />
      )}
    </div>
  );
}
