import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Badge, 
  Button,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  Stack,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { InfoIcon, TimeIcon } from '@chakra-ui/icons';

/**
 * Permission Request History component
 * 
 * Displays the user's permission request history with status and details
 * 
 * @param {String} userId - The ID of the user to display history for
 */
function PermissionRequestHistory({ userId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Fetch request history when component mounts
  useEffect(() => {
    if (userId) {
      fetchRequests(1);
    }
  }, [userId]);
  
  // Fetch requests from API
  const fetchRequests = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/permissions/request?page=${page}`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests || []);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1 });
      } else {
        throw new Error(data.error || 'Failed to load permission request history');
      }
    } catch (err) {
      console.error('Error fetching permission request history:', err);
      setError(err.message || 'Failed to load request history');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    fetchRequests(newPage);
  };
  
  // View request details
  const viewRequestDetails = (request) => {
    setSelectedRequest(request);
    onOpen();
  };
  
  // Cancel a pending request
  const cancelRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/users/permissions/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cancel',
          reason: 'User canceled the request'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the requests list
        fetchRequests(pagination.currentPage);
      } else {
        throw new Error(data.error || 'Failed to cancel request');
      }
    } catch (err) {
      console.error('Error canceling request:', err);
      setError(err.message || 'Failed to cancel request');
    }
  };
  
  // Helper function to get color scheme for status badges
  const getStatusColorScheme = (status) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'denied':
        return 'red';
      case 'canceled':
        return 'gray';
      case 'expired':
        return 'purple';
      default:
        return 'gray';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Display loading state
  if (loading && requests.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
        <Text mt={4}>Loading request history...</Text>
      </Box>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }
  
  // Display empty state
  if (requests.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        You haven't made any permission requests yet.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Requested</Th>
            <Th>Permission / Bundle</Th>
            <Th>Status</Th>
            <Th>Requested On</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {requests.map((request) => (
            <Tr key={request._id}>
              <Td>
                {request.permission && (
                  <Text fontFamily="mono" fontSize="sm">
                    {request.permission}
                  </Text>
                )}
                {request.bundleId && (
                  <Text>
                    {request.bundle?.name || 'Permission Bundle'}
                  </Text>
                )}
              </Td>
              <Td>
                {request.resourceId ? (
                  <Tooltip label={`Resource: ${request.resourceType} ${request.resourceId}`}>
                    <Badge colorScheme="purple">Resource-specific</Badge>
                  </Tooltip>
                ) : (
                  <Badge colorScheme="blue">Global</Badge>
                )}
              </Td>
              <Td>
                <Badge colorScheme={getStatusColorScheme(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </Td>
              <Td>
                <Tooltip label={formatDate(request.createdAt)}>
                  <Text fontSize="sm" display="flex" alignItems="center">
                    <TimeIcon mr={1} />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </Text>
                </Tooltip>
              </Td>
              <Td>
                <Stack direction="row" spacing={2}>
                  <Button 
                    size="xs" 
                    colorScheme="blue"
                    variant="outline"
                    leftIcon={<InfoIcon />}
                    onClick={() => viewRequestDetails(request)}
                  >
                    Details
                  </Button>
                  {request.status === 'pending' && (
                    <Button 
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => cancelRequest(request._id)}
                    >
                      Cancel
                    </Button>
                  )}
                </Stack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <Stack direction="row" justifyContent="center" mt={4} spacing={2}>
          <Button 
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            isDisabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          <Text alignSelf="center">
            Page {pagination.currentPage} of {pagination.totalPages}
          </Text>
          <Button 
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            isDisabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </Stack>
      )}
      
      {/* Request details modal */}
      {selectedRequest && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Permission Request Details
              <Badge ml={2} colorScheme={getStatusColorScheme(selectedRequest.status)}>
                {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
              </Badge>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={3}>
                <Box>
                  <Text fontWeight="bold">Requested:</Text>
                  {selectedRequest.permission && (
                    <Text fontFamily="mono">{selectedRequest.permission}</Text>
                  )}
                  {selectedRequest.bundleId && (
                    <Text>Bundle: {selectedRequest.bundle?.name || 'Permission Bundle'}</Text>
                  )}
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Justification:</Text>
                  <Text>{selectedRequest.justification}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Duration:</Text>
                  <Text>
                    {selectedRequest.requestedDuration === 'temporary' 
                      ? `Temporary (until ${formatDate(selectedRequest.requestedExpiration)})` 
                      : 'Permanent'}
                  </Text>
                </Box>
                
                {selectedRequest.resourceId && (
                  <Box>
                    <Text fontWeight="bold">Resource:</Text>
                    <Text>
                      {selectedRequest.resourceType} (ID: {selectedRequest.resourceId})
                    </Text>
                  </Box>
                )}
                
                <Box>
                  <Text fontWeight="bold">Request Timeline:</Text>
                  <Text fontSize="sm">Submitted: {formatDate(selectedRequest.createdAt)}</Text>
                  
                  {selectedRequest.reviewedBy && (
                    <Text fontSize="sm">
                      Reviewed: {formatDate(selectedRequest.updatedAt)}
                    </Text>
                  )}
                </Box>
                
                {selectedRequest.reviewNotes && (
                  <Box>
                    <Text fontWeight="bold">Admin Notes:</Text>
                    <Alert status={selectedRequest.status === 'approved' ? 'success' : 'info'} size="sm">
                      <AlertIcon />
                      {selectedRequest.reviewNotes}
                    </Alert>
                  </Box>
                )}
                
                {selectedRequest.statusHistory && selectedRequest.statusHistory.length > 0 && (
                  <Box>
                    <Text fontWeight="bold">Status History:</Text>
                    {selectedRequest.statusHistory.map((history, index) => (
                      <Text key={index} fontSize="sm">
                        {formatDate(history.changedAt)}: Changed to <Badge>{history.status}</Badge>
                        {history.notes ? ` - "${history.notes}"` : ''}
                      </Text>
                    ))}
                  </Box>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}

export default PermissionRequestHistory;