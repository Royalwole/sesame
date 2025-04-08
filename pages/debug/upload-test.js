import { useState, useRef } from "react";
import Head from "next/head";
import { FiUpload, FiCheck, FiX, FiClock } from "react-icons/fi";

export default function UploadTest() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/debug/test-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || response.statusText);
      }

      const data = await response.json();

      setTestResults({
        ...data,
        clientTime: Date.now() - startTime,
      });
    } catch (err) {
      console.error("Test failed:", err);
      setError(err.message || "Upload test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Upload Test - Troubleshooting</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Upload Test Tool</h1>
        <p className="mb-6 text-gray-600">
          This tool helps diagnose issues with file uploads. Select an image
          file to test upload speed and reliability.
        </p>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center w-full hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <FiClock className="animate-spin mr-2" /> Testing Upload...
                </span>
              ) : (
                <span className="flex items-center">
                  <FiUpload className="mr-2" /> Select Image to Test
                </span>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiX className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {testResults && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <FiCheck className="text-green-500 mr-2" /> Test Results
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Client Time
                  </p>
                  <p className="font-mono">{testResults.clientTime}ms</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Server Processing Time
                  </p>
                  <p className="font-mono">{testResults.duration}ms</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium mb-2">Upload Details:</h4>
                {testResults.uploadResults.map((result, i) => (
                  <div key={i} className="bg-white p-4 rounded border mb-2">
                    <p>
                      <span className="font-medium">File:</span>{" "}
                      {result.originalName}
                    </p>
                    <p>
                      <span className="font-medium">Size:</span>{" "}
                      {Math.round(result.size / 1024)} KB
                    </p>
                    <p>
                      <span className="font-medium">Upload Time:</span>{" "}
                      {result.uploadTime}ms
                    </p>
                    <div className="mt-2">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Uploaded Image →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-gray-500">
                <p>
                  Speed Analysis:{" "}
                  {testResults.clientTime < 3000
                    ? "Fast"
                    : testResults.clientTime < 7000
                    ? "Average"
                    : "Slow"}{" "}
                  connection detected.
                </p>
                <p className="mt-1">
                  {testResults.clientTime > 8000
                    ? "You may experience timeouts with large image uploads. Try using smaller or fewer images."
                    : "Your connection should be suitable for normal image uploads."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
