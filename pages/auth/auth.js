import { SignIn, SignUp } from "@clerk/nextjs";

export default function AuthPage() {
  const path = window.location.pathname;

  return (
    <div className="flex justify-center items-center min-h-screen py-12">
      {path.includes("sign-up") ? (
        <SignUp
          path="/auth/sign-up"
          routing="path"
          signInUrl="/auth/sign-in"
          redirectUrl="/dashboard"
        />
      ) : (
        <SignIn
          path="/auth/sign-in"
          routing="path"
          signUpUrl="/auth/sign-up"
          redirectUrl="/dashboard"
        />
      )}
    </div>
  );
}
