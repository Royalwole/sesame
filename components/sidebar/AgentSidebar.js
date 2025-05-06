import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useClerk } from "@clerk/nextjs"; // Import useClerk hook
import {
  FiHome,
  FiList,
  FiPlusCircle,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiBarChart2,
} from "react-icons/fi";

export default function AgentSidebar() {
  const router = useRouter();
  const { signOut } = useClerk(); // Get signOut function from Clerk

  // Handle sign out with proper redirection
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Menu items with icons and paths
  const menuItems = [
    { label: "Dashboard", icon: <FiHome />, path: "/dashboard/agent" },
    {
      label: "My Listings",
      icon: <FiList />,
      path: "/dashboard/agent/listings",
    },
    {
      label: "Create Listing",
      icon: <FiPlusCircle />,
      path: "/dashboard/agent/listings/create",
    },
    {
      label: "Stats Analysis",
      icon: <FiBarChart2 />,
      path: "/dashboard/agent/stats",
    },
    { label: "Profile", icon: <FiUser />, path: "/dashboard/agent/profile" },
    {
      label: "Settings",
      icon: <FiSettings />,
      path: "/dashboard/agent/settings",
    },
    { label: "Help", icon: <FiHelpCircle />, path: "/dashboard/agent/help" },
  ];

  const isActivePath = (path) => {
    if (path === "/dashboard/agent") {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                isActivePath(item.path)
                  ? "bg-wine/5 text-wine"
                  : "text-gray-600 hover:bg-gray-50 hover:text-wine"
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActivePath(item.path) && (
                <span className="ml-auto h-5 w-1 bg-wine rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Log out button at the bottom - fixed to use Clerk's signOut */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-red-600"
          >
            <FiLogOut className="mr-3 text-lg" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
