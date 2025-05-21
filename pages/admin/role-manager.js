import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { withAuth } from "../../lib/withAuth";
import { ROLES } from "../../lib/role-management";
import { clearUserPermissionCache } from "../../lib/permissions-manager";

function AdminRoleManager() {
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [selectedRole, setSelectedRole] = useState("agent");
  const [approved, setApproved] = useState(true);

  const handleLookupUser = async () => {
    if (!userId && !userEmail) {
      setMessage("Please enter a user ID or email");
      setStatus("error");
      return;
    }

    setLoading(true);
    setMessage("Looking up user...");
    setStatus("info");

    try {
      const res = await fetch("/api/admin/user-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId || undefined,
          email: userEmail || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to lookup user");
      }

      setUserId(data.user.id);
      setUserEmail(data.user.emailAddress);
      setSelectedRole(data.user.publicMetadata?.role || "user");
      setApproved(data.user.publicMetadata?.approved === true);

      setMessage(`User found: ${data.user.firstName} ${data.user.lastName}`);
      setStatus("success");
    } catch (error) {
      console.error("Error looking up user:", error);
      setMessage(`Error: ${error.message}`);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userId) {
      setMessage("No user selected");
      setStatus("error");
      return;
    }

    setLoading(true);
    setMessage("Updating user role...");
    setStatus("info");

    try {
      const res = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          role: selectedRole,
          approved,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      // Clear the permission cache
      clearUserPermissionCache(userId);

      setMessage(
        `User updated successfully! Role set to ${selectedRole} (Approved: ${approved ? "Yes" : "No"})`
      );
      setStatus("success");
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage(`Error: ${error.message}`);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Role Manager</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">User Lookup</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_1abc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <button
          onClick={handleLookupUser}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {loading ? "Working..." : "Lookup User"}
        </button>
      </div>

      {status && (
        <div
          className={`p-4 rounded mb-6 ${
            status === "error"
              ? "bg-red-100 text-red-700"
              : status === "success"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          {message}
        </div>
      )}

      {userId && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Update User Role</h2>

          <div className="mb-4">
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            {userEmail && (
              <p>
                <strong>Email:</strong> {userEmail}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="user">User</option>
                <option value="agent">Agent</option>
                <option value="agent_pending">Agent (Pending)</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approved Status
              </label>
              <div className="flex items-center mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="true"
                    checked={approved}
                    onChange={() => setApproved(true)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Approved</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="false"
                    checked={!approved}
                    onChange={() => setApproved(false)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Not Approved</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdateRole}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-green-300"
          >
            {loading ? "Updating..." : "Update User Role"}
          </button>
        </div>
      )}
    </div>
  );
}

export default withAuth({ role: ROLES.ADMIN })(AdminRoleManager);
