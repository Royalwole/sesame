import { memo } from "react";

export const LuxuryInput = memo(
  ({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    required,
    type = "text",
    icon,
    className = "",
  }) => {
    return (
      <div className={className}>
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-wine">*</span>}
        </label>
        <div className="mt-1 relative">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            id={name}
            type={type}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-4 ${
              icon ? "pl-10" : ""
            } py-3 bg-white border-b-2 rounded-lg shadow-sm outline-none transition-all duration-300 ${
              error
                ? "border-red-500 bg-red-50"
                : "border-gray-200 hover:border-gray-400 focus:border-wine focus:shadow-md"
            }`}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

export const LuxuryTextarea = memo(
  ({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    required,
    rows = 4,
    className = "",
  }) => {
    return (
      <div className={className}>
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-wine">*</span>}
        </label>
        <div className="mt-1">
          <textarea
            id={name}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className={`w-full px-4 py-3 bg-white border-b-2 rounded-lg shadow-sm outline-none transition-all duration-300 resize-none ${
              error
                ? "border-red-500 bg-red-50"
                : "border-gray-200 hover:border-gray-400 focus:border-wine focus:shadow-md"
            }`}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

export const LuxurySelect = memo(
  ({
    label,
    name,
    value,
    onChange,
    options = [],
    error,
    required,
    className = "",
  }) => {
    return (
      <div className={`relative ${className}`}>
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-wine">*</span>}
        </label>
        <div className="mt-1 relative">
          <select
            id={name}
            name={name}
            value={value || ""}
            onChange={onChange}
            className={`w-full appearance-none px-4 py-3 bg-white border-b-2 rounded-lg shadow-sm outline-none transition-all duration-300 ${
              error
                ? "border-red-500 bg-red-50"
                : "border-gray-200 hover:border-gray-400 focus:border-wine focus:shadow-md"
            }`}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
