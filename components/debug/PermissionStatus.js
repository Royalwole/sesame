import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * A component that displays the current permission status of the user
 * Helps debug authorization issues and redirect loops
 */
export default function PermissionStatus({ showDetails = false }) {
  const auth = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);

  // Check permissions on mount
  useEffect(() => {
    if (!auth.isLoading && auth.user) {
      setStatusChecked(true);
    }
  }, [auth.isLoading, auth.user]);

  if (auth.isLoading || !statusChecked) {
    return null;
  }

  // Only show details if specifically requested or user has expanded
  const shouldShowDetails = showDetails || expanded;

  const isApproved = auth?.user?.publicMetadata?.approved === true;
  const userRole = auth?.user?.publicMetadata?.role || 'user';

  const hasAgentAccess = userRole === 'agent' && isApproved;
  const hasAdminAccess = (userRole === 'admin' || userRole === 'super_admin') && isApproved;

  return (
    <div className={`mb-4 p-3 rounded border ${hasAgentAccess ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">
            Permission Status: {hasAgentAccess ? 
              <span className="text-green-700">✓ Agent Access Granted</span> : 
              <span className="text-yellow-700">❌ Agent Access Restricted</span>}
          </p>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {expanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {shouldShowDetails && (
        <div className="mt-2 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <div className="text-gray-600">Role:</div>
            <div className={userRole === 'agent' ? 'text-green-700 font-medium' : 'text-yellow-700'}>
              {userRole}
            </div>
            
            <div className="text-gray-600">Approved Status:</div>
            <div className={isApproved ? 'text-green-700 font-medium' : 'text-yellow-700'}>
              {isApproved ? 'Yes' : 'No'}
            </div>
            
            <div className="text-gray-600">Agent Access:</div>
            <div className={hasAgentAccess ? 'text-green-700 font-medium' : 'text-yellow-700'}>
              {hasAgentAccess ? 'Granted' : 'Denied'}
            </div>
            
            <div className="text-gray-600">Admin Access:</div>
            <div className={hasAdminAccess ? 'text-green-700 font-medium' : 'text-yellow-700'}>
              {hasAdminAccess ? 'Granted' : 'Denied'}
            </div>
          </div>
          
          {!hasAgentAccess && (
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <p className="font-medium text-yellow-800">Why access is restricted:</p>
              <ul className="list-disc ml-5 text-yellow-800">
                {userRole !== 'agent' && (
                  <li>Your role is set to "{userRole}" instead of "agent"</li>
                )}
                {!isApproved && (
                  <li>Your account is not marked as approved</li>
                )}
              </ul>
            </div>
          )}
          
          <div className="mt-3">
            <a 
              href="/fix-dashboard"
              className="inline-block px-3 py-1 bg-blue-600 text-white rounded text-xs"
            >
              Fix My Permissions
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
