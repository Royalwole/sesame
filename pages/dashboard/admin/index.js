import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../../contexts/AuthContext";
import {
  withAuth,
  withServerAuth,
  withAuthGetServerSideProps,
} from "../../../lib/withAuth";
import AdminLayout from "../../../components/layout/AdminLayout";
import Link from "next/link";
import {
  FiUsers,
  FiHome,
  FiList,
  FiSettings,
  FiDatabase,
  FiRefreshCw,
  FiAlertCircle,
  FiUserCheck,
} from "react-icons/fi";
import Loader from "../../../components/utils/Loader";

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    activeAgents: 0,
    pendingAgents: 0,
    totalAgents: 0,
    activeListings: 0,
    pendingListings: 0,
    totalListings: 0,
    recentUsers: [],
    recentListings: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const auth = useAuth();

  // Circuit breaker effect - prevent redirect loops
  useEffect(() => {
    // Check URL for circuit breaker parameters
    const hasNoRedirect = router.query.noRedirect === "true";
    const hasBreakLoop = router.query.breakLoop === "true";

    // Skip the role check if the circuit breaker is active
    if (hasNoRedirect || hasBreakLoop) {
      console.log(
        "[AdminDashboard] Circuit breaker active, skipping role check"
      );
      return;
    }

    // Direct role check from user metadata
    const userRole = auth?.user?.publicMetadata?.role;
    const isApproved = auth?.user?.publicMetadata?.approved === true;

    console.log("[AdminDashboard] Access check:", { userRole, isApproved });

    // Only allow approved admins
    const isAuthorized =
      (userRole === "admin" || userRole === "super_admin") && isApproved;

    if (!isAuthorized && !loading) {
      console.warn(
        "[AdminDashboard] Unauthorized access, redirecting to user dashboard"
      );
      // Add breakLoop to prevent further redirects
      router.replace("/dashboard/user?breakLoop=true&t=" + Date.now());
    }
  }, [router, auth.user, auth.isLoading, loading]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch statistics");
      }

      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiRefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Administrator Access
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading dashboard
                </h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats.users}
            loading={loading}
          />
          <StatsCard
            title="Active Agents"
            value={stats.activeAgents}
            subtitle={`${stats.pendingAgents} pending approval`}
            loading={loading}
          />
          <StatsCard
            title="Active Listings"
            value={stats.activeListings}
            loading={loading}
          />
          <StatsCard
            title="Pending Reviews"
            value={stats.pendingListings}
            loading={loading}
          />
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Admin Actions
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adminActions.map((action, index) => (
                <li key={index}>
                  <ActionCard
                    href={action.href}
                    icon={action.icon}
                    title={action.title}
                    description={action.description}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Stats Card Component
function StatsCard({ title, value, subtitle }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {value}
              </dd>
              {subtitle && (
                <dt className="text-xs text-gray-500 mt-1">{subtitle}</dt>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Action Card Component
function ActionCard({ href, icon, title, description }) {
  return (
    <Link href={href}>
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">{icon}</div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Admin Actions Configuration
const adminActions = [
  {
    href: "/dashboard/admin/users",
    icon: <FiUsers className="h-5 w-5 text-gray-600" />,
    title: "Manage Users",
    description: "View and manage user accounts",
  },
  {
    href: "/dashboard/admin/agents",
    icon: <FiUsers className="h-5 w-5 text-gray-600" />,
    title: "Manage Agents",
    description: "Review agent applications and manage existing agents",
  },
  {
    href: "/dashboard/admin/listings",
    icon: <FiList className="h-5 w-5 text-gray-600" />,
    title: "Manage Listings",
    description: "Review, edit and manage property listings",
  },
  {
    href: "/dashboard/admin/role-management",
    icon: <FiUserCheck className="h-5 w-5 text-gray-600" />,
    title: "Role Management",
    description: "Assign and manage user roles and permissions",
  },
  {
    href: "/dashboard/admin/settings",
    icon: <FiSettings className="h-5 w-5 text-gray-600" />,
    title: "System Settings",
    description: "Configure application settings",
  },
  {
    href: "/dashboard/admin/database",
    icon: <FiDatabase className="h-5 w-5 text-gray-600" />,
    title: "System Status",
    description: "Check database and system health",
  },
];

// Correct way to use withAuth - first as a component wrapper
const ProtectedAdminDashboard = withAuth({ role: "admin" })(AdminDashboard);

// Then set up getServerSideProps using the proper method
export const getServerSideProps = withAuthGetServerSideProps({ role: "admin" });

export default ProtectedAdminDashboard;
