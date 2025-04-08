import { useState } from "react";
import Head from "next/head";

export default function BlobTest() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [configStatus, setConfigStatus] = useState(null);

  // Check configuration on load
  useState(() => {
    async function checkConfig() {
      try {
        const response = await fetch("/api/debug/test-blob");
        const data = await response.json();
        setConfigStatus(data);
      } catch (err) {
        setConfigStatus({ error: err.message });
      }
    }

    checkConfig();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("testImage", file);

      const response = await fetch("/api/debug/test-blob", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Upload failed");
      }

      setResult(data);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Vercel Blob Test</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Vercel Blob Upload Test</h1>

      <div className="mb-8 p-4 bg-gray-50 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Configuration Status:</h2>
        {configStatus ? (
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
            {JSON.stringify(configStatus, null, 2)}
          </pre>
        ) : (
          <p>Checking configuration...</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select an image to test upload:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-wine file:text-white
                      hover:file:bg-wine-dark"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-500">
              Selected: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="bg-wine text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Test Upload"}
        </button>
      </form>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error:</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Upload Result:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>

          {result.url && (
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Image Preview:</h3>
              <div className="border border-gray-200 rounded-md p-2 inline-block">
                <img
                  src={result.url}
                  alt="Uploaded"
                  className="max-h-64 max-w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-500">
        <p>This page is for testing Vercel Blob storage integration.</p>
        <p>
          Make sure your <code>BLOB_READ_WRITE_TOKEN</code> is properly set in
          your environment variables.
        </p>
      </div>
    </div>
  );
}
