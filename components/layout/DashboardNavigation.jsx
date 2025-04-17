import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDatabaseConnection } from "../../contexts/DatabaseContext";
import {
  FiHome,
  FiUser,
  FiSettings,
  FiList,
  FiUsers,
  FiMenu,
  FiX,
  FiDatabase,
} from "react-icons/fi";

export default function DashboardNavigation() {
  const { dbUser, isAdmin, isAgent } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connectionError } = useDatabaseConnection();

  const generalLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <FiHome className="mr-2" />,
      exact: true,
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: <FiUser className="mr-2" />,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <FiSettings className="mr-2" />,
    },
  ];

  const agentLinks = [
    {
      href: "/dashboard/agent",
      label: "Agent Dashboard",
      icon: <FiHome className="mr-2" />,
      exact: true,
    },
    {
      href: "/dashboard/agent/listings",
      label: "My Listings",
      icon: <FiList className="mr-2" />,
    },
    {
      href: "/dashboard/agent/profile",
      label: "Agent Profile",
      icon: <FiUser className="mr-2" />,
    },
  ];

  const adminLinks = [
    {
      href: "/dashboard/admin",
      label: "Admin Dashboard",
      icon: <FiHome className="mr-2" />,
      exact: true,
    },
    {
      href: "/dashboard/admin/users",
      label: "Manage Users",
      icon: <FiUsers className="mr-2" />,
    },
    {
      href: "/dashboard/admin/listings",
      label: "All Listings",
      icon: <FiList className="mr-2" />,
    },
    {
      href: "/dashboard/admin/database",
      label: "Database",
      icon: <FiDatabase className="mr-2" />,
      highlight: connectionError,
    },
  ];

  // Choose appropriate links based on user role
  let navLinks = generalLinks;
  if (isAdmin) {
    navLinks = adminLinks;
  } else if (isAgent) {
    navLinks = agentLinks;
  }

  function isActivePath(path, exact = false) {
    if (exact) {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between">
            <div className="flex">
              {navLinks.map((link) => (
                <Link
                  href={link.href}
                  key={link.href}
                  className={`px-4 py-3 inline-flex items-center text-sm font-medium border-b-2 ${
                    isActivePath(link.href, link.exact)
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800"
                  } ${link.highlight ? "bg-red-50 text-red-600" : ""}`}
                >
                  {link.icon}
                  {link.label}
                  {link.highlight && (
                    <span className="ml-1 inline-flex items-center justify-center w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">
            {dbUser?.firstName
              ? `${dbUser.firstName}'s Dashboard`
              : "Dashboard"}
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="px-2 py-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActivePath(link.href, link.exact)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
