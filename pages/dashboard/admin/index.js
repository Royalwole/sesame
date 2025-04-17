import { useState, useEffect } from "react";
import Head from "next/head";
import { withAuth } from "../../../lib/withAuth";
import { AuthGuard } from "../../../lib/withAuth";
import Link from "next/link";
import {
  FiUsers,
  FiHome,
  FiList,
  FiSettings,
  FiDatabase,
} from "react-icons/fi";

function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    agents: 0,
    listings: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    // Fetch admin dashboard statistics
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <AuthGuard role="admin">
      <Head>
        <title>Admin Dashboard | TopDial</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Administrator Access
          </span>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-blue-500 p-3 text-white">
                  <FiUsers className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.users}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-green-500 p-3 text-white">
                  <FiUsers className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Agents
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.agents}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-yellow-500 p-3 text-white">
                  <FiHome className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Listings
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.listings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-red-500 p-3 text-white">
                  <FiList className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Reviews
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.pendingReviews}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Admin Actions
            </h3>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            <li>
              <Link
                href="/dashboard/admin/users"
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                      <FiUsers className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Manage Users
                      </p>
                      <p className="text-sm text-gray-500">
                        View and manage user accounts
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/admin/agents"
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                      <FiUsers className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Manage Agents
                      </p>
                      <p className="text-sm text-gray-500">
                        Review agent applications and manage existing agents
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/admin/listings"
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2">
                      <FiHome className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Manage Listings
                      </p>
                      <p className="text-sm text-gray-500">
                        Review, edit and manage property listings
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/admin/settings"
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-md p-2">
                      <FiSettings className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        System Settings
                      </p>
                      <p className="text-sm text-gray-500">
                        Configure application settings
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
            <li>
              <Link href="/debug/db-status" className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-100 rounded-md p-2">
                      <FiDatabase className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        System Status
                      </p>
                      <p className="text-sm text-gray-500">
                        Check database and system health
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}

export default AdminDashboard;

// Use withAuth with role=admin to protect this page
export const getServerSideProps = withAuth({ role: "admin" });
