import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardBody, 
  CardHeader, 
  Heading, 
  Button, 
  FormControl, 
  FormLabel, 
  FormHelperText,
  useToast,
  Badge,
  Flex,
  Text,
  Stack,
  HStack,
  CheckboxGroup,
  Checkbox,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
  Input,
  InputGroup,
  InputRightElement,
  Collapse,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Icon,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { AddIcon, CalendarIcon, InfoIcon, WarningIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { PERMISSIONS } from '../../lib/permissions-manager';

/**
 * UserPermissionManager Component
 * 
 * Allows admins to manage user-specific permissions with a clean interface
 * and supports adding temporary permissions with expiration dates.
 */
const UserPermissionManager = ({ userId, userRole, currentPermissions = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState(currentPermissions);
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [temporaryPermissions, setTemporaryPermissions] = useState({});
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [permissionToRevoke, setPermissionToRevoke] = useState(null);
  const cancelRef = React.useRef();
  const toast = useToast();

  // Fetch user permissions on load
  useEffect(() => {
    fetchUserPermissions();
    // Get all available permissions
    const allPermissions = Object.keys(PERMISSIONS).map(key => ({ 
      name: key, 
      description: PERMISSIONS[key].description 
    }));
    setAvailablePermissions(allPermissions);
    setFilteredPermissions(allPermissions);
  }, [userId]);

  // Filter available permissions based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = availablePermissions.filter(
        perm => perm.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                perm.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPermissions(filtered);
    } else {
      setFilteredPermissions(availablePermissions);
    }
  }, [searchQuery, availablePermissions]);

  // Fetch user permissions and temporary permissions data
  const fetchUserPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user permissions');
      }
      
      setPermissions(data.permissions || []);
      setTemporaryPermissions(data.temporaryPermissions || {});
    } catch (error) {
      toast({
        title: 'Error fetching permissions',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Grant a permission to the user
  const handleGrantPermission = async () => {
    if (!selectedPermission) return;
    
    setIsLoading(true);
    try {
      const expiresAt = isTemporary ? 
        new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() :
        null;

      const response = await fetch(`/api/users/permissions/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          permission: selectedPermission,
          grant: true,
          temporary: isTemporary,
          expiresAt
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant permission');
      }

      toast({
        title: 'Permission granted',
        description: `${selectedPermission} permission has been granted to user${isTemporary ? ' (temporary)' : ''}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh permissions
      fetchUserPermissions();
      
      // Reset form
      setSelectedPermission('');
      closeModal();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm permission revocation
  const openRevokeConfirmation = (permission) => {
    setPermissionToRevoke(permission);
    setIsConfirmOpen(true);
  };

  // Revoke a permission from the user
  const handleRevokePermission = async () => {
    if (!permissionToRevoke) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/permissions/manage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          permission: permissionToRevoke,
          grant: false
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke permission');
      }

      toast({
        title: 'Permission revoked',
        description: `${permissionToRevoke} permission has been revoked from user`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh permissions
      fetchUserPermissions();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setIsConfirmOpen(false);
      setPermissionToRevoke(null);
    }
  };

  // Format expiration date for display
  const formatExpirationDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days remaining until expiration
  const getDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expDate = new Date(expiresAt);
    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get badge color based on days remaining
  const getExpirationColor = (expiresAt) => {
    const daysRemaining = getDaysRemaining(expiresAt);
    if (daysRemaining <= 1) return 'red';
    if (daysRemaining <= 3) return 'orange';
    if (daysRemaining <= 7) return 'yellow';
    return 'green';
  };

  return (
    <Card
      variant="outline"
      borderRadius="lg"
      boxShadow="sm"
      mt={6}
      bg="white"
      borderColor="gray.200"
    >
      <CardHeader pb={2}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="md">User Permissions</Heading>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="blue" 
            size="sm"
            onClick={openModal}
            isDisabled={isLoading}
          >
            Grant Permission
          </Button>
        </Flex>
      </CardHeader>
      <CardBody>
        {isLoading && (
          <Flex justify="center" align="center" my={4}>
            <Spinner />
          </Flex>
        )}
        
        {!isLoading && permissions.length === 0 && (
          <Flex 
            direction="column" 
            align="center" 
            justify="center"
            bg="gray.50"
            p={4}
            borderRadius="md"
            border="1px dashed"
            borderColor="gray.300"
          >
            <Text color="gray.500">No custom permissions granted to this user.</Text>
            <Text fontSize="sm" color="gray.400" mt={1}>
              User has standard permissions from their {userRole} role.
            </Text>
          </Flex>
        )}
        
        {!isLoading && permissions.length > 0 && (
          <Box>
            <Text mb={2} fontSize="sm" color="gray.600">
              <Icon as={InfoIcon} mr={1} color="blue.500" />
              User has {permissions.length} custom permission(s) in addition to standard {userRole} role permissions.
            </Text>
            
            <Table variant="simple" size="sm" mt={3}>
              <Thead bg="gray.50">
                <Tr>
                  <Th>Permission</Th>
                  <Th>Type</Th>
                  <Th>Expiration</Th>
                  <Th width="80px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {permissions.map((permission) => {
                  const isTemp = temporaryPermissions[permission];
                  const expiresAt = isTemp ? temporaryPermissions[permission].expiresAt : null;
                  
                  return (
                    <Tr key={permission}>
                      <Td>
                        <Tooltip 
                          label={PERMISSIONS[permission]?.description || 'Custom permission'} 
                          placement="top"
                        >
                          <Text fontFamily="mono" fontSize="xs">
                            {permission}
                          </Text>
                        </Tooltip>
                      </Td>
                      <Td>
                        {isTemp ? (
                          <Badge colorScheme="purple" variant="subtle">
                            Temporary
                          </Badge>
                        ) : (
                          <Badge colorScheme="blue" variant="subtle">
                            Permanent
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        {isTemp ? (
                          <Tooltip 
                            label={`Expires on ${formatExpirationDate(expiresAt)}`}
                            placement="top"
                          >
                            <Badge 
                              colorScheme={getExpirationColor(expiresAt)}
                              variant="outline"
                            >
                              <CalendarIcon mr={1} />
                              {getDaysRemaining(expiresAt)} days left
                            </Badge>
                          </Tooltip>
                        ) : (
                          <Text fontSize="xs" color="gray.400">
                            N/A
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => openRevokeConfirmation(permission)}
                        >
                          Revoke
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
        
        {/* Grant Permission Modal */}
        <Modal isOpen={isModalOpen} onClose={closeModal} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Grant Permission</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl mb={4}>
                <FormLabel>Search Permissions</FormLabel>
                <InputGroup>
                  <Input
                    placeholder="Type to search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <InputRightElement>
                    {searchQuery && (
                      <CloseIcon 
                        boxSize={3} 
                        cursor="pointer"
                        onClick={() => setSearchQuery('')}
                      />
                    )}
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Select Permission</FormLabel>
                <Select
                  placeholder="Choose a permission to grant"
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                >
                  {filteredPermissions.map((perm) => (
                    <option key={perm.name} value={perm.name}>
                      {perm.name} - {perm.description}
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  Select the permission you want to grant to this user
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb={0}>
                  Temporary Permission
                </FormLabel>
                <Switch 
                  colorScheme="purple"
                  isChecked={isTemporary}
                  onChange={() => setIsTemporary(!isTemporary)}
                />
              </FormControl>
              
              <Collapse in={isTemporary} animateOpacity>
                <FormControl mt={4}>
                  <FormLabel>Expiration (days)</FormLabel>
                  <NumberInput 
                    max={365} 
                    min={1} 
                    value={expirationDays}
                    onChange={(valueString) => setExpirationDays(parseInt(valueString, 10))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    Permission will automatically expire after this many days
                  </FormHelperText>
                </FormControl>
              </Collapse>
            </ModalBody>

            <ModalFooter>
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={handleGrantPermission}
                isLoading={isLoading}
                isDisabled={!selectedPermission}
              >
                Grant Permission
              </Button>
              <Button onClick={closeModal}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Revoke Permission Confirmation */}
        <AlertDialog
          isOpen={isConfirmOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsConfirmOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Revoke Permission
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to revoke the <Badge colorScheme="red">{permissionToRevoke}</Badge> permission from this user?
                
                <Text mt={2} fontSize="sm" color="gray.600">
                  This action cannot be undone and may affect the user's access to certain features.
                </Text>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleRevokePermission} 
                  ml={3}
                  isLoading={isLoading}
                >
                  Revoke
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </CardBody>
    </Card>
  );
};

export default UserPermissionManager;