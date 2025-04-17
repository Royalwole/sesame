import React from "react";

export default function Loader({ 
  size = "medium", 
  message = "Loading...",
  fullScreen = false 
}) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-2",
    large: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
  };

  const spinnerClass = `${sizeClasses[size] || sizeClasses.medium} 
    animate-spin rounded-full border-t-transparent border-blue-600`;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className={spinnerClass}></div>
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className={spinnerClass}></div>
      {message && <p className="mt-2 text-gray-600 text-sm">{message}</p>}
    </div>
  );
}
