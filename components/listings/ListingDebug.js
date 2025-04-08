import { useState } from "react";
import { FiInfo } from "react-icons/fi";

export default function ListingDebug({ formData, images }) {
  const [showDebug, setShowDebug] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mt-4 border border-blue-200 bg-blue-50 rounded-md p-4">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center text-blue-800 font-medium mb-2"
      >
        <FiInfo className="mr-2" /> {showDebug ? "Hide" : "Show"} Form Debug
        Data
      </button>

      {showDebug && (
        <div className="text-xs">
          <div className="mb-2">
            <h4 className="font-semibold">Form Data:</h4>
            <pre className="bg-white p-2 rounded max-h-60 overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold">Images:</h4>
            <p>Count: {images.length}</p>
            <ul className="ml-4 list-disc">
              {images.map((img, idx) => (
                <li key={idx}>
                  {img.name} ({(img.size / 1024).toFixed(1)}KB) - {img.type}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
