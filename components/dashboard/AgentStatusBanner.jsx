import React, { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiInfo } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import PermissionStatus from '../debug/PermissionStatus';

export default function AgentStatusBanner() {
  const auth = useAuth();
  const { dbUser, user } = auth;
  const [showPermissionInfo, setShowPermissionInfo] = useState(false);
  
  // Check if user has agent role and approval status
  const isAgent = dbUser?.role === 'agent' || dbUser?.role === 'agent_pending';
  const isPending = dbUser?.role === 'agent_pending';
  const isApproved = dbUser?.role === 'agent' && dbUser?.agentDetails?.approved;
  const isRejected = dbUser?.role === 'agent' && dbUser?.agentDetails?.approved === false;
  
  // Check for potential permission issues by comparing Clerk metadata with database values
  const hasPermissionIssue = user && (
    (user?.publicMetadata?.role !== dbUser?.role) || 
    (user?.publicMetadata?.approved !== (dbUser?.agentDetails?.approved === true))
  );
  
  // Check URL for indications that this page was loaded after fixing permissions
  const wasPreviouslyFixed = typeof window !== 'undefined' && (
    window.location.search.includes('fixed=true') ||
    window.location.search.includes('breakLoop=true')
  );
  
  // If not an agent, don't show the banner
  if (!isAgent) return null;
  
  if (isPending) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiClock className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Your agent account is <span className="font-medium">pending approval</span>. We'll review your information shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isRejected) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Your agent application was <span className="font-medium">not approved</span>. 
              Please contact support for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isApproved) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiCheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              Your agent account is <span className="font-medium">active</span>. You can create listings and manage your agent profile.
            </p>
          </div>
        </div>
      </div>
    );
  }
    // Default case - show permission status if there's a permission issue or this page was fixed
  if (hasPermissionIssue || wasPreviouslyFixed) {
    return (
      <>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-2">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiInfo className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3 flex justify-between w-full">
              <p className="text-sm text-blue-700">
                {wasPreviouslyFixed ? 
                  "Your permissions have been fixed. You should now have access to the agent dashboard." :
                  "There might be a mismatch between your account permissions and your database profile."}
              </p>
              <button 
                onClick={() => setShowPermissionInfo(!showPermissionInfo)}
                className="text-xs text-blue-800 underline"
              >
                {showPermissionInfo ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          </div>
        </div>
        
        {showPermissionInfo && (
          <PermissionStatus showDetails={true} />
        )}
      </>
    );
  }
  
  return null;
}
