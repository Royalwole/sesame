import { useState } from "react";
import Head from "next/head";
import { withAuth } from "../../../lib/withAuth";
import AdminLayout from "../../../components/layout/AdminLayout";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import toast from "react-hot-toast";

function AdminSettings() {
  const { isAdmin, isLoading } = useAuth();
  const [settings, setSettings] = useState({
    siteName: "TopDial",
    contactEmail: "contact@topdial.com",
    phoneNumber: "+234 800 123 4567",
    featuredListingsCount: 6,
    maxImagesPerListing: 10,
    requireAgentApproval: true,
  });
  const [saving, setSaving] = useState(false);

  // Redirect handled via withAuth

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Simulated save - in a real app this would call an API
    setTimeout(() => {
      toast.success("Settings saved successfully");
      setSaving(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-wine border-t-transparent"></div>
          <p className="mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Admin Settings">
      <div className="container mx-auto px-4 py-8">
        <Head>
          <title>Site Settings - Admin Dashboard</title>
        </Head>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Link
              href="/dashboard/admin"
              className="mr-4 text-gray-600 hover:text-wine"
            >
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">Site Settings</h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={settings.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Featured Listings Count
                </label>
                <input
                  type="number"
                  name="featuredListingsCount"
                  value={settings.featuredListingsCount}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Images Per Listing
                </label>
                <input
                  type="number"
                  name="maxImagesPerListing"
                  value={settings.maxImagesPerListing}
                  onChange={handleInputChange}
                  min="1"
                  max="30"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="requireAgentApproval"
                name="requireAgentApproval"
                type="checkbox"
                checked={settings.requireAgentApproval}
                onChange={handleInputChange}
                className="h-4 w-4 text-wine focus:ring-wine border-gray-300 rounded"
              />
              <label
                htmlFor="requireAgentApproval"
                className="ml-2 block text-sm text-gray-900"
              >
                Require admin approval for new agent accounts
              </label>
            </div>

            <div className="pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="bg-wine text-white px-4 py-2 rounded-md flex items-center hover:bg-opacity-90 disabled:opacity-50"
              >
                <FiSave className="mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Advanced Settings</h3>

            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                  onClick={() => toast.success("Cache cleared successfully")}
                >
                  Clear Cache
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                  onClick={() => toast.success("Test email sent")}
                >
                  Test Email Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Protect this page with authentication
export const getServerSideProps = withAuth({ role: "admin" });

export default AdminSettings;
