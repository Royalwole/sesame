import { useState, useEffect, useCallback } from "react";
import { FiHome, FiKey, FiClock, FiTag, FiDollarSign } from "react-icons/fi";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import { LuxuryInput, LuxuryTextarea } from "../ui/form-elements";

// Define refined property types without duplications
const PROPERTY_TYPES = [
  { value: "mansion", label: "Mansion", icon: <FiHome size={18} /> },
  { value: "apartment", label: "Apartment", icon: <FiHome size={18} /> },
  { value: "villa", label: "Villa", icon: <FiHome size={18} /> },
  { value: "penthouse", label: "Penthouse", icon: <FiHome size={18} /> },
  { value: "estate", label: "Estate", icon: <FiHome size={18} /> },
  { value: "commercial", label: "Commercial", icon: <FiHome size={18} /> },
  { value: "land", label: "Land", icon: <FiHome size={18} /> },
];

// Updated listing types as requested with professional icons
const LISTING_TYPES = [
  {
    value: "sale",
    label: "SALE",
    icon: <FiTag size={18} className="text-emerald-600" />,
  },
  {
    value: "rent",
    label: "RENT",
    icon: <FiKey size={18} className="text-blue-600" />,
  },
  {
    value: "lease",
    label: "LEASE",
    icon: <FiDollarSign size={18} className="text-amber-600" />,
  },
  {
    value: "shortlet",
    label: "SHORTLET",
    icon: <FiClock size={18} className="text-purple-600" />,
  },
];

