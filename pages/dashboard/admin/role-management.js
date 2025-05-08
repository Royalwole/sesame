import { useState } from "react";
import { withAuth } from "../../../lib/withAuth";
import AdminLayout from "../../../components/layout/AdminLayout";
import UserRoleManager from "../../../components/admin/UserRoleManager";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

function RoleManagementPage() {
  return (
    <AdminLayout title="User Role Management">
      <div className="space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/admin">
              <div className="mr-4 cursor-pointer hover:text-blue-600 transition-colors">
                <FiArrowLeft className="h-5 w-5" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              User Role Management
            </h1>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Administrator Access
          </span>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <UserRoleManager />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default RoleManagementPage;

// Use withAuth with role=admin to protect this page
export const getServerSideProps = withAuth({ role: "admin" });
