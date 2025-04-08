import React, { memo } from "react";
import { FiAlertCircle } from "react-icons/fi";

const FormField = memo(function FormField({
  label,
  name,
  children,
  required = false,
  error = null,
  helpText = null,
  className = "",
  tooltip = null,
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="flex items-center text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}

          {tooltip && (
            <div className="ml-2 relative group">
              <span className="cursor-help text-gray-400 hover:text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {tooltip}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            </div>
          )}
        </label>
      )}

      <div className={`${error ? "relative" : ""}`}>
        {children}

        {helpText && !error && (
          <p className="mt-1 text-xs text-gray-500">{helpText}</p>
        )}

        {error && (
          <div className="mt-1 text-sm text-red-600 flex items-center">
            <FiAlertCircle className="mr-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default FormField;