export default function CreateListingForm({
  initialValues = null,

  isEditing = false,
  listingId = null,
  onSubmit,
  submitting: externalSubmitting, // Renamed to avoid name conflicts
  setSubmitting: externalSetSubmitting, // Added external setter as a prop
}) {
  // Initialize form data with default values
  const [formData, setFormData] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    price: initialValues?.price || "",
    bedrooms: initialValues?.bedrooms || "",
    bathrooms: initialValues?.bathrooms || "",
    propertyType: initialValues?.propertyType || "house",
    listingType: initialValues?.listingType || "sale",
    address: initialValues?.address || "",
    city: initialValues?.city || "",
    state: initialValues?.state || "",
    country: initialValues?.country || "Nigeria",
    features: initialValues?.features || [],
    status: initialValues?.status || "published",
  });

  // Properly initialize errors and touched states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [internalSubmitting, setInternalSubmitting] = useState(false); // Renamed for clarity
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [initialImagesLoaded, setInitialImagesLoaded] = useState(false);

  // Ensure imageData is always defined with safe defaults
  const [imageData, setImageData] = useState({
    files: [], // For new image files
    existingImages: initialValues?.images || [], // For existing images
    count: initialValues?.images?.length || 0,
  });

  // Use either external or internal submitting state
  const submitting =
    externalSubmitting !== undefined ? externalSubmitting : internalSubmitting;
  // Create a safe setter function that works with both external and internal state
  const setSubmittingState = useCallback(
    (value) => {
      if (externalSetSubmitting) {
        // If external setter is provided, use it
        externalSetSubmitting(value);
      } else {
        // Otherwise use internal state
        setInternalSubmitting(value);
      }
    },
    [externalSetSubmitting]
  );

  // Initialize images if we're editing a listing with existing images
  useEffect(() => {
    if (
      initialValues?.images &&
      initialValues.images.length > 0 &&
      !initialImagesLoaded
    ) {
      // Convert existing images to display format
      setImages(
        initialValues.images.map((img) => ({
          url: img.url,
          name: img.originalName || "existing-image",
          isExisting: true,
        }))
      );
      setInitialImagesLoaded(true);
    }
  }, [initialValues, initialImagesLoaded]);

  // Initialize images from initialValues when editing (improved)
  useEffect(() => {
    if (
      isEditing &&
      initialValues?.images &&
      initialValues.images.length > 0 &&
      !initialImagesLoaded
    ) {
      console.log(
        `[CreateListingForm] Initializing with ${initialValues.images.length} existing images`
      );

      // Convert initialValues.images to a consistent format to avoid processing errors
      const formattedImages = initialValues.images.map((img) => ({
        id: img._id || `existing-${Math.random().toString(36).substring(2, 9)}`,
        _id: img._id || img.id, // Ensure _id is always set
        url: img.url,
        filename: img.filename || "",
        originalName: img.originalName || "existing-image",
        isExisting: true,
      }));

      // Update image state
      setImageData((prev) => ({
        ...prev,
        existingImages: formattedImages,
        count: formattedImages.length,
      }));

      // Mark that we've loaded the initial images to avoid loops
      setInitialImagesLoaded(true);
    }
  }, [initialValues, isEditing, initialImagesLoaded]);

  // Debug logging when imageFiles or images state changes
  useEffect(() => {
    console.log(
      `[CreateListingForm] imageFiles updated: ${imageFiles.length} files ready for upload`
    );
  }, [imageFiles]);

  useEffect(() => {
    console.log(
      `[CreateListingForm] images state: ${images.length} total images`
    );
  }, [images]);

  // Create a dedicated handler for property type selection
  const handlePropertyTypeSelect = useCallback(
    (type) => {
      setFormData((prev) => ({
        ...prev,
        propertyType: type,
      }));

      // Mark propertyType field as touched when selected
      setTouched((prev) => ({
        ...prev,
        propertyType: true,
      }));

      // Clear any errors for this field when a selection is made
      if (errors.propertyType) {
        setErrors((prev) => ({
          ...prev,
          propertyType: null,
        }));
      }
    },
    [errors]
  );

  // Handle input changes and track touched fields
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Mark field as touched
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Clear error when field is modified
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: null,
        }));
      }
    },
    [errors]
  );

  // Form validation - Fix the price validation to handle numeric values
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title?.trim()) newErrors.title = "Title is required";

    if (!formData.description?.trim())
      newErrors.description = "Description is required";

    // Fix: Check price as number instead of using trim()
    if (
      !formData.price ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    )
      newErrors.price = "Please enter a valid price";

    if (!formData.address?.trim()) newErrors.address = "Address is required";

    if (!formData.city?.trim()) newErrors.city = "City is required";

    if (!formData.state?.trim()) newErrors.state = "State is required";
    // ...other validations...

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CRITICAL FIX: Simplified handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Basic validation
      if (!formData.title || !formData.price || !formData.address) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Prep basic data (keep it simple - avoid complex processing)
      const simpleFormData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms || 0),
        bathrooms: Number(formData.bathrooms || 0),
        propertyType: formData.propertyType,
        listingType: formData.listingType,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country || "Nigeria",
        features: Array.isArray(formData.features)
          ? formData.features
          : typeof formData.features === "string"
          ? formData.features.split(",").map((f) => f.trim())
          : [],
        status: formData.status || "published",
      };

      // Handle images - keep it very simple
      const simpleImageFiles = [];
      if (imageData?.files?.length > 0) {
        for (const file of imageData.files) {
          if (file instanceof File) {
            simpleImageFiles.push(file);
          } else if (file?.file instanceof File) {
            simpleImageFiles.push(file.file);
          }
        }
      }

      // Always reference existing images
      simpleFormData.existingImages = imageData?.existingImages || [];
      simpleFormData.preservedImageIds =
        imageData?.existingImages
          ?.map((img) => img._id || img.id)
          .filter(Boolean) || [];

      // Start submission
      setSubmittingState(true);

      // Call onSubmit if available
      if (typeof onSubmit === "function") {
        await onSubmit(simpleFormData, simpleImageFiles);
      } else {
        // Default submission logic if no onSubmit provided
        toast.error("Form handler not configured");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Submission failed");
    } finally {
      setSubmittingState(false);
    }
  };

  // Add or update the function to handle image preview
  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    console.log(
      `Selected ${files.length} files:`,
      files.map((f) => f.name)
    );

    // Create preview URLs for the selected files
    const newImageFiles = files.map((file) => ({
      file, // Store the actual File object for upload
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    // Update the state with the new image files
    setImageFiles((prev) => [...prev, ...newImageFiles]);

    // Clear the input value to allow selecting the same file again
    e.target.value = "";
  }, []);

  // Add this function to remove image previews
  const removeImage = useCallback((index) => {
    setImageFiles((prev) => {
      // Release object URL to prevent memory leaks
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Handle removing existing images
  const removeExistingImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Add useEffect to clean up object URLs on unmount
  useEffect(() => {
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      imageFiles.forEach((imageFile) => {
        if (imageFile.preview) URL.revokeObjectURL(imageFile.preview);
      });
    };
  }, [imageFiles]);

  // Initialize with initial images when component mounts
  useEffect(() => {
    if (initialValues?.images && initialValues.images.length > 0) {
      console.log(
        `[CreateListingForm] Found ${initialValues.images.length} existing images`
      );

      setImageData((prev) => ({
        ...prev,
        existingImages: initialValues.images,
        count: initialValues.images.length,
      }));
    }
  }, [initialValues]);

  // Handle image selection/changes from the ImageUpload component
  const handleImagesChange = useCallback((data) => {
    console.log("[CreateListingForm] Images updated:", {
      newFiles: data.files.length,
      existingImages: data.existingImages.length,
      total: data.count,
    });

    setImageData(data);

    // Also update imageFiles state for compatibility with the rest of the form
    setImageFiles(
      data.files.map((file) => ({
        file,
        name: file.name,
        size: file.size,
      }))
    );
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
          <span className="mr-2 text-wine">01</span>
          Property Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Title - Luxury Input */}
          <LuxuryInput
            label="Property Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Luxurious 3-Bedroom Penthouse in Ikoyi"
            error={touched.title && errors.title}
            required={true}
          />

          {/* Price - Luxury Input */}
          <LuxuryInput
            label="Price (₦)"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="e.g. 25000000"
            error={touched.price && errors.price}
            required={true}
            type="number"
            icon={<FiDollarSign className="text-gray-400" />}
          />

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <LuxuryInput
              label="Bedrooms"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleInputChange}
              placeholder="e.g. 3"
              error={touched.bedrooms && errors.bedrooms}
              type="number"
            />

            <LuxuryInput
              label="Bathrooms"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleInputChange}
              placeholder="e.g. 2"
              error={touched.bathrooms && errors.bathrooms}
              type="number"
            />
          </div>

          {/* Description - Luxury Textarea */}
          <div className="md:col-span-2">
            <LuxuryTextarea
              label="Property Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe this property in detail, highlighting its most attractive features and amenities..."
              error={touched.description && errors.description}
              required={true}
              rows={5}
            />
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
          <span className="mr-2 text-wine">02</span>
          Location Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LuxuryInput
            label="Street Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="e.g. 25 Bourdillon Road"
            error={touched.address && errors.address}
            required={true}
            className="md:col-span-2"
          />

          <LuxuryInput
            label="City"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="e.g. Ikoyi"
            error={touched.city && errors.city}
            required={true}
          />

          <LuxuryInput
            label="State"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="e.g. Lagos"
            error={touched.state && errors.state}
            required={true}
          />
        </div>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
          <span className="mr-2 text-wine">03</span>
          Features & Amenities
        </h2>

        <LuxuryInput
          label="Features"
          name="features"
          value={formData.features}
          onChange={handleInputChange}
          placeholder="e.g. Swimming Pool, Garden, Fitted Kitchen, Security"
          error={touched.features && errors.features}
          className="mb-2"
        />
        <p className="text-xs text-gray-500 pl-3">
          Separate features with commas
        </p>
      </div>

      {/* Property Type Selection */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
          <span className="mr-2 text-wine">04</span>
          Property Classification
        </h2>

        {/* Property Type */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Property Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handlePropertyTypeSelect(type.value)}
                className={`relative flex flex-col items-center justify-center transition-all duration-300 p-4 rounded-lg ${
                  formData.propertyType === type.value
                    ? "bg-wine/5 border-wine text-wine shadow-sm"
                    : "bg-white border-gray-200 hover:border-wine/50 hover:bg-gray-50"
                } border`}
                aria-pressed={formData.propertyType === type.value}
              >
                <div className="mb-2">{type.icon}</div>
                <span
                  className={`font-medium ${
                    formData.propertyType === type.value ? "text-wine" : ""
                  }`}
                >
                  {type.label}
                </span>

                {formData.propertyType === type.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-wine"></div>
                )}
              </button>
            ))}
          </div>
          {touched.propertyType && errors.propertyType && (
            <p className="mt-2 text-sm text-red-600">{errors.propertyType}</p>
          )}
        </div>

        {/* Listing Type - Simplified and professional */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Listing Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {LISTING_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, listingType: type.value }));
                  setTouched((prev) => ({ ...prev, listingType: true }));
                  if (errors.listingType) {
                    setErrors((prev) => ({ ...prev, listingType: null }));
                  }
                }}
                className={`group relative transition-all duration-300 border ${
                  formData.listingType === type.value
                    ? "bg-gradient-to-br from-gray-50 to-gray-100 border-wine shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                } rounded-lg p-4 h-24 flex flex-col items-center justify-center`}
                aria-pressed={formData.listingType === type.value}
              >
                <div className={`text-center`}>
                  <div className="flex justify-center mb-2">{type.icon}</div>
                  <div
                    className={`font-semibold ${
                      formData.listingType === type.value
                        ? "text-wine"
                        : "text-gray-700"
                    }`}
                  >
                    {type.label}
                  </div>
                </div>

                {/* Selection indicator */}
                {formData.listingType === type.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-wine"></div>
                )}
              </button>
            ))}
          </div>
          {touched.listingType && errors.listingType && (
            <p className="mt-2 text-sm text-red-600">{errors.listingType}</p>
          )}
        </div>
      </div>

      {/* Images Upload Section - With improved initialization */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
          <span className="mr-2 text-wine">05</span>
          Property Images
        </h2>

        {/* New ImageUpload component */}
        <ImageUpload
          initialImages={initialValues?.images || []}
          onChange={handleImagesChange}
          maxImages={10}
          maxSizeMB={5}
          className="mb-4"
        />

        {/* Image upload status indicator */}
        {imageData.count > 0 && (
          <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-1">Image Status</h3>
            <ul className="text-sm text-blue-700">
              <li>• Existing images: {imageData.existingImages.length}</li>
              <li>• New images: {imageData.files.length}</li>
              <li>• Total images: {imageData.count}</li>
              {isEditing && imageData.existingImages.length > 0 && (
                <li>• Your existing images will be preserved unless removed</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="mt-10 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className={`px-8 py-3 text-white rounded-lg flex items-center justify-center transition-all duration-300 ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-wine to-wine hover:shadow-lg transform hover:-translate-y-1"
          }`}
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            <span className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              {isEditing ? "Update Listing" : "Create Listing"}
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
