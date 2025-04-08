import React from "react";

/**
 * Button component with various styling options
 */
export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  isLoading = false,
  onClick,
  className = "",
  ...props
}) {
  // Base classes
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors";

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
    xl: "px-6 py-3 text-lg",
  };

  // Variant classes
  const variantClasses = {
    primary:
      "bg-wine text-white hover:bg-wine/90 focus:ring focus:ring-wine/50 border border-transparent",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring focus:ring-gray-200/50 border border-transparent",
    outline: "bg-transparent text-wine hover:bg-wine/5 border border-wine/80",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring focus:ring-red-600/50 border border-transparent",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring focus:ring-green-600/50 border border-transparent",
  };

  // Width classes
  const widthClasses = fullWidth ? "w-full" : "";

  // Disabled classes
  const disabledClasses =
    disabled || isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer";

  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size] || sizeClasses.md}
    ${variantClasses[variant] || variantClasses.primary}
    ${widthClasses}
    ${disabledClasses}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}
