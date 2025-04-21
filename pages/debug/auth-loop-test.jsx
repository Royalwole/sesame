import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AuthLoopTestPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [apiStatus, setApiStatus] = useState({ loading: false, data: null, error: null });
  const [redirectHistory, setRedirectHistory] = useState([]);
  const [testPath, setTestPath] = useState("/admin");

  // Track redirects
  useEffect(() => {
    const currentPath = window.location.pathname + window.location.search;
    setRedirectHistory(prev => [...prev, { 
      time: new Date().toISOString(), 
      path: currentPath 
    }]);
  }, [router.asPath]);

  // Test API auth
  const checkApiAuth = async () => {
    setApiStatus({ loading: true, data: null, error: null });
    try {
      const response = await fetch('/api/debug/auth-status');
      const data = await response.json();
      setApiStatus({ loading: false, data, error: null });
    } catch (error) {
      setApiStatus({ loading: false, data: null, error: error.message });
    }
  };

  // Try navigating to test path
  const navigateToTestPath = () => {
    router.push(testPath);
  };

  return (
    <>
      <Head>
        <title>Auth Loop Test | TopDial Debug</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Authentication Debug Tool</h1>
            <p className="text-gray-600">Use this page to diagnose redirect loops and authentication issues</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Status */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Clerk Auth Status</h2>
              
              {!isLoaded ? (
                <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
              ) : (
                <div className="space-y-2">
                  <p><strong>Loaded:</strong> {String(isLoaded)}</p>
                  <p><strong>Signed In:</strong> {String(isSignedIn)}</p>
                  <p><strong>User ID:</strong> {user?.id || "Not signed in"}</p>
                  {isSignedIn && (
                    <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || "No email"}</p>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex space-x-2">
                {!isSignedIn ? (
                  <Link href="/auth/sign-in" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Sign In
                  </Link>
                ) : (
                  <button
                    onClick={() => window.location.href = "/api/auth/signout"}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
            
            {/* API Auth Test */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">API Auth Test</h2>
              <button 
                onClick={checkApiAuth} 
                disabled={apiStatus.loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {apiStatus.loading ? "Checking..." : "Check API Auth Status"}
              </button>
              
              {apiStatus.error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                  Error: {apiStatus.error}
                </div>
              )}
              
              {apiStatus.data && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <pre className="text-xs overflow-auto max-h-40">
                    {JSON.stringify(apiStatus.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            {/* Protected Route Test */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Test Protected Route</h2>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={testPath}
                  onChange={e => setTestPath(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="/admin"
                />
                <button
                  onClick={navigateToTestPath}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Navigate
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Try navigating to a protected path to test authentication redirection.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => setTestPath("/admin")}
                  className="mr-2 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  /admin
                </button>
                <button
                  onClick={() => setTestPath("/dashboard/admin")}
                  className="mr-2 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  /dashboard/admin
                </button>
                <button
                  onClick={() => setTestPath("/dashboard/user")}
                  className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  /dashboard/user
                </button>
              </div>
            </div>
            
            {/* Redirect History */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Redirect History</h2>
              {redirectHistory.length === 0 ? (
                <p className="text-gray-500">No redirects recorded yet.</p>
              ) : (
                <div className="overflow-auto max-h-60">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redirectHistory.map((redirect, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                          <td className="px-3 py-2">{index + 1}</td>
                          <td className="px-3 py-2">
                            {new Date(redirect.time).toLocaleTimeString()}
                          </td>
                          <td className="px-3 py-2 font-mono">{redirect.path}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={() => setRedirectHistory([])}
                    className="mt-3 px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Clear History
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>If you see infinite redirects between pages, check the middleware configuration.</li>
              <li>API endpoints should not redirect to sign-in pages.</li>
              <li>The auth debug API should always be accessible to help diagnose issues.</li>
              <li>Clear cookies and local storage if authentication state becomes corrupted.</li>
              <li>Compare the Clerk authentication state with your database user records.</li>
            </ul>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-blue-600 hover:underline">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}