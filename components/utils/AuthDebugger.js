import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const auth = useAuth();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-3 py-2 rounded-md text-xs"
      >
        {isOpen ? "Hide Auth Debug" : "Auth Debug"}
      </button>

      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-4 mt-2 w-96 max-h-[80vh] overflow-auto">
          <h4 className="font-bold mb-2">Auth Status</h4>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-sm">
              <span className="font-medium">Authentication:</span>
              <span
                className={`ml-2 ${
                  auth.isAuthenticated ? "text-green-600" : "text-red-600"
                }`}
              >
                {auth.isAuthenticated ? "Signed in" : "Not signed in"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Loading:</span>
              <span
                className={`ml-2 ${
                  auth.isLoading ? "text-yellow-600" : "text-green-600"
                }`}
              >
                {auth.isLoading ? "Loading..." : "Complete"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Agent:</span>
              <span
                className={`ml-2 ${
                  auth.isAgent ? "text-green-600" : "text-gray-600"
                }`}
              >
                {auth.isAgent ? "Yes" : "No"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Approved Agent:</span>
              <span
                className={`ml-2 ${
                  auth.isApprovedAgent ? "text-green-600" : "text-gray-600"
                }`}
              >
                {auth.isApprovedAgent ? "Yes" : "No"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Pending Agent:</span>
              <span
                className={`ml-2 ${
                  auth.isPendingAgent ? "text-yellow-600" : "text-gray-600"
                }`}
              >
                {auth.isPendingAgent ? "Yes" : "No"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Admin:</span>
              <span
                className={`ml-2 ${
                  auth.isAdmin ? "text-purple-600" : "text-gray-600"
                }`}
              >
                {auth.isAdmin ? "Yes" : "No"}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Error:</span>
              <span
                className={`ml-2 ${
                  auth.hasError ? "text-red-600" : "text-green-600"
                }`}
              >
                {auth.hasError ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="mt-4 mb-2">
            <h5 className="font-medium">User Details</h5>
          </div>
          <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-60 overflow-auto">
            {JSON.stringify(
              {
                clerk: auth.user
                  ? {
                      id: auth.user.id,
                      firstName: auth.user.firstName,
                      lastName: auth.user.lastName,
                      email: auth.user.primaryEmailAddress?.emailAddress,
                    }
                  : null,
                db: auth.dbUser,
              },
              null,
              2
            )}
          </pre>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => auth.syncUserData()}
              className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs"
            >
              Sync User Data
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-3 py-1 rounded-md text-xs"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
