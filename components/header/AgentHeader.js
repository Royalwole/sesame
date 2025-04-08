import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { UserButton, useUser } from "@clerk/nextjs";
import { FiHome, FiBell, FiMessageCircle } from "react-icons/fi";

export default function AgentHeader() {
  const router = useRouter();
  const { user } = useUser();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-2xl font-bold text-wine">TopDial</span>
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link
              href="/dashboard/agent"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                router.pathname === "/dashboard/agent"
                  ? "text-wine"
                  : "text-gray-500 hover:text-wine"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/agent/listings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                router.pathname.includes("/dashboard/agent/listings")
                  ? "text-wine"
                  : "text-gray-500 hover:text-wine"
              }`}
            >
              Listings
            </Link>
            <Link
              href="/dashboard/agent/profile"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                router.pathname === "/dashboard/agent/profile"
                  ? "text-wine"
                  : "text-gray-500 hover:text-wine"
              }`}
            >
              Profile
            </Link>
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center">
            <button className="p-2 rounded-full text-gray-500 hover:text-wine">
              <FiBell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-500 hover:text-wine ml-3">
              <FiMessageCircle className="h-5 w-5" />
            </button>
            <div className="ml-4">
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
