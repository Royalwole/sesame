import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button,
  FormControl, 
  FormLabel, 
  FormHelperText,
  Input,
  Select,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Permission Request Form
 * 
 * Component that allows users to request new permissions
 * through the self-service portal
 * 
 * @param {Array} allPermissions - All available permissions
 * @param {Array} userPermissions - Permissions the user already has
 */
function PermissionRequestForm({ allPermissions = [], userPermissions = [] }) {
  const { user } = useAuth();
  const toast = useToast();
  
  // Get permissions that the user doesn't already have
  const availablePermissions = allPermissions.filter(
    p => !userPermissions.includes(p.id)
  );
  
  // Get permission bundles (will be fetched from API)
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formState, setFormState] = useState({
    requestType: 'permission', // 'permission' or 'bundle'
    permission: '',
    bundleId: '',
    resourceType: '',
    resourceId: '',
    justification: '',
    duration: 'permanent',
    expiration: '',
    agreeToTerms: false,
  });
  
  // Load bundles when component mounts
  useEffect(() => {
    const fetchBundles = async () => {
      try {
        const response = await fetch('/api/admin/permission-bundles');
        const data = await response.json();
        
        if (data.success && data.bundles) {
          setBundles(data.bundles);
        }
      } catch (err) {
        console.error('Error fetching permission bundles:', err);
      }
    };
    
    fetchBundles();
  }, []);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle radio changes
  const handleRadioChange = (name, value) => {
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    // Validate form
    if (!formState.agreeToTerms) {
      setError('You must agree to the terms before submitting.');
      setLoading(false);
      return;
    }
    
    if (formState.requestType === 'permission' && !formState.permission) {
      setError('Please select a permission to request.');
      setLoading(false);
      return;
    }
    
    if (formState.requestType === 'bundle' && !formState.bundleId) {
      setError('Please select a permission bundle to request.');
      setLoading(false);
      return;
    }
    
    if (!formState.justification || formState.justification.length < 10) {
      setError('Please provide a detailed justification (at least 10 characters).');
      setLoading(false);
      return;
    }
    
    if (formState.duration === 'temporary' && !formState.expiration) {
      setError('Please specify an expiration date for temporary permissions.');
      setLoading(false);
      return;
    }
    
    try {
      // Prepare request body based on request type
      const requestBody = {
        justification: formState.justification,
        requestedDuration: formState.duration,
        ...(formState.duration === 'temporary' && { requestedExpiration: formState.expiration }),
        ...(formState.resourceType && formState.resourceId && { 
          resourceType: formState.resourceType,
          resourceId: formState.resourceId
        })
      };
      
      // Add either permission or bundle ID based on request type
      if (formState.requestType === 'permission') {
        requestBody.permission = formState.permission;
      } else {
        requestBody.bundleId = formState.bundleId;
      }
      
      // Submit the request
      const response = await fetch('/api/users/permissions/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        toast({
          title: 'Request submitted',
          description: 'Your permission request has been submitted successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reset form
        setFormState({
          requestType: 'permission',
          permission: '',
          bundleId: '',
          resourceType: '',
          resourceId: '',
          justification: '',
          duration: 'permanent',
          expiration: '',
          agreeToTerms: false,
        });
      } else {
        throw new Error(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting your request');
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit permission request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Get the selected permission object
  const selectedPermission = allPermissions.find(p => p.id === formState.permission);
  const selectedBundle = bundles.find(b => b._id === formState.bundleId);
  
  // Get tomorrow's date in YYYY-MM-DD format for min expiration date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minExpirationDate = tomorrow.toISOString().split('T')[0];
  
  return (
    <Box bg="white" p={4} borderRadius="md" shadow="sm">
      {success && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          Your permission request has been submitted successfully. An administrator will review your request.
        </Alert>
      )}
      
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          {/* Request Type */}
          <FormControl isRequired>
            <FormLabel>Request Type</FormLabel>
            <RadioGroup 
              value={formState.requestType} 
              onChange={(value) => handleRadioChange('requestType', value)}
            >
              <Stack direction="row">
                <Radio value="permission">Single Permission</Radio>
                <Radio value="bundle">Permission Bundle</Radio>
              </Stack>
            </RadioGroup>
            <FormHelperText>
              Choose whether to request a single permission or a bundle of related permissions
            </FormHelperText>
          </FormControl>
          
          {/* Permission Selection */}
          {formState.requestType === 'permission' && (
            <FormControl isRequired>
              <FormLabel>Permission</FormLabel>
              <Select
                name="permission"
                value={formState.permission}
                onChange={handleChange}
                placeholder="Select a permission to request"
              >
                {availablePermissions.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permission.name} ({permission.id})
                  </option>
                ))}
              </Select>
              <FormHelperText>
                Select the permission you need access to
              </FormHelperText>
            </FormControl>
          )}
          
          {/* Bundle Selection */}
          {formState.requestType === 'bundle' && (
            <FormControl isRequired>
              <FormLabel>Permission Bundle</FormLabel>
              <Select
                name="bundleId"
                value={formState.bundleId}
                onChange={handleChange}
                placeholder="Select a permission bundle to request"
              >
                {bundles.map((bundle) => (
                  <option key={bundle._id} value={bundle._id}>
                    {bundle.name}
                  </option>
                ))}
              </Select>
              <FormHelperText>
                Select a bundle of related permissions
              </FormHelperText>
            </FormControl>
          )}
          
          {/* Show selected permission/bundle details */}
          {selectedPermission && (
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontWeight="bold">{selectedPermission.name}</Text>
              <Text fontSize="sm">{selectedPermission.description}</Text>
              {selectedPermission.warning && (
                <Text color="orange.500" fontSize="sm" mt={1}>
                  Note: {selectedPermission.warning}
                </Text>
              )}
            </Box>
          )}
          
          {selectedBundle && (
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontWeight="bold">{selectedBundle.name}</Text>
              <Text fontSize="sm">{selectedBundle.description}</Text>
              <Text fontSize="sm" mt={1}>
                Contains {selectedBundle.permissions?.length || 0} permissions
              </Text>
            </Box>
          )}
          
          {/* Resource Type (optional) */}
          <FormControl>
            <FormLabel>Resource Type (Optional)</FormLabel>
            <Select
              name="resourceType"
              value={formState.resourceType}
              onChange={handleChange}
              placeholder="Select a resource type (if applicable)"
            >
              <option value="listing">Listing</option>
              <option value="user">User</option>
              <option value="inspection">Inspection</option>
              <option value="report">Report</option>
            </Select>
            <FormHelperText>
              If this permission applies to a specific resource, select its type
            </FormHelperText>
          </FormControl>
          
          {/* Resource ID (optional) */}
          {formState.resourceType && (
            <FormControl>
              <FormLabel>Resource ID (Optional)</FormLabel>
              <Input
                name="resourceId"
                value={formState.resourceId}
                onChange={handleChange}
                placeholder="Enter the resource ID"
              />
              <FormHelperText>
                Enter the ID of the specific {formState.resourceType} this permission applies to
              </FormHelperText>
            </FormControl>
          )}
          
          {/* Duration */}
          <FormControl isRequired>
            <FormLabel>Duration</FormLabel>
            <RadioGroup 
              value={formState.duration} 
              onChange={(value) => handleRadioChange('duration', value)}
            >
              <Stack direction="row">
                <Radio value="permanent">Permanent</Radio>
                <Radio value="temporary">Temporary</Radio>
              </Stack>
            </RadioGroup>
            <FormHelperText>
              Choose whether you need this permission permanently or temporarily
            </FormHelperText>
          </FormControl>
          
          {/* Expiration Date (for temporary permissions) */}
          {formState.duration === 'temporary' && (
            <FormControl isRequired>
              <FormLabel>Expiration Date</FormLabel>
              <Input
                name="expiration"
                type="date"
                value={formState.expiration}
                onChange={handleChange}
                min={minExpirationDate}
              />
              <FormHelperText>
                When should this permission expire?
              </FormHelperText>
            </FormControl>
          )}
          
          {/* Justification */}
          <FormControl isRequired>
            <FormLabel>Justification</FormLabel>
            <Textarea
              name="justification"
              value={formState.justification}
              onChange={handleChange}
              placeholder="Explain why you need this permission and how it will help you perform your role..."
              rows={5}
            />
            <FormHelperText>
              Provide a clear explanation of why you need this permission. This helps administrators evaluate your request.
            </FormHelperText>
          </FormControl>
          
          {/* Terms Agreement */}
          <FormControl isRequired>
            <Checkbox 
              name="agreeToTerms"
              isChecked={formState.agreeToTerms}
              onChange={handleChange}
            >
              I understand that permission requests are reviewed by administrators and may be approved or denied based on company policies.
            </Checkbox>
          </FormControl>
          
          {/* Submit Button */}
          <Button 
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            isDisabled={!formState.agreeToTerms}
            mt={4}
          >
            Submit Request
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default PermissionRequestForm;