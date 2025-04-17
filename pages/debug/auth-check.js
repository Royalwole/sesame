import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import Head from "next/head";

export default function AuthCheckPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { dbUser, isAdmin, isAgent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.group("Auth Debug Info");
    console.log("Clerk auth state:", { isLoaded, isSignedIn, user: !!user });
    console.log("Auth context state:", {
      isLoading,
      dbUser: dbUser
        ? {
            role: dbUser.role,
            id: dbUser._id,
            isFallback: dbUser.isFallback,
          }
        : null,
      isAdmin,
      isAgent,
    });
    console.groupEnd();
  }, [isLoaded, isSignedIn, user, dbUser, isAdmin, isAgent, isLoading]);

  return (
    <>
      <Head>
        <title>Auth Check | TopDial Debug</title>
      </Head>

      <div className="container mx-auto p-6 max-w-3xl">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Authentication Check</h1>

          <div className="space-y-4 mb-8">
            <div className="border rounded-md p-4">
              <h2 className="font-medium mb-2">Clerk Status</h2>
              <p>
                <strong>isLoaded:</strong> {String(isLoaded)}
              </p>
              <p>
                <strong>isSignedIn:</strong> {String(isSignedIn)}
              </p>
              <p>
                <strong>User ID:</strong> {user?.id || "Not signed in"}
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h2 className="font-medium mb-2">Auth Context Status</h2>
              <p>
                <strong>isLoading:</strong> {String(isLoading)}
              </p>
              <p>
                <strong>User Role:</strong> {dbUser?.role || "Not available"}
              </p>
              <p>
                <strong>isAdmin:</strong> {String(isAdmin)}
              </p>
              <p>
                <strong>isAgent:</strong> {String(isAgent)}
              </p>
              <p>
                <strong>Using Fallback:</strong> {String(!!dbUser?.isFallback)}
              </p>
            </div>

            <div className="border rounded-md p-4">
              <h2 className="font-medium mb-2">Current Route</h2>
              <p>
                <strong>Path:</strong> {router.pathname}
              </p>
              <p>
                <strong>asPath:</strong> {router.asPath}
              </p>
              <p>
                <strong>Query:</strong> {JSON.stringify(router.query)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-medium">Test Role-Based Routes</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded"
              >
                Go to Dashboard
              </button>

              <button
                onClick={() => router.push("/dashboard/admin")}
                className="bg-red-100 text-red-800 px-3 py-1.5 rounded"
              >
                Go to Admin Dashboard
              </button>

              <button
                onClick={() => router.push("/dashboard/agent")}
                className="bg-green-100 text-green-800 px-3 py-1.5 rounded"
              >
                Go to Agent Dashboard
              </button>

              <button
                onClick={() => router.push("/debug/role-check")}
                className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded"
              >
                Go to Role Checker
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
