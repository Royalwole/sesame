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
  Textarea,
  Select,
  Stack,
  IconButton,
  useToast,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Avatar,
  Tooltip,
  HStack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Divider,
  Tag,
} from '@chakra-ui/react';
import { 
  CheckIcon, 
  CloseIcon, 
  InfoIcon, 
  TimeIcon,
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ViewIcon,
} from '@chakra-ui/icons';

/**
 * Permission Request Review Component
 * 
 * Allows administrators to review, approve, or deny permission requests
 * submitted by users through the self-service permission portal.
 */
function PermissionRequestReview() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // State hooks
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Fetches requests when component mounts or when tab changes
  useEffect(() => {
    fetchRequests();
  }, [tabIndex, pagination.currentPage]);
  
  // Fetch permission requests from API
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const status = tabIndex === 0 ? 'pending' : tabIndex === 1 ? 'approved' : 'denied';
      
      const response = await fetch(`/api/admin/permission-requests?status=${status}&page=${pagination.currentPage}&sort=${sortField}&direction=${sortDirection}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch permission requests');
      }
      
      setRequests(data.requests || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    } catch (err) {
      console.error('Error fetching permission requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
    
    // Refresh requests with new sorting
    fetchRequests();
  };
  
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUpIcon ml={1} />
      : <ChevronDownIcon ml={1} />;
  };
  
  // Filter requests based on search query
  const filteredRequests = requests.filter(request => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (request.user?.name && request.user.name.toLowerCase().includes(query)) ||
      (request.user?.email && request.user.email.toLowerCase().includes(query)) ||
      (request.permission && request.permission.toLowerCase().includes(query)) ||
      (request.justification && request.justification.toLowerCase().includes(query)) ||
      (request.resourceId && request.resourceId.toLowerCase().includes(query))
    );
  });
  
  // Open request details modal
  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    setReviewAction('');
    setReviewNotes('');
    onOpen();
  };
  
  // Process permission request (approve or deny)
  const processRequest = async () => {
    if (!selectedRequest || !reviewAction) return;
    
    setProcessingAction(true);
    
    try {
      const response = await fetch(`/api/admin/permission-requests/${selectedRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process request');
      }
      
      toast({
        title: reviewAction === 'approve' ? 'Request Approved' : 'Request Denied',
        description: `The permission request has been ${reviewAction === 'approve' ? 'approved' : 'denied'}.`,
        status: reviewAction === 'approve' ? 'success' : 'info',
        duration: 5000
      });
      
      // Close modal and refresh requests
      onClose();
      fetchRequests();
      
    } catch (err) {
      console.error('Error processing request:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to process the request',
        status: 'error',
        duration: 5000
      });
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (index) => {
    setTabIndex(index);
    setPagination({
      ...pagination,
      currentPage: 1
    });
  };
  
  // Get status color scheme for badges
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'denied': return 'red';
      case 'canceled': return 'gray';
      default: return 'gray';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Handle pagination
  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      setPagination({
        ...pagination,
        currentPage: pagination.currentPage + 1
      });
    }
  };
  
  const goToPreviousPage = () => {
    if (pagination.hasPrevPage) {
      setPagination({
        ...pagination,
        currentPage: pagination.currentPage - 1
      });
    }
  };
  
  // Loading state
  if (loading && !requests.length) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading permission requests...</Text>
      </Box>
    );
  }
  
  // Error state
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
        <Heading size="lg">Permission Requests</Heading>
      </Flex>
      
      <Tabs isLazy index={tabIndex} onChange={handleTabChange} colorScheme="blue">
        <TabList mb={4}>
          <Tab>Pending</Tab>
          <Tab>Approved</Tab>
          <Tab>Denied</Tab>
        </TabList>
        
        <Box mb={4}>
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxW="400px"
            leftIcon={<SearchIcon />}
            aria-label="Search permission requests"
          />
        </Box>
        
        <TabPanels>
          {/* All tabs have similar content with different data */}
          {[0, 1, 2].map((index) => (
            <TabPanel key={index} p={0}>
              {filteredRequests.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  No {index === 0 ? 'pending' : index === 1 ? 'approved' : 'denied'} permission requests found.
                </Alert>
              ) : (
                <>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th 
                          cursor="pointer"
                          onClick={() => handleSort('createdAt')}
                        >
                          <Flex align="center">
                            Date {getSortIcon('createdAt')}
                          </Flex>
                        </Th>
                        <Th 
                          cursor="pointer"
                          onClick={() => handleSort('user.name')}
                        >
                          <Flex align="center">
                            User {getSortIcon('user.name')}
                          </Flex>
                        </Th>
                        <Th>Requested Permission</Th>
                        <Th>Type</Th>
                        <Th>Duration</Th>
                        <Th width="100px">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredRequests.map((request) => (
                        <Tr key={request._id}>
                          <Td>
                            <Tooltip label={formatDate(request.createdAt)}>
                              <HStack>
                                <TimeIcon color="gray.500" />
                                <Text>{new Date(request.createdAt).toLocaleDateString()}</Text>
                              </HStack>
                            </Tooltip>
                          </Td>
                          <Td>
                            <HStack>
                              <Avatar 
                                size="sm" 
                                name={request.user?.name || 'User'} 
                                src={request.user?.profileImage}
                              />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">{request.user?.name || 'Unknown User'}</Text>
                                <Text fontSize="xs" color="gray.500">{request.user?.email}</Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td fontFamily="mono" fontSize="sm">
                            {request.permission || (request.bundleId && (
                              <HStack>
                                <Tag colorScheme="purple">Bundle</Tag>
                                <Text>{request.bundle?.name || 'Permission Bundle'}</Text>
                              </HStack>
                            ))}
                          </Td>
                          <Td>
                            {request.resourceId ? (
                              <Badge colorScheme="purple">Resource-specific</Badge>
                            ) : (
                              <Badge colorScheme="blue">Global</Badge>
                            )}
                          </Td>
                          <Td>
                            {request.requestedDuration === 'permanent' ? (
                              <Badge colorScheme="blue">Permanent</Badge>
                            ) : (
                              <Tooltip label={`Until ${formatDate(request.requestedExpiration)}`}>
                                <Badge colorScheme="green">Temporary</Badge>
                              </Tooltip>
                            )}
                          </Td>
                          <Td>
                            {index === 0 ? (
                              <HStack>
                                <IconButton
                                  icon={<ViewIcon />}
                                  size="sm"
                                  aria-label="View request details"
                                  onClick={() => viewRequestDetails(request)}
                                />
                              </HStack>
                            ) : (
                              <IconButton
                                icon={<InfoIcon />}
                                size="sm"
                                aria-label="View request details"
                                onClick={() => viewRequestDetails(request)}
                              />
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <Flex justify="center" mt={4}>
                      <Button 
                        isDisabled={!pagination.hasPrevPage}
                        onClick={goToPreviousPage}
                        mr={2}
                      >
                        Previous
                      </Button>
                      <Text alignSelf="center" mx={4}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </Text>
                      <Button 
                        isDisabled={!pagination.hasNextPage}
                        onClick={goToNextPage}
                        ml={2}
                      >
                        Next
                      </Button>
                    </Flex>
                  )}
                </>
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
      
      {/* Request Details Modal */}
      {selectedRequest && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Permission Request Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <HStack>
                  <Avatar 
                    size="md" 
                    name={selectedRequest.user?.name || 'User'} 
                    src={selectedRequest.user?.profileImage}
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{selectedRequest.user?.name}</Text>
                    <Text fontSize="sm">{selectedRequest.user?.email}</Text>
                  </VStack>
                  <Spacer />
                  <Badge colorScheme={getStatusColor(selectedRequest.status)} fontSize="md" p={1}>
                    {selectedRequest.status.toUpperCase()}
                  </Badge>
                </HStack>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold" mb={1}>Requested Permission</Text>
                  {selectedRequest.permission ? (
                    <Text fontFamily="mono">{selectedRequest.permission}</Text>
                  ) : selectedRequest.bundleId ? (
                    <VStack align="start">
                      <HStack>
                        <Tag colorScheme="purple">Bundle</Tag>
                        <Text fontWeight="medium">{selectedRequest.bundle?.name || 'Permission Bundle'}</Text>
                      </HStack>
                      {selectedRequest.bundle?.description && (
                        <Text fontSize="sm" color="gray.600">
                          {selectedRequest.bundle.description}
                        </Text>
                      )}
                    </VStack>
                  ) : (
                    <Text>Unknown permission request</Text>
                  )}
                </Box>
                
                {selectedRequest.resourceId && (
                  <Box>
                    <Text fontWeight="bold" mb={1}>Resource Specifics</Text>
                    <HStack>
                      <Badge colorScheme="purple">Resource</Badge>
                      <Text>{selectedRequest.resourceType || 'Resource'}</Text>
                      <Text fontFamily="mono" fontSize="sm">{selectedRequest.resourceId}</Text>
                    </HStack>
                  </Box>
                )}
                
                <Box>
                  <Text fontWeight="bold" mb={1}>Duration</Text>
                  {selectedRequest.requestedDuration === 'permanent' ? (
                    <Badge colorScheme="blue">Permanent</Badge>
                  ) : (
                    <VStack align="start">
                      <Badge colorScheme="green">Temporary</Badge>
                      <Text fontSize="sm">
                        Expires: {formatDate(selectedRequest.requestedExpiration)}
                      </Text>
                    </VStack>
                  )}
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={1}>Justification</Text>
                  <Alert status="info" variant="left-accent">
                    <Text>{selectedRequest.justification}</Text>
                  </Alert>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={1}>Request Timeline</Text>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <TimeIcon color="blue.500" />
                      <Text fontSize="sm">
                        Submitted: {formatDate(selectedRequest.createdAt)}
                      </Text>
                    </HStack>
                    
                    {selectedRequest.status !== 'pending' && selectedRequest.updatedAt && (
                      <HStack>
                        <TimeIcon color="green.500" />
                        <Text fontSize="sm">
                          {selectedRequest.status === 'approved' ? 'Approved' : 'Denied'}: 
                          {formatDate(selectedRequest.updatedAt)}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
                
                {selectedRequest.reviewNotes && (
                  <Box>
                    <Text fontWeight="bold" mb={1}>Review Notes</Text>
                    <Alert 
                      status={selectedRequest.status === 'approved' ? 'success' : 'warning'} 
                      variant="left-accent"
                    >
                      <Text>{selectedRequest.reviewNotes}</Text>
                    </Alert>
                  </Box>
                )}
                
                {/* Show review form only for pending requests */}
                {selectedRequest.status === 'pending' && (
                  <>
                    <Divider />
                    
                    <FormControl isRequired>
                      <FormLabel>Review Decision</FormLabel>
                      <Select 
                        placeholder="Select action" 
                        value={reviewAction} 
                        onChange={(e) => setReviewAction(e.target.value)}
                      >
                        <option value="approve">Approve Request</option>
                        <option value="deny">Deny Request</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Review Notes</FormLabel>
                      <Textarea 
                        value={reviewNotes} 
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Provide any notes or explanations for your decision..."
                      />
                    </FormControl>
                  </>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={onClose}>
                Close
              </Button>
              {selectedRequest.status === 'pending' && (
                <Button 
                  colorScheme={reviewAction === 'approve' ? 'green' : 'red'}
                  leftIcon={reviewAction === 'approve' ? <CheckIcon /> : <CloseIcon />}
                  onClick={processRequest}
                  isLoading={processingAction}
                  isDisabled={!reviewAction}
                >
                  {reviewAction === 'approve' ? 'Approve' : reviewAction === 'deny' ? 'Deny' : 'Select Action'}
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}

// Helper component for layout
const Spacer = () => <Box flex="1" />;

export default PermissionRequestReview;