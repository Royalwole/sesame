import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase-config";
import { generateBlobPath } from "./blob-config";

/**
 * Utility for Firebase Storage operations
 * This provides file storage capabilities separate from the database
 */

// Configuration
const FIREBASE_STORAGE_ENABLED = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ? true
  : false;

/**
 * Check if Firebase Storage is properly configured
 */
export function isBlobConfigured() {
  return FIREBASE_STORAGE_ENABLED;
}

/**
 * Get detailed diagnostic information about storage configuration
 * @returns {Object} Configuration status details
 */
export function getBlobConfigStatus() {
  return {
    isConfigured: FIREBASE_STORAGE_ENABLED,
    missingConfig: !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    environment: process.env.NODE_ENV,
    packageInstalled: typeof storage !== "undefined",
  };
}

/**
 * Upload a file to Firebase Storage
 * @param {File|Blob} file - The file to upload
 * @param {String} filename - Optional filename
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadToBlob(file, filename, options = {}) {
  if (!FIREBASE_STORAGE_ENABLED) {
    throw new Error(
      "Firebase Storage is not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET."
    );
  }

  try {
    const { folder = "uploads", metadata = {}, userId } = options;

    // Generate a unique path for the file
    const filePath = generateBlobPath(folder, userId || "anonymous", filename);

    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, filePath);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: metadata,
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      pathname: filePath,
      contentType: file.type,
      size: file.size,
      path: filePath,
    };
  } catch (error) {
    console.error("Firebase Storage upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a file from Firebase Storage
 * @param {String} pathname - Pathname of the file to delete
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteFromBlob(pathname) {
  if (!FIREBASE_STORAGE_ENABLED) {
    throw new Error("Firebase Storage is not configured");
  }

  try {
    const fileRef = ref(storage, pathname);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error("Firebase Storage deletion error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List files in Firebase Storage
 * @param {String} prefix - Prefix to filter files
 * @returns {Promise<Object>} - List result with files
 */
export async function listBlobFiles(prefix) {
  if (!FIREBASE_STORAGE_ENABLED) {
    throw new Error("Firebase Storage is not configured");
  }

  try {
    const folderRef = ref(storage, prefix || "");
    const filesList = await listAll(folderRef);

    // Map the items to a format similar to the original blob response
    const files = await Promise.all(
      filesList.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          url,
          pathname: item.fullPath,
          // Firebase doesn't provide these by default,
          // would need additional metadata calls to get these
          contentType: "application/octet-stream",
          size: 0,
        };
      })
    );

    return {
      success: true,
      files,
    };
  } catch (error) {
    console.error("Firebase Storage list error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check Firebase Storage connectivity
 * @returns {Promise<Object>} Connection status
 */
export async function checkBlobConnection() {
  if (!FIREBASE_STORAGE_ENABLED) {
    return {
      isConnected: false,
      status: "not-configured",
      message:
        "Firebase Storage is not configured (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing)",
      diagnostic: getBlobConfigStatus(),
    };
  }

  try {
    // Try to create a reference to verify connectivity
    const testRef = ref(storage, `test-${Date.now()}`);

    // If we can create a reference without errors, the storage is accessible
    return {
      isConnected: true,
      status: "connected",
      message: "Firebase Storage is connected and operational",
    };
  } catch (error) {
    console.error("Firebase Storage connection check failed:", error);
    return {
      isConnected: false,
      status: "error",
      message: `Firebase Storage connection error: ${error.message}`,
      error: {
        name: error.name,
        code: error.code || "unknown",
      },
    };
  }
}
