import React from "react";
import { FiAlertCircle } from "react-icons/fi";

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <div className="flex items-center text-red-500 mb-4">
          <FiAlertCircle size={24} className="mr-2" />
          <h2 className="text-lg font-medium">Error</h2>
        </div>
        <p className="text-gray-600 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
