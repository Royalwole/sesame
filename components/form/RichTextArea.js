import React, { useState } from "react";

export default function RichTextArea({
  id,
  name,
  value,
  onChange,
  required = false,
  rows = 5,
  placeholder = "",
  maxLength = 10000,
  onKeyDown,
}) {
  const [charCount, setCharCount] = useState(value ? value.length : 0);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    onChange(e);
  };

  // Handle key events to prevent accidental form submission
  const handleKeyDown = (e) => {
    // Do not prevent the default Enter behavior since this is a textarea and Enter should create new lines
    // Only pass along any custom key down handler if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-wine focus:border-wine"
        placeholder={placeholder}
      />
      {maxLength > 0 && (
        <div
          className={`text-xs mt-1 text-right ${
            charCount > maxLength * 0.9 ? "text-red-500" : "text-gray-500"
          }`}
        >
          {charCount}/{maxLength} characters
        </div>
      )}
    </div>
  );
}
