import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Badge, 
  Input, 
  Select, 
  Stack,
  Text,
  Tooltip,
  Icon
} from '@chakra-ui/react';
import { InfoIcon, CheckIcon, LockIcon } from '@chakra-ui/icons';

/**
 * Permission Catalog component
 * 
 * Displays a searchable, filterable table of permissions with their descriptions
 * and whether the current user has them
 * 
 * @param {Array} permissions - List of all permissions with metadata
 * @param {Array} userPermissions - List of permission IDs the user has
 * @param {Boolean} showAvailability - Whether to show if user has permissions
 */
function PermissionCatalog({ permissions = [], userPermissions = [], showAvailability = true }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  
  // Extract unique domains
  const domains = useMemo(() => {
    const domainSet = new Set(permissions.map(p => p.domain));
    return ['', ...Array.from(domainSet)]; // Add empty option for "All domains"
  }, [permissions]);
  
  // Filter permissions based on search and domain
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      // Domain filter
      if (domainFilter && permission.domain !== domainFilter) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          permission.id.toLowerCase().includes(query) || 
          permission.name.toLowerCase().includes(query) || 
          permission.description.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [permissions, searchQuery, domainFilter]);
  
  // Helper to check if user has a permission
  const hasPermission = (permissionId) => {
    return userPermissions.includes(permissionId);
  };
  
  return (
    <Box>
      {/* Filters */}
      <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
        <Box flex="3">
          <Input
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
        <Box flex="2">
          <Select
            placeholder="All domains"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            {domains.map((domain, index) => (
              domain ? <option key={index} value={domain}>{domain}</option> : null
            ))}
          </Select>
        </Box>
      </Stack>
      
      {/* Results count */}
      <Text mb={2} fontSize="sm" color="gray.600">
        Showing {filteredPermissions.length} of {permissions.length} permissions
      </Text>
      
      {/* Permissions table */}
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Permission</Th>
            <Th>Domain</Th>
            <Th>Description</Th>
            {showAvailability && <Th width="100px">Status</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {filteredPermissions.length > 0 ? (
            filteredPermissions.map((permission) => (
              <Tr key={permission.id}>
                <Td>
                  <Text fontFamily="mono" fontSize="sm">
                    {permission.id}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme="blue">{permission.domain}</Badge>
                </Td>
                <Td>
                  <Box>
                    <Text fontWeight="medium">{permission.name}</Text>
                    <Text fontSize="sm" color="gray.600">{permission.description}</Text>
                    {permission.warning && (
                      <Text fontSize="xs" color="orange.500" mt={1}>
                        <Icon as={InfoIcon} mr={1} boxSize={3} />
                        {permission.warning}
                      </Text>
                    )}
                  </Box>
                </Td>
                {showAvailability && (
                  <Td>
                    {hasPermission(permission.id) ? (
                      <Tooltip label="You have this permission" placement="left">
                        <Badge colorScheme="green" display="flex" alignItems="center">
                          <CheckIcon mr={1} boxSize={3} /> Granted
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Tooltip label="Request this permission" placement="left">
                        <Badge colorScheme="gray" display="flex" alignItems="center">
                          <LockIcon mr={1} boxSize={3} /> Not granted
                        </Badge>
                      </Tooltip>
                    )}
                  </Td>
                )}
              </Tr>
            ))
          ) : (
            <Tr>
              <Td colSpan={showAvailability ? 4 : 3} textAlign="center" py={4}>
                <Text color="gray.500">No permissions match your search criteria</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
}

export default PermissionCatalog;