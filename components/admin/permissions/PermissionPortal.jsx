import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Tabs, TabList, TabPanels, Tab, TabPanel, Spinner, Alert, AlertIcon, Badge } from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';
import usePermissions from '../../../hooks/usePermissions';
import PermissionCatalog from './PermissionCatalog';
import PermissionRequestForm from './PermissionRequestForm';
import PermissionRequestHistory from './PermissionRequestHistory';

/**
 * Self-service permission portal component
 * 
 * This component allows users to:
 * 1. View permissions they already have
 * 2. Browse available permissions and their descriptions
 * 3. Request additional permissions with justification
 * 4. View their permission request history
 */
function PermissionPortal() {
  const { user } = useAuth();
  const { PERMISSIONS, DOMAINS, hasPermission, getUserPermissions } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  
  // Fetch permissions when component mounts
  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get user's current permissions
        const myPermissions = await getUserPermissions(user?.id);
        setUserPermissions(myPermissions || []);
        
        // Get all available permissions with descriptions
        const response = await fetch('/api/users/permissions/list');
        const data = await response.json();
        
        if (data.success) {
          setAllPermissions(data.permissions || []);
        } else {
          throw new Error(data.error || 'Failed to load permissions catalog');
        }
      } catch (err) {
        console.error('Error loading permissions:', err);
        setError(err.message || 'Failed to load permissions data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      fetchPermissions();
    }
  }, [user?.id]);
  
  // Display loading state
  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading permissions...</Text>
      </Box>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        Error loading permissions: {error}
      </Alert>
    );
  }
  
  return (
    <Box bg="white" borderRadius="lg" p={6} shadow="md">
      <Heading size="lg" mb={4}>Permission Self-Service Portal</Heading>
      
      <Box mb={6}>
        <Text fontSize="md" color="gray.600">
          This portal allows you to view your existing permissions, discover available permissions, 
          and request new permissions for your role.
        </Text>
      </Box>
      
      {/* Permission summary for the current user */}
      <Box mb={6} p={4} bg="gray.50" borderRadius="md">
        <Heading size="sm" mb={2}>Your Permission Status</Heading>
        <Text mb={2}>
          You currently have <Badge colorScheme="blue">{userPermissions.length}</Badge> permissions.
        </Text>
        <Text fontSize="sm">
          Role: <Badge colorScheme="green">{user?.publicMetadata?.role || 'User'}</Badge>
        </Text>
      </Box>
      
      {/* Tab interface for the different sections */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>My Permissions</Tab>
          <Tab>Permission Catalog</Tab>
          <Tab>Request Permissions</Tab>
          <Tab>Request History</Tab>
        </TabList>
        
        <TabPanels>
          {/* My Permissions Tab */}
          <TabPanel>
            <Box>
              <Heading size="md" mb={4}>My Permissions</Heading>
              {userPermissions.length > 0 ? (
                <PermissionCatalog 
                  permissions={allPermissions.filter(p => userPermissions.includes(p.id))}
                  showAvailability={false}
                />
              ) : (
                <Text color="gray.500" fontStyle="italic">
                  You have no additional permissions beyond your role's default permissions.
                </Text>
              )}
            </Box>
          </TabPanel>
          
          {/* Permission Catalog Tab */}
          <TabPanel>
            <Box>
              <Heading size="md" mb={4}>Permission Catalog</Heading>
              <Text mb={4}>
                Browse all available permissions in the system. You can request any permission 
                that you don't currently have.
              </Text>
              <PermissionCatalog 
                permissions={allPermissions}
                userPermissions={userPermissions}
                showAvailability={true}
              />
            </Box>
          </TabPanel>
          
          {/* Request Permissions Tab */}
          <TabPanel>
            <Box>
              <Heading size="md" mb={4}>Request Permissions</Heading>
              <Text mb={4}>
                Submit a request for additional permissions. Provide a clear justification for why 
                you need these permissions to help administrators review your request.
              </Text>
              <PermissionRequestForm
                allPermissions={allPermissions}
                userPermissions={userPermissions}
              />
            </Box>
          </TabPanel>
          
          {/* Request History Tab */}
          <TabPanel>
            <Box>
              <Heading size="md" mb={4}>Request History</Heading>
              <Text mb={4}>
                View your previous permission requests and their current status.
              </Text>
              <PermissionRequestHistory userId={user?.id} />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default PermissionPortal;