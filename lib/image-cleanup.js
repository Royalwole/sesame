import { storage } from "./firebase-config";
import { ref, listAll, deleteObject } from "firebase/storage";
import Listing from "../models/Listing";

/**
 * Clean up orphaned images in Firebase Storage
 * @param {string} folder - The folder to clean (e.g., 'listings')
 */
export async function cleanupOrphanedImages(folder = "listings") {
  try {
    console.log(`Starting cleanup of orphaned images in ${folder}`);

    // Get all images from Firebase Storage
    const storageRef = ref(storage, folder);
    const { items } = await listAll(storageRef);

    // Get all image paths from the database
    const listings = await Listing.find({}, "images.path");
    const validPaths = new Set(
      listings.flatMap((listing) => listing.images.map((img) => img.path))
    );

    // Find and delete orphaned images
    let deletedCount = 0;
    for (const item of items) {
      const path = item.fullPath;
      if (!validPaths.has(path)) {
        try {
          await deleteObject(item);
          deletedCount++;
          console.log(`Deleted orphaned image: ${path}`);
        } catch (error) {
          console.error(`Failed to delete ${path}:`, error);
        }
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned images`);
    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    console.error("Image cleanup error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify and repair image records in database
 */
export async function verifyImageRecords() {
  try {
    console.log("Starting image record verification");

    const listings = await Listing.find({ "images.0": { $exists: true } });
    let repairedCount = 0;

    for (const listing of listings) {
      const validImages = [];
      let needsUpdate = false;

      for (const image of listing.images) {
        try {
          const imageRef = ref(storage, image.path);
          await getDownloadURL(imageRef);
          validImages.push(image);
        } catch (error) {
          needsUpdate = true;
          console.log(
            `Invalid image found in listing ${listing._id}: ${image.path}`
          );
        }
      }

      if (needsUpdate) {
        listing.images = validImages;
        await listing.save();
        repairedCount++;
        console.log(`Repaired listing ${listing._id}`);
      }
    }

    console.log(`Verification complete. Repaired ${repairedCount} listings`);
    return {
      success: true,
      repairedCount,
    };
  } catch (error) {
    console.error("Image verification error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
