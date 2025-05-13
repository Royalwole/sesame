import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Select,
  Stack,
  IconButton,
  useToast,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@chakra-ui/icons';

/**
 * Permission Bundle Manager Component
 * 
 * Allows administrators to view, create, edit, and delete permission bundles.
 */
function PermissionBundleManager() {
  const toast = useToast();
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onClose: onCreateClose 
  } = useDisclosure();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  
  // State hooks
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Form state for creating/editing bundles
  const [currentBundle, setCurrentBundle] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [tempSelectedPermissions, setTempSelectedPermissions] = useState([]);
  const [bundleToDelete, setBundleToDelete] = useState(null);
  const [permissionSearch, setPermissionSearch] = useState('');
  
  // Load bundles and available permissions when component mounts
  useEffect(() => {
    Promise.all([
      fetchBundles(),
      fetchAllPermissions()
    ]).catch(err => {
      console.error('Error initializing bundle manager:', err);
      setError('Failed to initialize. Please try refreshing the page.');
    });
  }, []);
  
  // Fetch all bundles
  const fetchBundles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/permission-bundles');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch bundles');
      }
      
      setBundles(data.bundles || []);
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all available permissions
  const fetchAllPermissions = async () => {
    try {
      const response = await fetch('/api/users/permissions/list');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch permissions');
      }
      
      setAllPermissions(data.permissions || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };
  
  // Handle sorting
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUpIcon ml={1} />
      : <ChevronDownIcon ml={1} />;
  };
  
  // Filter and sort bundles
  const filteredBundles = bundles
    .filter(bundle => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        bundle.name.toLowerCase().includes(query) ||
        bundle.description.toLowerCase().includes(query) ||
        bundle.permissions.some(p => p.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      let fieldA = a[sortField];
      let fieldB = b[sortField];
      
      // Special case for permissions length sorting
      if (sortField === 'permissionsCount') {
        fieldA = a.permissions?.length || 0;
        fieldB = b.permissions?.length || 0;
      }
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  
  // Handle bundle creation form submission
  const handleCreateBundle = async () => {
    try {
      if (!currentBundle.name) {
        toast({
          title: "Name required",
          description: "Please provide a name for the bundle",
          status: "error",
          duration: 3000
        });
        return;
      }
      
      if (!currentBundle.permissions.length) {
        toast({
          title: "Permissions required",
          description: "Please select at least one permission for the bundle",
          status: "warning",
          duration: 3000
        });
        return;
      }
      
      const response = await fetch('/api/admin/permission-bundles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentBundle)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create bundle');
      }
      
      toast({
        title: "Bundle created",
        description: `Successfully created bundle "${currentBundle.name}"`,
        status: "success",
        duration: 5000
      });
      
      // Reset form and close modal
      setCurrentBundle({
        name: '',
        description: '',
        permissions: []
      });
      onCreateClose();
      
      // Refresh bundles
      fetchBundles();
      
    } catch (err) {
      console.error('Error creating bundle:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to create bundle",
        status: "error",
        duration: 5000
      });
    }
  };
  
  // Handle bundle update form submission
  const handleUpdateBundle = async () => {
    try {
      if (!currentBundle.name) {
        toast({
          title: "Name required",
          description: "Please provide a name for the bundle",
          status: "error",
          duration: 3000
        });
        return;
      }
      
      if (!currentBundle.permissions.length) {
        toast({
          title: "Permissions required",
          description: "Please select at least one permission for the bundle",
          status: "warning",
          duration: 3000
        });
        return;
      }
      
      const response = await fetch(`/api/admin/permission-bundles/${currentBundle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentBundle)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update bundle');
      }
      
      toast({
        title: "Bundle updated",
        description: `Successfully updated bundle "${currentBundle.name}"`,
        status: "success",
        duration: 5000
      });
      
      // Reset form and close modal
      setCurrentBundle({
        name: '',
        description: '',
        permissions: []
      });
      onEditClose();
      
      // Refresh bundles
      fetchBundles();
      
    } catch (err) {
      console.error('Error updating bundle:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update bundle",
        status: "error",
        duration: 5000
      });
    }
  };
  
  // Handle bundle deletion
  const handleDeleteBundle = async () => {
    if (!bundleToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/permission-bundles/${bundleToDelete._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete bundle');
      }
      
      toast({
        title: "Bundle deleted",
        description: `Successfully deleted bundle "${bundleToDelete.name}"`,
        status: "success",
        duration: 5000
      });
      
      // Reset state and close modal
      setBundleToDelete(null);
      onDeleteClose();
      
      // Refresh bundles
      fetchBundles();
      
    } catch (err) {
      console.error('Error deleting bundle:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete bundle",
        status: "error",
        duration: 5000
      });
    }
  };
  
  // Open edit modal with bundle data
  const openEditModal = (bundle) => {
    setCurrentBundle({...bundle});
    setTempSelectedPermissions([...bundle.permissions]);
    onEditOpen();
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (bundle) => {
    setBundleToDelete(bundle);
    onDeleteClose();
  };
  
  // Open create modal
  const openCreateModal = () => {
    setCurrentBundle({
      name: '',
      description: '',
      permissions: []
    });
    setTempSelectedPermissions([]);
    onCreateOpen();
  };
  
  // Handle permission selection in bundle forms
  const handlePermissionSelection = (e) => {
    const permissionId = e.target.value;
    
    if (permissionId && !tempSelectedPermissions.includes(permissionId)) {
      setTempSelectedPermissions([...tempSelectedPermissions, permissionId]);
      setCurrentBundle({
        ...currentBundle,
        permissions: [...tempSelectedPermissions, permissionId]
      });
    }
    
    // Reset the select field
    e.target.value = '';
  };
  
  // Remove a permission from the selection
  const removePermission = (permission) => {
    const updatedPermissions = tempSelectedPermissions.filter(p => p !== permission);
    setTempSelectedPermissions(updatedPermissions);
    setCurrentBundle({
      ...currentBundle,
      permissions: updatedPermissions
    });
  };
  
  // Filter permissions for selection dropdown
  const filteredPermissions = allPermissions.filter(permission => {
    return (
      !tempSelectedPermissions.includes(permission.id) && 
      permission.id.toLowerCase().includes(permissionSearch.toLowerCase())
    );
  });
  
  // Handle permission search input change
  const handlePermissionSearchChange = (e) => {
    setPermissionSearch(e.target.value);
  };
  
  // Show loading state
  if (loading && !bundles.length) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading permission bundles...</Text>
      </Box>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Permission Bundles</Heading>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          onClick={openCreateModal}
        >
          Create Bundle
        </Button>
      </Flex>
      
      <Box mb={5}>
        <Text mb={3}>
          Permission bundles allow you to group related permissions and assign them to users together.
        </Text>
        <Flex>
          <Input
            placeholder="Search bundles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxW="400px"
            mr={2}
            leftIcon={<SearchIcon />}
          />
          <Button
            leftIcon={<SearchIcon />}
            onClick={() => setSearchQuery('')}
            isDisabled={!searchQuery}
          >
            Clear
          </Button>
        </Flex>
      </Box>
      
      {bundles.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          No permission bundles found. Create your first bundle to get started.
        </Alert>
      ) : (
        <Table variant="simple" width="100%">
          <Thead>
            <Tr>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('name')}
              >
                <Flex align="center">
                  Bundle Name {getSortIcon('name')}
                </Flex>
              </Th>
              <Th>Description</Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('permissionsCount')}
              >
                <Flex align="center">
                  Permissions {getSortIcon('permissionsCount')}
                </Flex>
              </Th>
              <Th width="150px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredBundles.map((bundle) => (
              <Tr key={bundle._id}>
                <Td fontWeight="medium">{bundle.name}</Td>
                <Td>{bundle.description}</Td>
                <Td>
                  <Badge colorScheme="blue">{bundle.permissions?.length || 0}</Badge>
                </Td>
                <Td>
                  <Flex>
                    <IconButton
                      aria-label="Edit bundle"
                      icon={<EditIcon />}
                      size="sm"
                      mr={2}
                      onClick={() => openEditModal(bundle)}
                    />
                    <IconButton
                      aria-label="Delete bundle"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => openDeleteModal(bundle)}
                    />
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      
      {/* Create Bundle Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Permission Bundle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Bundle Name</FormLabel>
                <Input 
                  value={currentBundle.name} 
                  onChange={(e) => setCurrentBundle({...currentBundle, name: e.target.value})}
                  placeholder="e.g., Reporting Access"
                />
                <FormHelperText>Choose a descriptive name for this bundle</FormHelperText>
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  value={currentBundle.description} 
                  onChange={(e) => setCurrentBundle({...currentBundle, description: e.target.value})}
                  placeholder="Describe the purpose of this bundle..."
                />
                <FormHelperText>Explain what this bundle grants access to</FormHelperText>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Permissions</FormLabel>
                <Box mb={2}>
                  <Input
                    placeholder="Filter permissions..."
                    value={permissionSearch}
                    onChange={handlePermissionSearchChange}
                    mb={2}
                  />
                  <Select 
                    placeholder="Add a permission..." 
                    onChange={handlePermissionSelection}
                  >
                    {filteredPermissions.map(permission => (
                      <option key={permission.id} value={permission.id}>
                        {permission.name} ({permission.id})
                      </option>
                    ))}
                  </Select>
                </Box>
                
                <Box mt={2}>
                  {tempSelectedPermissions.length === 0 ? (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                      No permissions selected
                    </Text>
                  ) : (
                    <HStack spacing={2} wrap="wrap">
                      {tempSelectedPermissions.map(permission => (
                        <Tag key={permission} size="md" colorScheme="blue" borderRadius="full" my={1}>
                          <TagLabel>{permission}</TagLabel>
                          <TagCloseButton onClick={() => removePermission(permission)} />
                        </Tag>
                      ))}
                    </HStack>
                  )}
                </Box>
                <FormHelperText>
                  Select all permissions that should be included in this bundle
                </FormHelperText>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateBundle}>
              Create Bundle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Edit Bundle Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Permission Bundle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Bundle Name</FormLabel>
                <Input 
                  value={currentBundle.name} 
                  onChange={(e) => setCurrentBundle({...currentBundle, name: e.target.value})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea 
                  value={currentBundle.description} 
                  onChange={(e) => setCurrentBundle({...currentBundle, description: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Permissions</FormLabel>
                <Box mb={2}>
                  <Input
                    placeholder="Filter permissions..."
                    value={permissionSearch}
                    onChange={handlePermissionSearchChange}
                    mb={2}
                  />
                  <Select 
                    placeholder="Add a permission..." 
                    onChange={handlePermissionSelection}
                  >
                    {filteredPermissions.map(permission => (
                      <option key={permission.id} value={permission.id}>
                        {permission.name} ({permission.id})
                      </option>
                    ))}
                  </Select>
                </Box>
                
                <Box mt={2}>
                  {tempSelectedPermissions.length === 0 ? (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                      No permissions selected
                    </Text>
                  ) : (
                    <HStack spacing={2} wrap="wrap">
                      {tempSelectedPermissions.map(permission => (
                        <Tag key={permission} size="md" colorScheme="blue" borderRadius="full" my={1}>
                          <TagLabel>{permission}</TagLabel>
                          <TagCloseButton onClick={() => removePermission(permission)} />
                        </Tag>
                      ))}
                    </HStack>
                  )}
                </Box>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateBundle}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Bundle Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Bundle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to delete the bundle "{bundleToDelete?.name}"?
            </Text>
            <Alert status="warning" mt={3}>
              <AlertIcon />
              This will not remove the permissions from users who already have them.
              It only deletes the bundle itself.
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteBundle}>
              Delete Bundle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default PermissionBundleManager;