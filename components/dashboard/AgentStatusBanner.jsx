import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function AgentStatusBanner() {
  const { dbUser } = useAuth();
  
  // Check if user has agent role and approval status
  const isAgent = dbUser?.role === 'agent' || dbUser?.role === 'agent_pending';
  const isPending = dbUser?.role === 'agent_pending';
  const isApproved = dbUser?.role === 'agent' && dbUser?.agentDetails?.approved;
  const isRejected = dbUser?.role === 'agent' && dbUser?.agentDetails?.approved === false;
  
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
  
  // Default case - should not reach here but just in case
  return null;
}
