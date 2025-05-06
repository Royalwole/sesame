import { useState, useCallback } from "react";
import { useListings } from "../../contexts/ListingsContext";
import { FiUpload, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import Head from "next/head";

export default function ImageTest() {
  const [files, setFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const { uploadImages, deleteImage } = useListings();

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select files first");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadImages(files, "test");
      setUploadedImages((prev) => [...prev, ...result]);
      setFiles([]);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (image) => {
    try {
      await deleteImage(image.path);
      setUploadedImages((prev) =>
        prev.filter((img) => img.path !== image.path)
      );
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Image Functionality Test</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Image Functionality Test</h1>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Test</h2>

        <div className="space-y-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-wine/10 file:text-wine
              hover:file:bg-wine/20"
          />

          {files.length > 0 && (
            <div className="text-sm text-gray-600">
              Selected {files.length} file(s)
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className={`flex items-center justify-center px-4 py-2 rounded-lg 
              ${
                isUploading || files.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-wine text-white hover:bg-wine/90"
              }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Uploading...
              </>
            ) : (
              <>
                <FiUpload className="mr-2" />
                Upload Images
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
          <div className="flex">
            <FiX className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Uploaded Images</h2>

        {uploadedImages.length === 0 ? (
          <p className="text-gray-500">No images uploaded yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(image)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <p className="truncate">{image.originalName || "Image"}</p>
                  <p>{Math.round(image.size / 1024)} KB</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
