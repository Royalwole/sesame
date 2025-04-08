import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../../contexts/AuthContext";
import { withAuth } from "../../../lib/withAuth"; // Add this import
import Link from "next/link";
import { FiUsers, FiHome, FiSettings, FiUserCheck } from "react-icons/fi";

function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    // Redirect non-admins - use isAdmin flag instead of hasRole
    if (!isLoading && !isAdmin) {
      router.push("/dashboard");
      return;
    }
  }, [isAdmin, isLoading, router]);

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-wine border-t-transparent"></div>
          <p className="mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // If not an admin, don't render anything (will redirect)
  if (!isAdmin) {
    return null;
  }

  const adminModules = [
    {
      title: "Manage Agents",
      description: "Review and approve agent applications",
      icon: <FiUserCheck className="text-2xl text-white" />,
      link: "/dashboard/admin/agents",
      color: "bg-blue-600",
    },
    {
      title: "Manage Listings",
      description: "Review and manage property listings",
      icon: <FiHome className="text-2xl text-white" />,
      link: "/dashboard/admin/listings",
      color: "bg-green-600",
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: <FiUsers className="text-2xl text-white" />,
      link: "/dashboard/admin/users",
      color: "bg-purple-600",
    },
    {
      title: "Site Settings",
      description: "Configure website settings and options",
      icon: <FiSettings className="text-2xl text-white" />,
      link: "/dashboard/admin/settings",
      color: "bg-gray-700",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Pending Agents
          </h2>
          <p className="text-3xl font-bold text-wine">2</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Active Listings
          </h2>
          <p className="text-3xl font-bold text-wine">24</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Total Users
          </h2>
          <p className="text-3xl font-bold text-wine">153</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            New Inquiries
          </h2>
          <p className="text-3xl font-bold text-wine">7</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Admin Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((module, index) => (
          <Link key={index} href={module.link} className="block">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex items-center p-6">
                <div className={`${module.color} p-4 rounded-full mr-4`}>
                  {module.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                  <p className="text-gray-600">{module.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard/admin/agents"
              className="bg-wine text-white p-3 rounded-md text-center hover:bg-opacity-90"
            >
              Review Agents
            </Link>
            <Link
              href="/dashboard/admin/listings"
              className="bg-wine text-white p-3 rounded-md text-center hover:bg-opacity-90"
            >
              Review Listings
            </Link>
            <Link
              href="/debug/listings"
              className="bg-gray-700 text-white p-3 rounded-md text-center hover:bg-opacity-90"
            >
              Debug Listings
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-500 text-white p-3 rounded-md text-center hover:bg-opacity-90"
            >
              Main Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protect this page with authentication
export const getServerSideProps = withAuth();

export default AdminDashboard;
