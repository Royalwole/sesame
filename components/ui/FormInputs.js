import React, { memo, forwardRef } from "react";

export const TextInput = memo(
  forwardRef(function TextInput(
    {
      id,
      name,
      value = "",
      onChange,
      placeholder = "",
      className = "",
      hasError = false,
      ...rest
    },
    ref
  ) {
    // Ensure onChange is triggered properly to avoid input lag
    const handleChange = (e) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        id={id || name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full p-3 border ${
          hasError ? "border-red-500" : "border-gray-300"
        } rounded-lg focus:ring-2 focus:ring-wine focus:border-transparent outline-none transition-all ${className}`}
        {...rest}
      />
    );
  })
);

export const TextArea = memo(
  forwardRef(function TextArea(
    {
      id,
      name,
      value = "",
      onChange,
      rows = 4,
      placeholder = "",
      className = "",
      hasError = false,
      ...rest
    },
    ref
  ) {
    // Ensure onChange is triggered properly to avoid input lag
    const handleChange = (e) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <textarea
        ref={ref}
        id={id || name}
        name={name}
        value={value}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full p-3 border ${
          hasError ? "border-red-500" : "border-gray-300"
        } rounded-lg focus:ring-2 focus:ring-wine focus:border-transparent outline-none transition-all ${className}`}
        {...rest}
      />
    );
  })
);

export const NumberInput = memo(
  forwardRef(function NumberInput(
    {
      id,
      name,
      value = "",
      onChange,
      min,
      max,
      step,
      placeholder = "",
      className = "",
      hasError = false,
      ...rest
    },
    ref
  ) {
    return (
      <input
        ref={ref}
        type="number"
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={`w-full p-3 border ${
          hasError ? "border-red-500" : "border-gray-300"
        } rounded-lg focus:ring-2 focus:ring-wine focus:border-transparent outline-none transition-all ${className}`}
        {...rest}
      />
    );
  })
);

export const SelectInput = memo(
  forwardRef(function SelectInput(
    {
      id,
      name,
      value,
      onChange,
      options = [],
      placeholder = "Select an option",
      className = "",
      hasError = false,
      ...rest
    },
    ref
  ) {
    return (
      <select
        ref={ref}
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-3 border ${
          hasError ? "border-red-500" : "border-gray-300"
        } rounded-lg focus:ring-2 focus:ring-wine focus:border-transparent outline-none transition-all ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  })
);
