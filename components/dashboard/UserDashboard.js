import React from "react";
import { FiUser, FiList, FiSettings, FiCalendar } from "react-icons/fi";
import Link from "next/link";

export default function UserDashboard({ user }) {
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user.firstName || "User"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your profile, saved listings, and settings from your
            dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Profile Card */}
          <Link href="/dashboard/profile" className="block">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center text-blue-600 mb-3">
                <FiUser size={24} />
                <h2 className="text-lg font-semibold ml-2">My Profile</h2>
              </div>
              <p className="text-gray-600">
                Update your personal information and preferences
              </p>
            </div>
          </Link>

          {/* Saved Listings Card */}
          <Link href="/dashboard/saved" className="block">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center text-blue-600 mb-3">
                <FiList size={24} />
                <h2 className="text-lg font-semibold ml-2">Saved Listings</h2>
              </div>
              <p className="text-gray-600">
                View and manage your favorite property listings
              </p>
            </div>
          </Link>

          {/* Settings Card */}
          <Link href="/dashboard/settings" className="block">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center text-blue-600 mb-3">
                <FiSettings size={24} />
                <h2 className="text-lg font-semibold ml-2">Settings</h2>
              </div>
              <p className="text-gray-600">
                Manage notification preferences and account settings
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>

          <div className="space-y-4">
            {/* This would typically be populated from an API */}
            <div className="text-center py-10 text-gray-500">
              <FiCalendar className="mx-auto mb-2" size={24} />
              <p>No recent activity to show.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
