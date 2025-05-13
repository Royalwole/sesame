import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Spinner,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

/**
 * AvailablePermissionsList Component
 * 
 * Displays all available permissions in the system with search and filter capabilities
 * for admin users to reference when assigning permissions
 */
const AvailablePermissionsList = () => {
  const [permissions, setPermissions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  
  // Background colors
  const headerBgColor = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.600');
  
  // Fetch permissions data when component mounts
  useEffect(() => {
    fetchPermissions();
  }, []);
  
  // Filter permissions when search query or domain filter changes
  useEffect(() => {
    if (!permissions.length) return;
    
    let filtered = [...permissions];
    
    // Apply domain filter
    if (domainFilter) {
      filtered = filtered.filter(p => p.domain === domainFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.id.toLowerCase().includes(query) || 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredPermissions(filtered);
  }, [searchQuery, domainFilter, permissions]);
  
  // Fetch permissions from API
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/permissions/available');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPermissions(data.permissions || []);
        setFilteredPermissions(data.permissions || []);
        setDomains(data.domains || []);
      } else {
        throw new Error(data.error || 'Failed to load permissions');
      }
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err.message || 'Failed to load permissions data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle domain filter change
  const handleDomainChange = (e) => {
    setDomainFilter(e.target.value);
  };
  
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
    <Box>
      <Heading size="md" mb={4}>System Permissions</Heading>
      <Text mb={4}>
        Below is a comprehensive list of all permissions available in the system.
        Use this reference when assigning permissions to users or creating permission bundles.
      </Text>
      
      {/* Search and filter tools */}
      <Flex mb={6} gap={4} flexDir={{ base: 'column', md: 'row' }}>
        <InputGroup maxW={{ base: '100%', md: '320px' }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input 
            placeholder="Search permissions..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </InputGroup>
        
        <Select 
          placeholder="Filter by domain" 
          value={domainFilter}
          onChange={handleDomainChange}
          maxW={{ base: '100%', md: '240px' }}
        >
          {domains.map(domain => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </Select>
      </Flex>
      
      {/* Results count */}
      <Text fontSize="sm" color="gray.500" mb={2}>
        Showing {filteredPermissions.length} of {permissions.length} permissions
      </Text>
      
      {/* Permissions table */}
      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead bg={headerBgColor}>
            <Tr>
              <Th>Permission ID</Th>
              <Th>Name</Th>
              <Th>Domain</Th>
              <Th>Description</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredPermissions.length === 0 ? (
              <Tr>
                <Td colSpan={4} textAlign="center" py={4}>
                  No permissions found matching your criteria
                </Td>
              </Tr>
            ) : filteredPermissions.map(permission => (
              <Tr 
                key={permission.id} 
                _hover={{ bg: rowHoverBg }}
              >
                <Td fontFamily="mono" fontSize="sm">
                  {permission.id}
                </Td>
                <Td fontWeight="medium">{permission.name}</Td>
                <Td>
                  <Badge colorScheme={getBadgeColor(permission.domain)}>
                    {permission.domain}
                  </Badge>
                </Td>
                <Td>{permission.description}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

// Helper to assign consistent colors to permission domains
function getBadgeColor(domain) {
  const colorMap = {
    ADMIN: 'purple',
    USERS: 'blue',
    LISTINGS: 'green',
    MESSAGES: 'cyan',
    REPORTS: 'orange',
    SETTINGS: 'gray',
    FINANCE: 'yellow',
    INSPECTIONS: 'teal',
    ANALYTICS: 'pink'
  };
  
  return colorMap[domain] || 'gray';
}

export default AvailablePermissionsList;