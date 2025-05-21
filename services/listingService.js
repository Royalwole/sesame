// Create new service file
import Listing from "../models/Listing";
import { uploadMultipleImages } from "../lib/uploadImage";
import { logListingEvent } from "../lib/error-logger";

/**
 * Service for managing property listings
 */
export async function getListings(filters = {}, options = {}) {
  const { limit = 10, skip = 0, sort = { created_at: -1 } } = options;
  const requestId = `service-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    // Build query
    const query = {};

    // Add filters
    if (filters.propertyType) query.propertyType = filters.propertyType;
    if (filters.listingType) query.listingType = filters.listingType;

    // Handle price range with proper validation
    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
      if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
    }

    // Improve text search for city/state with case insensitivity
    if (filters.city) query.city = { $regex: new RegExp(filters.city, "i") };
    if (filters.state) query.state = { $regex: new RegExp(filters.state, "i") };

    // Handle numeric filters with proper conversion
    if (filters.bedrooms) query.bedrooms = { $gte: Number(filters.bedrooms) };
    if (filters.bathrooms)
      query.bathrooms = { $gte: Number(filters.bathrooms) };

    // Default to published listings only
    if (!filters.status) query.status = "published";

    // Log query for debugging
    console.log(
      `[listingService] Getting listings with filters: ${JSON.stringify(query)}, requestId: ${requestId}`
    );

    // Execute query with proper error handling
    const listings = await Listing.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("agent", "name email phone")
      .lean();

    // Get total count for pagination
    const total = await Listing.countDocuments(query);

    return {
      listings,
      total,
      requestId,
      success: true,
    };
  } catch (error) {
    console.error(
      `[listingService] Error fetching listings (requestId: ${requestId}):`,
      error
    );
    logListingEvent({
      type: "SERVICE_ERROR",
      action: "getListings",
      error: error.message,
      metadata: { filters, options, requestId },
    });

    throw error;
  }
}

export async function getListingById(id) {
  if (!id) {
    throw new Error("Listing ID is required");
  }

  const requestId = `service-get-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  try {
    console.log(
      `[listingService] Fetching listing by ID: ${id}, requestId: ${requestId}`
    );

    // Handle potential string vs ObjectId issues
    let listing;
    try {
      // First try direct lookup
      listing = await Listing.findById(id)
        .populate("agent", "name email phone")
        .lean();
    } catch (idError) {
      console.warn(
        `[listingService] Error with direct ID lookup for ${id}, trying string comparison`
      );

      // If that fails, try string comparison (helps with some edge cases)
      listing = await Listing.findOne({
        $or: [
          { _id: id.toString() },
          { _id: { $regex: new RegExp(`^${id}$`, "i") } },
        ],
      })
        .populate("agent", "name email phone")
        .lean();
    }

    if (!listing) {
      console.warn(
        `[listingService] Listing not found with ID: ${id}, requestId: ${requestId}`
      );
      return null;
    }

    return {
      ...listing,
      requestId,
      success: true,
    };
  } catch (error) {
    console.error(
      `[listingService] Error fetching listing by ID: ${id}, requestId: ${requestId}`,
      error
    );
    logListingEvent({
      type: "SERVICE_ERROR",
      action: "getListingById",
      id,
      error: error.message,
      metadata: { requestId },
    });

    throw error;
  }
}

