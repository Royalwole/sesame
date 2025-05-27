import React, { useState, useEffect } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/layout/DashboardLayout";
import withAuth from "@/lib/withAuth";
import { toast } from "react-hot-toast";

/**
 * My Permissions Page
 *
 * This page allows users to:
 * 1. View their current permissions
 * 2. Request new permissions
 * 3. View status of their permission requests
 */
function MyPermissionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [userPermissions, setUserPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [permissionBundles, setPermissionBundles] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [requestForm, setRequestForm] = useState({
    type: "permission",
    permission: "",
    bundleId: "",
    justification: "",
    resourceId: "",
    resourceType: "",
    requestedDuration: "permanent",
    requestedExpiration: null,
  });

  // Load data when the component mounts
  useEffect(() => {
    Promise.all([
      fetchUserPermissions(),
      fetchPermissionOptions(),
      fetchUserRequests(),
    ]).catch((err) => {
      console.error("Error initializing permissions page:", err);
      setError(
        "Failed to load permission data. Please try refreshing the page."
      );
      setLoading(false);
    });
  }, []);

  // Fetch user's current permissions
  const fetchUserPermissions = async () => {
    try {
      const response = await fetch("/api/users/permissions/list");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch user permissions");
      }

      setUserPermissions(data.permissions || []);
      return data;
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch available permissions and bundles
  const fetchPermissionOptions = async () => {
    try {
      const [permissionsResponse, bundlesResponse] = await Promise.all([
        fetch("/api/users/permissions/available"),
        fetch("/api/users/permissions/bundles"),
      ]);

      const permissionsData = await permissionsResponse.json();
      const bundlesData = await bundlesResponse.json();

      if (!permissionsData.success) {
        throw new Error(
          permissionsData.error || "Failed to fetch available permissions"
        );
      }

      if (!bundlesData.success) {
        throw new Error(
          bundlesData.error || "Failed to fetch permission bundles"
        );
      }

      setAvailablePermissions(permissionsData.permissions || []);
      setPermissionBundles(bundlesData.bundles || []);
      return { permissions: permissionsData, bundles: bundlesData };
    } catch (err) {
      console.error("Error fetching permission options:", err);
      setError(err.message);
      throw err;
    }
  };

  // Fetch user's permission requests
  const fetchUserRequests = async () => {
    try {
      const response = await fetch("/api/users/permissions/requests");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch permission requests");
      }

      setPermissionRequests(data.requests || []);
      return data;
    } catch (err) {
      console.error("Error fetching permission requests:", err);
      setError(err.message);
      throw err;
    }
  };

  // Handle request form submission
  const submitPermissionRequest = async () => {
    try {
      // Validate the form data
      if (requestForm.type === "permission" && !requestForm.permission) {
        throw new Error("Please select a permission to request");
      }

      if (requestForm.type === "bundle" && !requestForm.bundleId) {
        throw new Error("Please select a permission bundle to request");
      }

      if (!requestForm.justification) {
        throw new Error("Please provide a justification for your request");
      }

      // Send the request to the API
      const response = await fetch("/api/users/permissions/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestForm),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit permission request");
      }

      // Reset the form and close the modal
      setRequestForm({
        type: "permission",
        permission: "",
        bundleId: "",
        justification: "",
        resourceId: "",
        resourceType: "",
        requestedDuration: "permanent",
        requestedExpiration: null,
      });
      closeModal();

      // Refresh the requests list
      await fetchUserRequests();

      // Show success message
      toast.success(
        "Permission request submitted successfully. An administrator will review your request."
      );
    } catch (err) {
      console.error("Error submitting permission request:", err);
      toast.error(`Error: ${err.message}`);
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color class
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      case "canceled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Open/close modal functions
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setRequestForm({
      type: "permission",
      permission: "",
      bundleId: "",
      justification: "",
      resourceId: "",
      resourceType: "",
      requestedDuration: "permanent",
      requestedExpiration: null,
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your permissions data...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Permissions | TopDial</title>
        <meta name="description" content="View and request permissions" />
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Permissions</h1>
          <p className="mt-2 text-lg text-gray-600">
            View your current permissions and request access to additional
            features
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab(0)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 0
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Current Permissions
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 1
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Request History
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 0 && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Current Permissions
                  </h2>
                  <button
                    onClick={openModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Request New Permission
                  </button>
                </div>

                {userPermissions.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          You currently don't have any special permissions
                          assigned. Use the "Request New Permission" button to
                          request access to additional features.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Global Permissions */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Global Permissions
                      </h3>
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-md">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Permission
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Description
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userPermissions
                              .filter((p) => !p.resourceId)
                              .map((permission) => (
                                <tr key={permission.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-900">
                                    {permission.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {permission.description || permission.name}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Resource-specific Permissions */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Resource-Specific Permissions
                      </h3>
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-md">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Permission
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Resource
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userPermissions
                              .filter((p) => p.resourceId)
                              .map((permission) => (
                                <tr
                                  key={`${permission.id}-${permission.resourceId}`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-900">
                                    {permission.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {permission.resourceType}
                                      </span>
                                      <span className="text-xs font-mono text-gray-500">
                                        {permission.resourceId}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 1 && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Permission Request History
                  </h2>
                </div>

                {permissionRequests.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          You haven't made any permission requests yet.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-md">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Permission
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {permissionRequests.map((request) => (
                          <tr key={request._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className="flex items-center"
                                title={formatDate(request.createdAt)}
                              >
                                <svg
                                  className="h-4 w-4 text-gray-400 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="text-sm text-gray-900">
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.permission ||
                                (request.bundleId && (
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      Bundle
                                    </span>
                                    <span>
                                      {request.bundle?.name ||
                                        "Permission Bundle"}
                                    </span>
                                  </div>
                                ))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                              >
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.updatedAt ? (
                                <span title={formatDate(request.updatedAt)}>
                                  {new Date(
                                    request.updatedAt
                                  ).toLocaleDateString()}
                                </span>
                              ) : (
                                "Pending"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permission Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeModal}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Request Permission
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Request Type
                        </label>
                        <select
                          name="type"
                          value={requestForm.type}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="permission">
                            Individual Permission
                          </option>
                          <option value="bundle">Permission Bundle</option>
                        </select>
                      </div>

                      {requestForm.type === "permission" ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Permission <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="permission"
                            value={requestForm.permission}
                            onChange={handleFormChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select a permission</option>
                            {availablePermissions.map((perm) => (
                              <option key={perm.id} value={perm.id}>
                                {perm.name} ({perm.id})
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-sm text-gray-500">
                            Select the permission you need access to
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Permission Bundle{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="bundleId"
                            value={requestForm.bundleId}
                            onChange={handleFormChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select a permission bundle</option>
                            {permissionBundles.map((bundle) => (
                              <option key={bundle._id} value={bundle._id}>
                                {bundle.name}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-sm text-gray-500">
                            Permission bundles contain multiple related
                            permissions
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resource (Optional)
                        </label>
                        <div className="flex space-x-2">
                          <select
                            name="resourceType"
                            value={requestForm.resourceType}
                            onChange={handleFormChange}
                            className="mt-1 block w-2/5 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Resource type (optional)</option>
                            <option value="listing">Listing</option>
                            <option value="user">User</option>
                            <option value="organization">Organization</option>
                            <option value="report">Report</option>
                          </select>
                          <input
                            type="text"
                            name="resourceId"
                            value={requestForm.resourceId}
                            onChange={handleFormChange}
                            placeholder="Resource ID (optional)"
                            className="mt-1 block w-3/5 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Only fill this if you need permission for a specific
                          resource
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration
                        </label>
                        <select
                          name="requestedDuration"
                          value={requestForm.requestedDuration}
                          onChange={handleFormChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="permanent">Permanent</option>
                          <option value="temporary">Temporary (30 days)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Justification <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="justification"
                          value={requestForm.justification}
                          onChange={handleFormChange}
                          placeholder="Explain why you need this permission..."
                          rows={4}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Please provide a clear explanation of why you need
                          this permission
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={submitPermissionRequest}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Set the layout
MyPermissionsPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

// Wrap the page with authentication
export default withAuth(MyPermissionsPage);
