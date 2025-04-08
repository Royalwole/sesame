import React from "react";
import { FiAlertCircle } from "react-icons/fi";

// This component displays a formatted error message
export default function ErrorAlert({ message, details }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <FiAlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
          {details && details.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
              {details.map((detail, index) => (
                <li key={index}>
                  {detail.field}: {detail.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
