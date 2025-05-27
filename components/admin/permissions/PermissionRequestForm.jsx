import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
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
    justification: '',
    duration: 'permanent',
    emergencyAccess: false,
    businessImpact: '',
    temporaryDays: 30
  });

  // Fetch permission bundles
  useEffect(() => {
    fetchPermissionBundles();
  }, []);

  const fetchPermissionBundles = async () => {
    try {
      const response = await fetch('/api/admin/permissions/bundles');
      if (response.ok) {
        const data = await response.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    }
  };

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess(false);
  };

  // Validate form before submission
  const validateForm = () => {
    if (formState.requestType === 'permission' && !formState.permission) {
      setError('Please select a permission to request');
      return false;
    }
    
    if (formState.requestType === 'bundle' && !formState.bundleId) {
      setError('Please select a permission bundle');
      return false;
    }
    
    if (!formState.justification.trim()) {
      setError('Please provide a business justification');
      return false;
    }
    
    if (formState.duration === 'temporary' && (!formState.temporaryDays || formState.temporaryDays < 1)) {
      setError('Please specify a valid duration for temporary access');
      return false;
    }
    
    if (formState.emergencyAccess && !formState.businessImpact.trim()) {
      setError('Emergency access requires business impact description');
      return false;
    }
    
    return true;
  };

  // Submit permission request
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/permissions/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          requestType: formState.requestType,
          permission: formState.requestType === 'permission' ? formState.permission : null,
          bundleId: formState.requestType === 'bundle' ? formState.bundleId : null,
          justification: formState.justification,
          duration: formState.duration,
          temporaryDays: formState.duration === 'temporary' ? formState.temporaryDays : null,
          emergencyAccess: formState.emergencyAccess,
          businessImpact: formState.businessImpact || null,
          requestedAt: new Date().toISOString()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccess(true);
      toast.success('Permission request submitted successfully');
      
      // Reset form
      setFormState({
        requestType: 'permission',
        permission: '',
        bundleId: '',
        justification: '',
        duration: 'permanent',
        emergencyAccess: false,
        businessImpact: '',
        temporaryDays: 30
      });
      
    } catch (error) {
      setError(error.message);
      toast.error('Failed to submit permission request');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormState({
      requestType: 'permission',
      permission: '',
      bundleId: '',
      justification: '',
      duration: 'permanent',
      emergencyAccess: false,
      businessImpact: '',
      temporaryDays: 30
    });
    setError('');
    setSuccess(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">Request New Permissions</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Your permission request has been submitted and is pending review.
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Request Type</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="requestType"
                value="permission"
                checked={formState.requestType === 'permission'}
                onChange={(e) => handleChange('requestType', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Individual Permission</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="requestType"
                value="bundle"
                checked={formState.requestType === 'bundle'}
                onChange={(e) => handleChange('requestType', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Permission Bundle</span>
            </label>
          </div>
        </div>

        {/* Permission Selection */}
        {formState.requestType === 'permission' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Permission</label>
            <select
              value={formState.permission}
              onChange={(e) => handleChange('permission', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a permission...</option>
              {availablePermissions.map(permission => (
                <option key={permission.id} value={permission.id}>
                  {permission.name} - {permission.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the specific permission you need access to
            </p>
          </div>
        )}

        {/* Bundle Selection */}
        {formState.requestType === 'bundle' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Permission Bundle</label>
            <select
              value={formState.bundleId}
              onChange={(e) => handleChange('bundleId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a bundle...</option>
              {bundles.map(bundle => (
                <option key={bundle.id} value={bundle.id}>
                  {bundle.name} - {bundle.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Permission bundles include multiple related permissions for specific roles
            </p>
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Access Duration</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="duration"
                value="permanent"
                checked={formState.duration === 'permanent'}
                onChange={(e) => handleChange('duration', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Permanent</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="duration"
                value="temporary"
                checked={formState.duration === 'temporary'}
                onChange={(e) => handleChange('duration', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Temporary</span>
            </label>
          </div>
          
          {formState.duration === 'temporary' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={formState.temporaryDays}
                onChange={(e) => handleChange('temporaryDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many days do you need this access?
              </p>
            </div>
          )}
        </div>

        {/* Emergency Access */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formState.emergencyAccess}
              onChange={(e) => handleChange('emergencyAccess', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Emergency Access Required</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Check this if you need immediate access due to an urgent business need
          </p>
        </div>

        {/* Business Justification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formState.justification}
            onChange={(e) => handleChange('justification', e.target.value)}
            rows="4"
            placeholder="Please explain why you need this permission and how it relates to your job responsibilities..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a clear business justification for why you need this access
          </p>
        </div>

        {/* Business Impact (for emergency requests) */}
        {formState.emergencyAccess && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Impact <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formState.businessImpact}
              onChange={(e) => handleChange('businessImpact', e.target.value)}
              rows="3"
              placeholder="Describe the business impact if this access is not granted immediately..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Required for emergency access requests
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PermissionRequestForm;