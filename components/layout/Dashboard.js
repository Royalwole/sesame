import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import Link from "next/link";
import {
  FiMenu,
  FiX,
  FiHome,
  FiList,
  FiUser,
  FiUsers,
  FiSettings,
} from "react-icons/fi";

export default function Dashboard({ children, title = "Dashboard" }) {
  const { user, isAdmin, isAgent, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Common dashboard navigation
  const commonNav = [
    { href: "/dashboard", label: "Dashboard", icon: FiHome },
    { href: "/dashboard/profile", label: "Profile", icon: FiUser },
  ];

  // Agent-specific navigation
  const agentNav = isAgent
    ? [
        { href: "/dashboard/agent", label: "Agent Dashboard", icon: FiHome },
        {
          href: "/dashboard/agent/listings",
          label: "My Listings",
          icon: FiList,
        },
        {
          href: "/dashboard/agent/listings/create",
          label: "Create Listing",
          icon: FiHome,
        },
      ]
    : [];

  // Admin-specific navigation
  const adminNav = isAdmin
    ? [
        { href: "/dashboard/admin", label: "Admin Dashboard", icon: FiHome },
        {
          href: "/dashboard/admin/agents",
          label: "Manage Agents",
          icon: FiUsers,
        },
        {
          href: "/dashboard/admin/listings",
          label: "Manage Listings",
          icon: FiList,
        },
        {
          href: "/dashboard/admin/settings",
          label: "Settings",
          icon: FiSettings,
        },
      ]
    : [];

  // Combine navigation based on user role
  const navigation = [...commonNav, ...agentNav, ...adminNav];

  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title} - TopDial</title>
      </Head>

      {/* Mobile header */}
      <header className="bg-white border-b border-gray-200 lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700"
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <div className="text-xl font-semibold text-wine">TopDial</div>
        </div>
      </header>

      <div className="flex flex-grow">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } fixed inset-0 z-40 lg:relative lg:inset-auto lg:block lg:z-auto w-64 bg-white border-r border-gray-200 h-full overflow-y-auto`}
        >
          <div className="p-4 border-b border-gray-200">
            <Link href="/" className="text-xl font-semibold text-wine">
              TopDial
            </Link>
          </div>

          {/* User info */}
          {!isLoading && user && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-wine text-white flex items-center justify-center uppercase font-bold">
                  {user.firstName?.[0] || "U"}
                </div>
                <div className="ml-3">
                  <div className="font-medium">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isAdmin ? "Admin" : isAgent ? "Agent" : "User"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md ${
                      isActive(item.href)
                        ? "bg-wine text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
