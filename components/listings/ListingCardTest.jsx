import React from 'react';
import { FiHome, FiBed, FiBath, FiSquare, FiMapPin, FiClock, FiAlertTriangle, FiImage } from "react-icons/fi";

// Simple test to verify all icons are properly importable
const IconTest = () => {
  return (
    <div className="p-4">
      <h2>Icon Test</h2>
      <div className="flex gap-2">
        <FiHome size={24} />
        <FiBed size={24} />
        <FiBath size={24} />
        <FiSquare size={24} />
        <FiMapPin size={24} />
        <FiClock size={24} />
        <FiAlertTriangle size={24} />
        <FiImage size={24} />
      </div>
    </div>
  );
};

export default IconTest;
