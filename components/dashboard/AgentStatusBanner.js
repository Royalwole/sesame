import React from "react";
import { FiInfo } from "react-icons/fi";
import useIsomorphicLayoutEffect from "../../lib/useIsomorphicLayoutEffect";

export default function AgentStatusBanner() {
  // Use our custom hook instead of useLayoutEffect directly
  useIsomorphicLayoutEffect(() => {
    // Any layout effect code goes here...
  }, []);

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <FiInfo className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            Your agent account is pending approval. Some features may be limited
            until an administrator approves your account.
          </p>
        </div>
      </div>
    </div>
  );
}
