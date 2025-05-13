import { useState, useEffect, useCallback, useRef } from "react";
import { withAuth } from "../../../lib/withAuth";
import AdminLayout from "../../../components/layout/AdminLayout";
import UserRoleManager from "../../../components/admin/UserRoleManager";
import { FiArrowLeft, FiSearch, FiRefreshCw } from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";

function RoleManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const isMounted = useRef(true); // Add ref to track component mount state

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to fetch users from API - defined using useCallback to avoid recreating on each render
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Add circuit breaker for auth loops - check if we're in a redirect loop
      const isInLoop = new URLSearchParams(window.location.search).has("rc");

      // Use a modified fetch that includes a circuit breaker parameter if needed
      const url = isInLoop
        ? "/api/admin/users?noRedirect=true"
        : "/api/admin/users";

      const response = await fetch(url);

      if (response.status === 401 || response.status === 403) {
        // Authentication issue - try to break the loop
        console.warn(
          "Authentication issue detected, attempting to break potential loop"
        );
        window.location.href = "/dashboard/user?breakLoop=true&t=" + Date.now();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch users: ${response.status} ${response.statusText}`
        );
      }
      const responseData = await response.json();

      // Validate the response structure
      if (!responseData || responseData.success !== true) {
        throw new Error(
          "Invalid response: Expected a successful response from the server"
        );
      }

      // The API returns data in responseData.data.users format
      const userData = responseData.data || {};

      // Validate the users array exists
      if (!Array.isArray(userData.users)) {
        throw new Error(
          "Invalid response format: users data is missing or not in expected format"
        );
      }

      // Only update state if component is still mounted
      if (isMounted.current) {
        setUsers(userData.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Only update state if component is still mounted
      if (isMounted.current) {
        toast.error(error?.message || "Failed to load users");
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch users on initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search term - with additional safety checks
  const filteredUsers = users.filter((user) => {
    if (!user || !user.firstName || !user.lastName || !user.email) return false;
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const term = searchTerm.toLowerCase();

    return fullName.includes(term) || email.includes(term);
  });

  // Handle role change
  const handleRoleChange = useCallback(
    async (newRole) => {
      if (!selectedUser) return;

      // Update the local state to reflect the change immediately
      setUsers(
        users.map((user) =>
          user._id === selectedUser._id ? { ...user, role: newRole } : user
        )
      );

      // Clear selection after role change
      setSelectedUser(null);
    },
    [selectedUser, users]
  );

  // Function to render badge with appropriate color
  const getBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "agent":
        return "bg-purple-100 text-purple-800";
      case "agent_pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="User Role Management">
      <div className="space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/admin">
              <div className="mr-4 cursor-pointer hover:text-blue-600 transition-colors">
                <FiArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              User Role Management
            </h1>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Administrator Access
          </span>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="max-w-md relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md 
                ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"} 
                text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" /> Refresh
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      {loading ? "Loading users..." : "No users found"}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className={
                        selectedUser?._id === user._id ? "bg-blue-50" : ""
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getBadgeColor(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          className={`px-3 py-1 text-sm font-medium rounded-md 
                            ${
                              selectedUser?._id === user._id
                                ? "bg-blue-600 text-white"
                                : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                            }
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          onClick={() =>
                            setSelectedUser(
                              selectedUser?._id === user._id ? null : user
                            )
                          }
                        >
                          {selectedUser?._id === user._id
                            ? "Deselect"
                            : "Manage Role"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedUser ? (
            <div className="mt-8">
              <div className="text-lg font-bold mb-4">
                Manage Role for {selectedUser.firstName} {selectedUser.lastName}
              </div>
              <UserRoleManager
                userId={selectedUser._id}
                currentRole={selectedUser.role}
                onRoleChange={handleRoleChange}
              />
            </div>
          ) : (
            <div className="mt-4 text-gray-500 text-center">
              Select a user to manage their role
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default RoleManagementPage;

// Use withAuth with role=admin to protect this page
export const getServerSideProps = async (context) => {
  // Get the result from the withAuth HOC
  const authResult = await withAuth({ role: "admin" })(context);

  // Check if it already has a props key
  if (authResult && authResult.props) {
    return authResult;
  }

  // If not, wrap the result in a props object
  return {
    props: {
      ...(authResult || {}),
    },
  };
};
