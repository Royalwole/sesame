import React from "react";
import { Container, Heading, Box } from "@chakra-ui/react";
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
      <Container maxW="container.xl" py={6}>
        <Box mb={6}>
          <Heading as="h1" size="xl">
            My Permissions
          </Heading>
        </Box>

        <PermissionPortal />
      </Container>
    </DashboardLayout>
  );
}

// Protect this page - require authentication
export default withAuth(PermissionsPage);
