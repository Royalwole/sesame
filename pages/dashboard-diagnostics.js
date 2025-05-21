import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head';
import Link from 'next/link';
import { FiCheck, FiX, FiAlertTriangle, FiRefreshCw, FiLock } from 'react-icons/fi';

export default function DashboardDiagnostics() {
  const auth = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFixing, setIsFixing] = useState(false);

  // Run diagnostics when the component mounts
  useEffect(() => {
    async function runDiagnostics() {
      try {
        // Wait for auth to be loaded
        if (auth.isLoading) return;

        setLoading(true);
        
        // Fetch permission diagnostics
        const response = await fetch('/api/diagnostics/permission-check');
        
        if (!response.ok) {
          throw new Error('Failed to fetch diagnostics');
        }
        
        const data = await response.json();
        setDiagnosticResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    runDiagnostics();
  }, [auth.isLoading]);
  
  // Function to fix permissions
  const fixPermissions = async () => {
    try {
      setIsFixing(true);
      
      // Call the direct fix endpoint
      const response = await fetch('/api/direct-fix', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply fix');
      }
      
      // Refresh the diagnostics
      window.location.href = '/dashboard-diagnostics?fixed=true&t=' + Date.now();
    } catch (err) {
      setError('Failed to fix permissions: ' + err.message);
      setIsFixing(false);
    }
  };

  // Extract URL query parameters
  const wasJustFixed = typeof window !== 'undefined' &&
    window.location.search.includes('fixed=true');

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard Diagnostics | TopDial</title>
      </Head>
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Access Diagnostics</h1>
          <p className="text-gray-600">
            This tool diagnoses and fixes issues with dashboard access and redirect loops.
          </p>
        </div>
        
        {/* Status message after fixing */}
        {wasJustFixed && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
            <div className="flex items-center">
              <FiCheck className="text-green-500 mr-2" size={20} />
              <span className="text-green-700">
                Permissions were updated successfully! Please try accessing your dashboard again.
              </span>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="border border-gray-200 rounded-md bg-white p-6 text-center mb-6">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full mb-3"></div>
            <p className="text-gray-600">Running diagnostics...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && !loading && (
          <div className="border border-red-200 rounded-md bg-red-50 p-6 mb-6">
            <div className="flex items-center mb-3">
              <FiAlertTriangle className="text-red-500 mr-2" size={20} />
              <h2 className="text-lg font-medium text-red-700">Diagnostic Error</h2>
            </div>
            <p className="text-red-600">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              <FiRefreshCw className="inline mr-2" />
              Retry
            </button>
          </div>
        )}
        
        {/* Diagnostic results */}
        {!loading && !error && diagnosticResults && (
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="border border-gray-200 rounded-md bg-white p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">User ID:</div>
                <div className="text-gray-900">{diagnosticResults.user.id}</div>
                
                <div className="text-gray-600">Role:</div>
                <div className="text-gray-900">{diagnosticResults.user.role}</div>
                
                <div className="text-gray-600">Approved:</div>
                <div className="text-gray-900">
                  {diagnosticResults.user.approved ? 
                    <span className="text-green-600 flex items-center">Yes <FiCheck className="ml-1" /></span> : 
                    <span className="text-red-600 flex items-center">No <FiX className="ml-1" /></span>
                  }
                </div>
                
                <div className="text-gray-600">Email:</div>
                <div className="text-gray-900">{diagnosticResults.technicalDetails.email}</div>
              </div>
            </div>

            {/* Access Info Card */}
            <div className="border border-gray-200 rounded-md bg-white p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Access Status</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  {diagnosticResults.access.canAccessAgentDashboard ? (
                    <>
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <FiCheck size={18} />
                      </div>
                      <span className="ml-2 text-green-700">You have access to the agent dashboard</span>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-red-100 text-red-600">
                        <FiLock size={18} />
                      </div>
                      <span className="ml-2 text-red-700">You cannot access the agent dashboard</span>
                    </>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-gray-700">Based on your current permissions, you should use:</p>
                  <p className="font-medium text-blue-600 mt-1">
                    {diagnosticResults.access.suggestedDashboard}
                  </p>
                  <Link
                    href={`${diagnosticResults.access.suggestedDashboard}?breakLoop=true&t=${Date.now()}`}
                    className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Suggested Dashboard
                  </Link>
                </div>
              </div>
            </div>

            {/* Permissions Fixes Card */}
            <div className="border border-gray-200 rounded-md bg-white p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Permission Fixes</h2>
              
              {diagnosticResults.fixes.needsRoleUpdate || diagnosticResults.fixes.needsApprovalUpdate ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <FiAlertTriangle className="text-yellow-600 mr-2" size={18} />
                      <span className="font-medium text-yellow-800">Permission Issues Detected</span>
                    </div>
                    <ul className="list-disc ml-6 text-yellow-800">
                      {diagnosticResults.fixes.needsRoleUpdate && (
                        <li>Your role needs to be changed to "agent"</li>
                      )}
                      {diagnosticResults.fixes.needsApprovalUpdate && (
                        <li>Your account needs to be marked as approved</li>
                      )}
                    </ul>
                  </div>
                  
                  <button
                    onClick={fixPermissions}
                    disabled={isFixing}
                    className={`w-full py-3 px-4 rounded text-white font-medium 
                      ${isFixing ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isFixing ? (
                      <>
                        <FiRefreshCw className="inline mr-2 animate-spin" />
                        Fixing Permissions...
                      </>
                    ) : (
                      <>
                        Fix My Permissions Now
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiCheck className="text-green-600 mr-2" size={18} />
                    <span className="font-medium text-green-800">
                      All permissions are correctly configured
                    </span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link 
                  href="/fix-dashboard"
                  className="text-center px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 text-sm"
                >
                  Advanced Fix Tools
                </Link>
                <Link 
                  href="/ultra-fix"
                  className="text-center px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 text-sm"
                >
                  Emergency Fix
                </Link>
              </div>
            </div>
            
            {/* Technical Details Disclosure */}
            <details className="border border-gray-200 rounded-md bg-white p-4">
              <summary className="cursor-pointer font-medium text-gray-700">
                Technical Details
              </summary>
              <div className="mt-4 bg-gray-50 p-4 rounded-md overflow-x-auto">
                <pre className="text-xs text-gray-800">
                  {JSON.stringify(diagnosticResults.technicalDetails, null, 2)}
                </pre>
              </div>
            </details>
            
            {/* Navigation links */}
            <div className="border-t border-gray-200 pt-4 mt-6 flex justify-between">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-800"
              >
                Back to Home
              </Link>
              <Link 
                href={diagnosticResults.access.suggestedDashboard}
                className="text-blue-600 hover:text-blue-800"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
