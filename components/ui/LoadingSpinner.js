import React from "react";

/**
 * Loading spinner component with size variants
 */
export default function LoadingSpinner({ size = "medium", className = "" }) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${spinnerSize} rounded-full border-2 border-t-wine border-r-wine border-b-transparent border-l-transparent animate-spin`}
      ></div>
    </div>
  );
}
