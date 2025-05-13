import React, { useState, useEffect } from "react";
import Head from "next/head";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  HStack,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  FormHelperText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  IconButton,
} from "@chakra-ui/react";
import { InfoIcon, AddIcon, TimeIcon } from "@chakra-ui/icons";
import DashboardLayout from "@/components/layout/DashboardLayout";
import withAuth from "@/lib/withAuth";

/**
 * My Permissions Page
 *
 * This page allows users to:
 * 1. View their current permissions
 * 2. Request new permissions
 * 3. View status of their permission requests
 */
function MyPermissionsPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState(0);
  const [userPermissions, setUserPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [permissionBundles, setPermissionBundles] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [requestForm, setRequestForm] = useState({
    type: "permission",
    permission: "",
    bundleId: "",
    justification: "",
    resourceId: "",
    resourceType: "",
    requestedDuration: "permanent",
    requestedExpiration: null,
  });

  // Load data when the component mounts
  useEffect(() => {
    Promise.all([
      fetchUserPermissions(),
      fetchPermissionOptions(),
      fetchUserRequests(),
    ]).catch((err) => {
      console.error("Error initializing permissions page:", err);
      setError(
        "Failed to load permission data. Please try refreshing the page."
      );
      setLoading(false);
    });
  }, []);

  // Fetch user's current permissions
  const fetchUserPermissions = async () => {
    try {
      const response = await fetch("/api/users/permissions/list");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch user permissions");
      }

      setUserPermissions(data.permissions || []);
      return data;
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch available permissions and bundles
  const fetchPermissionOptions = async () => {
    try {
      const [permissionsResponse, bundlesResponse] = await Promise.all([
        fetch("/api/users/permissions/available"),
        fetch("/api/users/permissions/bundles"),
      ]);

      const permissionsData = await permissionsResponse.json();
      const bundlesData = await bundlesResponse.json();

      if (!permissionsData.success) {
        throw new Error(
          permissionsData.error || "Failed to fetch available permissions"
        );
      }

      if (!bundlesData.success) {
        throw new Error(
          bundlesData.error || "Failed to fetch permission bundles"
        );
      }

      setAvailablePermissions(permissionsData.permissions || []);
      setPermissionBundles(bundlesData.bundles || []);
      return { permissions: permissionsData, bundles: bundlesData };
    } catch (err) {
      console.error("Error fetching permission options:", err);
      setError(err.message);
      throw err;
    }
  };

  // Fetch user's permission requests
  const fetchUserRequests = async () => {
    try {
      const response = await fetch("/api/users/permissions/requests");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch permission requests");
      }

      setPermissionRequests(data.requests || []);
      return data;
    } catch (err) {
      console.error("Error fetching permission requests:", err);
      setError(err.message);
      throw err;
    }
  };

  // Handle request form submission
  const submitPermissionRequest = async () => {
    try {
      // Validate the form data
      if (requestForm.type === "permission" && !requestForm.permission) {
        throw new Error("Please select a permission to request");
      }

      if (requestForm.type === "bundle" && !requestForm.bundleId) {
        throw new Error("Please select a permission bundle to request");
      }

      if (!requestForm.justification) {
        throw new Error("Please provide a justification for your request");
      }

      // Send the request to the API
      const response = await fetch("/api/users/permissions/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestForm),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to submit permission request");
      }

      // Reset the form and close the modal
      setRequestForm({
        type: "permission",
        permission: "",
        bundleId: "",
        justification: "",
        resourceId: "",
        resourceType: "",
        requestedDuration: "permanent",
        requestedExpiration: null,
      });
      onClose();

      // Refresh the requests list
      await fetchUserRequests();

      // Show success message
      alert(
        "Permission request submitted successfully. An administrator will review your request."
      );
    } catch (err) {
      console.error("Error submitting permission request:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "green";
      case "denied":
        return "red";
      case "canceled":
        return "gray";
      default:
        return "gray";
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading your permissions data...</Text>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Head>
        <title>My Permissions | TopDial</title>
        <meta name="description" content="View and request permissions" />
      </Head>

      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading size="xl">My Permissions</Heading>
          <Text mt={2} fontSize="lg" color="gray.600">
            View your current permissions and request access to additional
            features
          </Text>
        </Box>

        <Tabs colorScheme="blue" index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Current Permissions</Tab>
            <Tab>Request History</Tab>
          </TabList>

          <TabPanels>
            {/* Current Permissions Tab */}
            <TabPanel p={4}>
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="md">Your Current Permissions</Heading>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={onOpen}
                >
                  Request New Permission
                </Button>
              </Flex>

              {userPermissions.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  You currently don't have any special permissions assigned. Use
                  the "Request New Permission" button to request access to
                  additional features.
                </Alert>
              ) : (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {/* Global Permissions */}
                  <Box borderWidth="1px" borderRadius="lg" p={4}>
                    <Heading size="sm" mb={4}>
                      Global Permissions
                    </Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Permission</Th>
                          <Th>Description</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userPermissions
                          .filter((p) => !p.resourceId)
                          .map((permission) => (
                            <Tr key={permission.id}>
                              <Td fontFamily="mono" fontSize="xs">
                                {permission.id}
                              </Td>
                              <Td>
                                {permission.description || permission.name}
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </Box>

                  {/* Resource-specific Permissions */}
                  <Box borderWidth="1px" borderRadius="lg" p={4}>
                    <Heading size="sm" mb={4}>
                      Resource-Specific Permissions
                    </Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Permission</Th>
                          <Th>Resource</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userPermissions
                          .filter((p) => p.resourceId)
                          .map((permission) => (
                            <Tr
                              key={`${permission.id}-${permission.resourceId}`}
                            >
                              <Td fontFamily="mono" fontSize="xs">
                                {permission.id}
                              </Td>
                              <Td>
                                <HStack>
                                  <Badge colorScheme="purple">
                                    {permission.resourceType}
                                  </Badge>
                                  <Text fontSize="xs" fontFamily="mono">
                                    {permission.resourceId}
                                  </Text>
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </Box>
                </SimpleGrid>
              )}
            </TabPanel>

            {/* Request History Tab */}
            <TabPanel p={4}>
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="md">Permission Request History</Heading>
              </Flex>

              {permissionRequests.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  You haven't made any permission requests yet.
                </Alert>
              ) : (
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Permission</Th>
                      <Th>Status</Th>
                      <Th>Updated</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {permissionRequests.map((request) => (
                      <Tr key={request._id}>
                        <Td>
                          <Tooltip label={formatDate(request.createdAt)}>
                            <HStack>
                              <TimeIcon color="gray.500" />
                              <Text>
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </Text>
                            </HStack>
                          </Tooltip>
                        </Td>
                        <Td>
                          {request.permission ||
                            (request.bundleId && (
                              <HStack>
                                <Badge colorScheme="purple">Bundle</Badge>
                                <Text>
                                  {request.bundle?.name || "Permission Bundle"}
                                </Text>
                              </HStack>
                            ))}
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </Td>
                        <Td>
                          {request.updatedAt ? (
                            <Tooltip label={formatDate(request.updatedAt)}>
                              <Text>
                                {new Date(
                                  request.updatedAt
                                ).toLocaleDateString()}
                              </Text>
                            </Tooltip>
                          ) : (
                            "Pending"
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>

      {/* New Permission Request Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Permission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Request Type</FormLabel>
                <Select
                  name="type"
                  value={requestForm.type}
                  onChange={handleFormChange}
                >
                  <option value="permission">Individual Permission</option>
                  <option value="bundle">Permission Bundle</option>
                </Select>
              </FormControl>

              {requestForm.type === "permission" ? (
                <FormControl isRequired>
                  <FormLabel>Permission</FormLabel>
                  <Select
                    name="permission"
                    value={requestForm.permission}
                    onChange={handleFormChange}
                    placeholder="Select a permission"
                  >
                    {availablePermissions.map((perm) => (
                      <option key={perm.id} value={perm.id}>
                        {perm.name} ({perm.id})
                      </option>
                    ))}
                  </Select>
                  <FormHelperText>
                    Select the permission you need access to
                  </FormHelperText>
                </FormControl>
              ) : (
                <FormControl isRequired>
                  <FormLabel>Permission Bundle</FormLabel>
                  <Select
                    name="bundleId"
                    value={requestForm.bundleId}
                    onChange={handleFormChange}
                    placeholder="Select a permission bundle"
                  >
                    {permissionBundles.map((bundle) => (
                      <option key={bundle._id} value={bundle._id}>
                        {bundle.name}
                      </option>
                    ))}
                  </Select>
                  <FormHelperText>
                    Permission bundles contain multiple related permissions
                  </FormHelperText>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Resource (Optional)</FormLabel>
                <HStack>
                  <Select
                    name="resourceType"
                    value={requestForm.resourceType}
                    onChange={handleFormChange}
                    placeholder="Resource type (optional)"
                    width="40%"
                  >
                    <option value="listing">Listing</option>
                    <option value="user">User</option>
                    <option value="organization">Organization</option>
                    <option value="report">Report</option>
                  </Select>
                  <Input
                    name="resourceId"
                    value={requestForm.resourceId}
                    onChange={handleFormChange}
                    placeholder="Resource ID (optional)"
                    width="60%"
                  />
                </HStack>
                <FormHelperText>
                  Only fill this if you need permission for a specific resource
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Duration</FormLabel>
                <Select
                  name="requestedDuration"
                  value={requestForm.requestedDuration}
                  onChange={handleFormChange}
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary (30 days)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Justification</FormLabel>
                <Textarea
                  name="justification"
                  value={requestForm.justification}
                  onChange={handleFormChange}
                  placeholder="Explain why you need this permission..."
                  rows={4}
                />
                <FormHelperText>
                  Please provide a clear explanation of why you need this
                  permission
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={submitPermissionRequest}>
              Submit Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Set the layout
MyPermissionsPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

// Wrap the page with authentication
export default withAuth(MyPermissionsPage);
