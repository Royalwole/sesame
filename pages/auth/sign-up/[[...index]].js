import { SignUp } from "@clerk/nextjs";
import Head from "next/head";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Create Account - TopDial</title>
        <meta name="description" content="Create a new account on TopDial" />
      </Head>

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-wine">TopDial</h1>
          <p className="mt-2 text-gray-600">Create a new account</p>
        </div>

        <div className="bg-white py-8 px-4 shadow-md rounded-lg sm:px-10">
          <SignUp
            path="/auth/sign-up"
            routing="path"
            signInUrl="/auth/sign-in"
            afterSignUpUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
