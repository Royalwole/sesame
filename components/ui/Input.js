import React, { forwardRef } from "react";

/**
 * Input component that supports multiple types and variants
 */
const Input = forwardRef(
  (
    {
      label,
      name,
      id,
      type = "text",
      required = false,
      placeholder,
      value,
      onChange,
      onBlur,
      error,
      helperText,
      disabled = false,
      readOnly = false,
      className = "",
      as = "input",
      rows = 3,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    const inputClasses = `
    w-full px-3 py-2 border rounded-md 
    ${
      error
        ? "border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:ring-wine"
    }
    focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent
    ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
    ${readOnly ? "bg-gray-50" : ""}
    ${className}
  `;

    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1 font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {as === "textarea" ? (
          <textarea
            ref={ref}
            id={inputId}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            readOnly={readOnly}
            className={inputClasses}
            rows={rows}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            readOnly={readOnly}
            className={inputClasses}
            {...props}
          />
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

// Add display name for React DevTools
Input.displayName = "Input";

// Export as both named and default export for flexibility
export { Input };
export default Input;
