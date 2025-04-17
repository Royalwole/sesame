import { useState } from "react";
import { FiUpload, FiCheck, FiAlertCircle } from "react-icons/fi";

export default function BlobUploadTest({ onUploadComplete, folder = "test" }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload/blob", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadResult(result);

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <h3 className="text-lg font-medium mb-4">Upload File Test</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select a file
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {file && (
        <div className="text-sm text-gray-500 mb-4">
          Selected: {file.name} ({Math.round(file.size / 1024)} KB)
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`flex items-center justify-center px-4 py-2 rounded-md w-full ${
          !file || uploading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {uploading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Uploading...
          </>
        ) : (
          <>
            <FiUpload className="mr-2" />
            Upload to Vercel Blob
          </>
        )}
      </button>

      {uploadResult && (
        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
          <div className="flex items-start">
            <FiCheck className="text-green-500 mt-1 mr-2" />
            <div>
              <p className="font-medium text-green-800">Upload Successful!</p>
              <p className="text-sm text-green-600 mt-1">
                File URL:{" "}
                <a
                  href={uploadResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {uploadResult.url}
                </a>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Path: {uploadResult.pathname}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 mt-1 mr-2" />
            <div>
              <p className="font-medium text-red-800">Upload Failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
