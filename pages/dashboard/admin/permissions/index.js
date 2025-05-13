import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";
import AdminLayout from "../../../../components/layout/AdminLayout";
import { withAuthGetServerSideProps } from "../../../../lib/withAuth";
import {
  Container,
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Button,
} from "@chakra-ui/react";
import UserPermissionsManager from "../../../../components/admin/permissions/UserPermissionsManager";
import PermissionBundleManager from "../../../../components/admin/permissions/PermissionBundleManager";
import PermissionRequestReview from "../../../../components/admin/permissions/PermissionRequestReview";
import PermissionAuditLog from "../../../../components/admin/permissions/PermissionAuditLog";

/**
 * Admin Permission Management Page
 *
 * This page provides administrators with a complete interface to manage permissions
 * across the system, including:
 * - Reviewing and acting on permission requests
 * - Managing permission bundles
 * - Managing user permissions directly
 * - Viewing permission audit logs
 */
function AdminPermissionsPage() {
  const router = useRouter();
  const { getToken, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Handle tab changes
  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  // Effect to load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Effect to handle userId from query parameters
  useEffect(() => {
    const { userId, tab } = router.query;

    // Set active tab based on query param
    if (tab) {
      const tabIndex = parseInt(tab);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 3) {
        setActiveTab(tabIndex);
      }
    }

    // Set selected user if userId is provided
    if (userId) {
      setSelectedUserId(userId);
      fetchUserDetails(userId);
    }
  }, [router.query]);

  // Function to fetch users
  const fetchUsers = async (query = "") => {
    setLoadingUsers(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/users?search=${query || ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Function to fetch a specific user's details
  const fetchUserDetails = async (userId) => {
    if (!userId) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser({
          id: userId,
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          email: data.email || "",
          role: data.role || "user",
          permissions: data.permissions || [],
        });
      } else {
        toast.error("Failed to load user details");
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Error loading user details");
      setSelectedUser(null);
    }
  };

  // Handle user selection
  const handleUserSelect = (userId, userName = "", userEmail = "") => {
    setSelectedUserId(userId);

    // Update URL without full page reload, maintaining tab state
    router.push(
      {
        pathname: "/dashboard/admin/permissions",
        query: { userId, tab: activeTab },
      },
      undefined,
      { shallow: true }
    );

    // Update selected user basic info immediately
    setSelectedUser({
      id: userId,
      name: userName,
      email: userEmail,
      // Other details will be filled in by fetchUserDetails
    });

    fetchUserDetails(userId);
  };

  // If still loading auth, show loading state
  if (isLoading) {
    return (
      <AdminLayout title="Permissions Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Permissions Management">
      <Head>
        <title>Permissions Management | Admin Dashboard</title>
      </Head>

      <Container maxW="container.xl" py={6}>
        <Box mb={6}>
          <Heading as="h1" size="xl">
            Permission Management
          </Heading>
        </Box>

        <Tabs
          isLazy
          colorScheme="blue"
          index={activeTab}
          onChange={handleTabChange}
        >
          <TabList>
            <Tab>Requests</Tab>
            <Tab>Bundles</Tab>
            <Tab>User Permissions</Tab>
            <Tab>Audit Log</Tab>
          </TabList>

          <TabPanels>
            {/* Permission Requests Tab */}
            <TabPanel>
              <PermissionRequestReview />
            </TabPanel>

            {/* Permission Bundles Tab */}
            <TabPanel>
              <PermissionBundleManager />
            </TabPanel>

            {/* User Permissions Tab */}
            <TabPanel>
              <UserPermissionsManager
                userId={selectedUserId}
                userName={selectedUser?.name || ""}
                userEmail={selectedUser?.email || ""}
                onRefresh={() => fetchUserDetails(selectedUserId)}
                users={users}
                loadingUsers={loadingUsers}
                onUserSelect={handleUserSelect}
                fetchUsers={fetchUsers}
              />
            </TabPanel>

            {/* Audit Log Tab */}
            <TabPanel>
              <PermissionAuditLog />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </AdminLayout>
  );
}

// Protect this page with admin authentication using the correct method
export const getServerSideProps = withAuthGetServerSideProps({ role: "admin" });

export default AdminPermissionsPage;
