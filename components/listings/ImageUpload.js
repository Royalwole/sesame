import { useState, useCallback, useEffect, useRef } from "react";
import { FiUploadCloud, FiX, FiImage, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { processImageBatch } from "../../lib/image-utils"; // Fixed import

export default function ImageUpload({
  initialImages = [],
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
  className = "",
}) {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;

      // Clean up object URLs on unmount to prevent memory leaks
      images.forEach((img) => {
        if (img.preview && !img.isExisting) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);

  // Initialize component with existing images
  useEffect(() => {
    if (initialImages && initialImages.length > 0 && images.length === 0) {
      console.log(
        `[ImageUpload] Initializing with ${initialImages.length} existing images`
      );

      // Process initialImages to display format
      const formattedImages = initialImages.map((img) => ({
        id: img._id || `existing-${Math.random().toString(36).substr(2, 9)}`,
        url: img.url,
        preview: img.url,
        name: img.originalName || "Existing image",
        isExisting: true,
        size: img.size || 0,
      }));

      setImages(formattedImages);
    }
  }, [initialImages, images.length]);

  // Enhanced onChange notification with better error handling
  useEffect(() => {
    if (typeof onChange === "function") {
      try {
        // Extract files for new images
        const files = images
          .filter((img) => !img.isExisting)
          .map((img) => {
            // Make sure to return a valid File object
            if (img.file instanceof File) {
              return img.file;
            }

            // Try to create a File from a blob if available
            if (img.blob instanceof Blob) {
              return new File([img.blob], img.name || "image.jpg", {
                type: img.type || "image/jpeg",
                lastModified: img.lastModified || Date.now(),
              });
            }

            // Last resort - return the whole image object and let parent component handle it
            return img;
          });

        // Process existing images to ensure they have _id property
        const existingImages = images
          .filter((img) => img.isExisting)
          .map((img) => {
            // Normalize the ID format to match what server expects
            const imageId = img._id || img.id;

            return {
              ...img,
              _id: imageId, // Ensure _id is set
              id: imageId, // Ensure id is also set for UI purposes
            };
          });

        // Create a structured object with all necessary data
        const imageData = {
          files,
          existingImages,
          allImages: images,
          count: images.length,
        };

        console.log(
          "[ImageUpload] Notifying parent component of image changes:",
          {
            files: files.length,
            existing: existingImages.length,
            total: images.length,
          }
        );

        onChange(imageData);
      } catch (error) {
        console.error("Error in ImageUpload onChange handler:", error);
      }
    }
  }, [images, onChange]);

  // Directly implement the compressImage function since it's referenced locally
  const compressImage = async (file, maxSizeMB = 2) => {
    // Skip compression for small files
    if (file.size <= maxSizeMB * 1024 * 1024) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculate dimensions to maintain aspect ratio
          if (width > height) {
            if (width > 1920) {
              height = Math.round(height * (1920 / width));
              width = 1920;
            }
          } else {
            if (height > 1080) {
              width = Math.round(width * (1080 / height));
              height = 1080;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Use lower quality for larger files
          const quality = file.size > 3 * 1024 * 1024 ? 0.6 : 0.8;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Simple fallback compression when the library fails
  const fallbackCompression = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Limit dimensions for large images
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Use lower quality for larger files
          const quality = file.size > 3 * 1024 * 1024 ? 0.6 : 0.8;

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
    // Reset input value so the same file can be selected again
    e.target.value = "";
  }, []);

  // Open file dialog when clicking on drop area
  const onButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Process selected files with compression
  const handleFiles = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;

      // Check if we would exceed max images
      const totalImagesAfterAdd = images.length + fileList.length;
      if (totalImagesAfterAdd > maxImages) {
        toast.error(
          `Maximum ${maxImages} images allowed. You can add ${
            maxImages - images.length
          } more.`
        );
        return;
      }

      setProcessing(true);

      try {
        // Process all files with our new batch compression
        const compressedFiles = await processImageBatch(fileList, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeMB: maxSizeMB,
        });

        const newImages = [];

        for (const file of compressedFiles) {
          // Create preview URL
          const previewUrl = URL.createObjectURL(file);

          newImages.push({
            id: `new-${Math.random().toString(36).substr(2, 9)}`,
            file, // The compressed file for upload
            preview: previewUrl,
            name: file.name,
            size: file.size,
            isExisting: false,
            type: file.type,
            lastModified: file.lastModified,
          });
        }

        if (newImages.length > 0) {
          setImages((prev) => [...prev, ...newImages]);
          toast.success(
            `Added ${newImages.length} image${newImages.length > 1 ? "s" : ""}`
          );
        }
      } catch (error) {
        console.error("Error processing images:", error);
        toast.error("Error processing images");
      } finally {
        if (isMounted.current) {
          setProcessing(false);
        }
      }
    },
    [images, maxImages, maxSizeMB]
  );

  // Remove an image
  const removeImage = useCallback((id) => {
    setImages((prev) => {
      const updatedImages = prev.filter((img) => img.id !== id);

      // If removing a new image with object URL, revoke it
      const removedImage = prev.find((img) => img.id === id);
      if (removedImage && !removedImage.isExisting && removedImage.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }

      return updatedImages;
    });

    toast.success("Image removed");
  }, []);

  return (
    <div className={`image-upload-container ${className}`}>
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={processing}
      />

      {/* Drag & drop area */}
      <div
        className={`
          upload-area relative border-2 border-dashed rounded-lg p-6 transition-all
          ${
            dragActive
              ? "border-wine bg-wine/5 shadow-md"
              : "border-gray-300 hover:border-gray-400"
          }
          ${images.length === 0 ? "min-h-[200px]" : "min-h-[120px]"}
        `}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <div className="flex flex-col items-center justify-center">
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-wine border-t-transparent mb-3"></div>
              <p className="text-gray-600 font-medium">Processing images...</p>
            </>
          ) : (
            <>
              <FiUploadCloud className="text-wine/80 h-10 w-10 mb-2" />
              <p className="text-gray-700 mb-1 font-medium">
                Drop images here or click to browse
              </p>
              <p className="text-sm text-gray-500 text-center max-w-md mx-auto">
                Upload up to {maxImages} images (JPG, PNG, GIF, WebP). Max{" "}
                {maxSizeMB}MB per image.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image counter and help text */}
      <div className="flex items-center justify-between text-sm mt-2 mb-4 px-1">
        <div
          className={`image-counter ${
            images.length >= maxImages ? "text-red-500" : "text-gray-500"
          }`}
        >
          {images.length} of {maxImages} images
        </div>
        <div className="help-text text-gray-400 text-xs">
          Click an image to remove it
        </div>
      </div>

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="image-preview-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="image-preview group relative rounded-lg overflow-hidden aspect-square bg-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => removeImage(image.id)}
            >
              {/* Image */}
              <img
                src={image.preview}
                alt={image.name}
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                  e.target.classList.add("p-8", "text-gray-400");
                }}
              />

              {/* Badge for existing vs new */}
              <div
                className={`status-badge absolute top-0 left-0 m-1 py-0.5 px-1 text-xs rounded ${
                  image.isExisting
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {image.isExisting ? "Existing" : "New"}
              </div>

              {/* File size */}
              <div className="size-indicator absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 px-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {image.name} ({Math.round(image.size / 1024)}KB)
              </div>

              {/* Remove button */}
              <div className="remove-button absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <FiX className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}

          {/* Add more images slot - only show if under max */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onButtonClick();
              }}
              className="add-more-button flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-square hover:border-wine hover:bg-wine/5 transition-all"
            >
              <FiImage className="h-6 w-6 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Add More</span>
            </button>
          )}
        </div>
      )}

      {/* Show tips when no images are selected */}
      {images.length === 0 && !processing && (
        <div className="mt-4 bg-blue-50 rounded-lg p-4 text-sm flex items-start">
          <FiAlertCircle className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-blue-800">
            <p className="font-medium mb-1">Tips for better images:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use well-lit, clear photos</li>
              <li>Include multiple angles of the property</li>
              <li>High-quality images attract more interest</li>
              <li>Landscape orientation works best for property photos</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
