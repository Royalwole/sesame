import { useAuth } from "../../contexts/AuthContext";

export default function AuthStatus() {
  const {
    user,
    dbUser,
    isLoading,
    isAuthenticated,
    isAgent,
    isApprovedAgent,
    isAdmin,
    hasError,
    syncUserData,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="text-center p-4">Loading authentication status...</div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-red-800 font-medium">
          Failed to load authentication data
        </h3>
        <button
          onClick={syncUserData}
          className="mt-2 bg-red-100 text-red-800 px-4 py-2 rounded-md hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="text-center p-4">You are not signed in.</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-medium text-lg mb-2">Authentication Status</h3>
      <div className="space-y-2">
        <p>
          <span className="font-medium">Signed in as:</span> {user?.firstName}{" "}
          {user?.lastName}
        </p>
        <p>
          <span className="font-medium">Email:</span>{" "}
          {user?.primaryEmailAddress?.emailAddress}
        </p>
        {dbUser && (
          <>
            <p>
              <span className="font-medium">Role:</span> {dbUser.role}
            </p>
            <p>
              <span className="font-medium">Approved:</span>{" "}
              {dbUser.approved ? "Yes" : "No"}
            </p>
            <div className="flex space-x-2 mt-3">
              {isAgent && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Agent
                </span>
              )}
              {isApprovedAgent && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Approved Agent
                </span>
              )}
              {isAdmin && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  Admin
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
