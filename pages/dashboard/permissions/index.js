import React from "react";
import PermissionPortal from "../../../components/admin/permissions/PermissionPortal";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { withAuth } from "../../../lib/withAuth";

/**
 * User Permissions Page
 *
 * This page provides a self-service portal for users to view, understand,
 * and request permissions in the system.
 */
function PermissionsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Permissions</h1>
        </div>

        <PermissionPortal />
      </div>
    </DashboardLayout>
  );
}

// Protect this page - require authentication
export default withAuth(PermissionsPage);
