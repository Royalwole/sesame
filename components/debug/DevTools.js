import React from "react";

/**
 * DevTools component for development debugging
 * This is client-side only to prevent hydration mismatches
 */
const DevTools = ({ pathname }) => {
  return (
    <div className="fixed bottom-0 right-0 bg-black text-white text-xs p-1 z-50">
      Path: {pathname}
    </div>
  );
};

export default DevTools;