export async function createListing(listingData, userId) {
  if (!userId) {
    throw new Error("User ID is required to create a listing");
  }

  const requestId = `service-create-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    console.log(
      `[listingService] Creating new listing, requestId: ${requestId}`
    );

    // Validate required fields
    const requiredFields = ["title", "price", "propertyType", "listingType"];
    const missingFields = requiredFields.filter((field) => !listingData[field]);

    if (missingFields.length > 0) {
      const errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
      throw new Error(errorMessage);
    }

    // Handle image uploads if present
    if (
      listingData.images &&
      Array.isArray(listingData.images) &&
      listingData.images.length > 0
    ) {
      try {
        const uploadResult = await uploadMultipleImages(listingData.images, {
          folder: "listings",
          metadata: { userId, requestId },
        });

        // Transform uploaded images to the format expected by the model
        listingData.images = uploadResult.results.map((image, index) => ({
          url: image.url,
          caption: image.caption || listingData.title || "",
          isPrimary: index === 0, // First image is primary
          uploadedAt: new Date(),
          requestId,
        }));
      } catch (uploadError) {
        console.error(
          `[listingService] Image upload error, requestId: ${requestId}`,
          uploadError
        );
        throw new Error(`Failed to upload images: ${uploadError.message}`);
      }
    } else {
      // Initialize with empty array if no images
      listingData.images = [];
    }

    // Add timestamps and tracking info
    const enhancedData = {
      ...listingData,
      createdBy: userId,
      updatedBy: userId,
      created_at: new Date(),
      updated_at: new Date(),
      agent: userId,
      requestId,
      status: listingData.status || "draft", // Default to draft if not specified
    };

    // Create and save the listing
    const listing = new Listing(enhancedData);
    const savedListing = await listing.save();

    console.log(
      `[listingService] Created listing: ${savedListing._id}, requestId: ${requestId}`
    );

    // Log successful creation
    logListingEvent({
      type: "LISTING_CREATED",
      id: savedListing._id.toString(),
      userId,
      metadata: {
        requestId,
        title: listingData.title,
        imageCount: listingData.images.length,
      },
    });

    return {
      listing: savedListing,
      success: true,
      requestId,
    };
  } catch (error) {
    console.error(
      `[listingService] Error creating listing, requestId: ${requestId}`,
      error
    );

    // Log the error
    logListingEvent({
      type: "SERVICE_ERROR",
      action: "createListing",
      userId,
      error: error.message,
      metadata: {
        requestId,
        title: listingData.title,
      },
    });

    throw error;
  }
}

export async function updateListing(id, listingData, userId) {
  if (!id || !userId) {
    throw new Error("Listing ID and User ID are required");
  }

  const requestId = `service-update-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    console.log(
      `[listingService] Updating listing ${id}, requestId: ${requestId}`
    );

    // Find the listing
    const listing = await Listing.findById(id);

    if (!listing) {
      throw new Error(`Listing not found with ID: ${id}`);
    }

    // Check if user is the owner or has admin role
    const isOwner = listing.agent.toString() === userId;

    if (!isOwner) {
      // You can add admin check here if needed
      console.warn(
        `[listingService] Authorization failed for updating listing ${id}, user ${userId}, requestId: ${requestId}`
      );
      throw new Error("Not authorized to update this listing");
    }

    // Handle image updates if present
    if (listingData.images && Array.isArray(listingData.images)) {
      // Check for new images to upload (non-URL objects that need processing)
      const newImagesToUpload = listingData.images.filter(
        (img) =>
          typeof img === "object" && !(img.url && typeof img.url === "string")
      );

      if (newImagesToUpload.length > 0) {
        try {
          const uploadResult = await uploadMultipleImages(newImagesToUpload, {
            folder: "listings",
            metadata: { userId, listingId: id, requestId },
          });

          // Get existing images that already have URLs
          const existingImages = listingData.images.filter(
            (img) => img.url && typeof img.url === "string"
          );

          // Transform uploaded images and combine with existing ones
          const newImages = uploadResult.results.map((image) => ({
            url: image.url,
            caption: image.caption || "",
            isPrimary: false,
            uploadedAt: new Date(),
            requestId,
          }));

          // Combine existing and new images
          listingData.images = [...existingImages, ...newImages];

          // Ensure one image is marked as primary
          if (
            listingData.images.length > 0 &&
            !listingData.images.some((img) => img.isPrimary)
          ) {
            listingData.images[0].isPrimary = true;
          }
        } catch (uploadError) {
          console.error(
            `[listingService] Image upload error during update, requestId: ${requestId}`,
            uploadError
          );
          throw new Error(
            `Failed to upload new images: ${uploadError.message}`
          );
        }
      }
    }

    // Update timestamps and tracking info
    listingData.updatedBy = userId;
    listingData.updated_at = new Date();
    listingData.requestId = requestId;

    // Update the listing - use updateOne to avoid validation issues
    const updateResult = await Listing.updateOne(
      { _id: id },
      { $set: listingData }
    );

    if (updateResult.modifiedCount === 0) {
      console.warn(
        `[listingService] No changes made to listing ${id}, requestId: ${requestId}`
      );
    } else {
      console.log(
        `[listingService] Updated listing ${id}, requestId: ${requestId}`
      );
    }

    // Fetch the updated listing to return
    const updatedListing = await Listing.findById(id).lean();

    // Log successful update
    logListingEvent({
      type: "LISTING_UPDATED",
      id,
      userId,
      metadata: {
        requestId,
        fields: Object.keys(listingData).filter(
          (k) => k !== "images" && k !== "requestId"
        ),
        imagesUpdated: !!listingData.images,
      },
    });

    return {
      listing: updatedListing,
      success: true,
      requestId,
    };
  } catch (error) {
    console.error(
      `[listingService] Error updating listing ${id}, requestId: ${requestId}`,
      error
    );

    // Log the error
    logListingEvent({
      type: "SERVICE_ERROR",
      action: "updateListing",
      id,
      userId,
      error: error.message,
      metadata: { requestId },
    });

    throw error;
  }
}

export async function deleteListing(id, userId) {
  if (!id || !userId) {
    throw new Error("Listing ID and User ID are required");
  }

  const requestId = `service-delete-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  try {
    console.log(
      `[listingService] Deleting listing ${id}, requestId: ${requestId}`
    );

    // Find the listing
    const listing = await Listing.findById(id);

    if (!listing) {
      throw new Error(`Listing not found with ID: ${id}`);
    }

    // Check if user is the owner or has admin role
    const isOwner = listing.agent.toString() === userId;

    if (!isOwner) {
      // You can add admin check here if needed
      console.warn(
        `[listingService] Authorization failed for deleting listing ${id}, user ${userId}, requestId: ${requestId}`
      );
      throw new Error("Not authorized to delete this listing");
    }

    // Store listing data for logging before deletion
    const listingInfo = {
      id,
      title: listing.title,
      property: listing.propertyType,
      createdAt: listing.created_at,
    };

    // Delete the listing - use deleteOne for more reliable operation
    const deleteResult = await Listing.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      throw new Error(`Failed to delete listing ${id}`);
    }

    console.log(
      `[listingService] Deleted listing ${id}, requestId: ${requestId}`
    );

    // Log successful deletion
    logListingEvent({
      type: "LISTING_DELETED",
      id,
      userId,
      metadata: {
        requestId,
        listingInfo,
      },
    });

    return {
      success: true,
      message: "Listing deleted successfully",
      requestId,
    };
  } catch (error) {
    console.error(
      `[listingService] Error deleting listing ${id}, requestId: ${requestId}`,
      error
    );
    // Log the error
    logListingEvent({
      type: "SERVICE_ERROR",
      action: "deleteListing",
      id,
      userId,
      error: error.message,
      metadata: { requestId },
    });

    throw error;
  }
}
