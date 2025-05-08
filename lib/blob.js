import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import {
  storage,
  firebaseInitialized,
  getFirebaseStatus,
} from "./firebase-config";
import { generateBlobPath } from "./blob-config";
import { logError } from "./error-logger";

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
  return FIREBASE_STORAGE_ENABLED && firebaseInitialized;
}

/**
 * Get detailed diagnostic information about storage configuration
 * @returns {Object} Configuration status details
 */
export function getBlobConfigStatus() {
  return {
    ...getFirebaseStatus(),
    isConfigured: FIREBASE_STORAGE_ENABLED,
    missingConfig: !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    environment: process.env.NODE_ENV,
  };
}

/**
 * Upload a file to Firebase Storage with enhanced error handling
 * @param {File|Blob} file - The file to upload
 * @param {String} filename - Optional filename
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadToBlob(file, filename, options = {}) {
  if (!FIREBASE_STORAGE_ENABLED) {
    const error = new Error(
      "Firebase Storage is not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET."
    );
    logError("Firebase Storage Configuration Error", error);
    return {
      success: false,
      error: error.message,
      code: "not_configured",
    };
  }

  if (!firebaseInitialized) {
    const error = new Error("Firebase Storage was not properly initialized.");
    logError("Firebase Storage Initialization Error", error);
    return {
      success: false,
      error: error.message,
      code: "not_initialized",
    };
  }

  try {
    const { folder = "uploads", metadata = {}, userId } = options;

    // Generate a unique path for the file
    const filePath = generateBlobPath(folder, userId || "anonymous", filename);

    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, filePath);

    // Upload the file with retry logic
    const snapshot = await uploadWithRetry(storageRef, file, {
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
    logError("Firebase Storage Upload Error", error);
    return {
      success: false,
      error: error.message,
      code: error.code || "unknown_error",
    };
  }
}

/**
 * Upload with retry logic
 * @param {StorageReference} ref - Storage reference
 * @param {File|Blob} file - File to upload
 * @param {Object} metadata - File metadata
 * @returns {Promise<Object>} Upload snapshot
 */
async function uploadWithRetry(storageRef, file, metadata, attempt = 0) {
  const maxAttempts = 3;

  try {
    return await uploadBytes(storageRef, file, metadata);
  } catch (error) {
    if (attempt < maxAttempts - 1) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      console.log(
        `Firebase upload failed, retrying in ${delay}ms (attempt ${attempt + 1})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return uploadWithRetry(storageRef, file, metadata, attempt + 1);
    } else {
      console.error(`Firebase upload failed after ${maxAttempts} attempts`);
      throw error;
    }
  }
}

/**
 * Delete a file from Firebase Storage
 * @param {String} pathname - Pathname of the file to delete
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteFromBlob(pathname) {
  if (!FIREBASE_STORAGE_ENABLED) {
    const error = new Error("Firebase Storage is not configured");
    logError("Firebase Storage Configuration Error", error);
    return {
      success: false,
      error: error.message,
      code: "not_configured",
    };
  }

  try {
    const fileRef = ref(storage, pathname);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error("Firebase Storage deletion error:", error);
    logError("Firebase Storage Deletion Error", error);
    return {
      success: false,
      error: error.message,
      code: error.code || "unknown_error",
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
    const error = new Error("Firebase Storage is not configured");
    logError("Firebase Storage Configuration Error", error);
    return {
      success: false,
      error: error.message,
      code: "not_configured",
    };
  }

  try {
    const folderRef = ref(storage, prefix || "");
    const filesList = await listAll(folderRef);

    // Map the items to a format similar to the original blob response
    const files = await Promise.all(
      filesList.items.map(async (item) => {
        try {
          const url = await getDownloadURL(item);
          const metadata = await getMetadata(item);

          return {
            url,
            pathname: item.fullPath,
            contentType: metadata.contentType || "application/octet-stream",
            size: metadata.size || 0,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            name: item.name,
          };
        } catch (itemError) {
          console.warn(
            `Error processing file ${item.fullPath}:`,
            itemError.message
          );
          return {
            pathname: item.fullPath,
            name: item.name,
            error: itemError.message,
          };
        }
      })
    );

    return {
      success: true,
      files,
      prefix,
      totalFiles: files.length,
    };
  } catch (error) {
    console.error("Firebase Storage list error:", error);
    logError("Firebase Storage List Error", error);
    return {
      success: false,
      error: error.message,
      code: error.code || "unknown_error",
    };
  }
}

/**
 * Check Firebase Storage connectivity
 * @returns {Promise<Object>} Connection status
 */
export async function checkBlobConnection() {
  // First check if Firebase is configured
  const configStatus = getBlobConfigStatus();

  if (!configStatus.isInitialized) {
    return {
      isConnected: false,
      status: "not-initialized",
      message: configStatus.error || "Firebase Storage is not initialized",
      diagnostic: configStatus,
    };
  }

  if (!FIREBASE_STORAGE_ENABLED) {
    return {
      isConnected: false,
      status: "not-configured",
      message:
        "Firebase Storage is not configured (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing)",
      diagnostic: configStatus,
    };
  }

  try {
    // Try to create a reference and get metadata as a connectivity test
    const testRef = ref(storage, `connectivity-test-${Date.now()}`);

    // If we can create a reference without errors, try to list files as a deeper test
    try {
      const testFolder = ref(storage, "test");
      await listAll(testFolder);

      return {
        isConnected: true,
        status: "connected",
        message: "Firebase Storage is connected and operational",
        timestamp: new Date().toISOString(),
      };
    } catch (listError) {
      // Even if listing fails, we might still have a valid connection
      // Some errors might be due to permissions, not connectivity
      if (listError.code === "storage/unauthorized") {
        return {
          isConnected: true, // Still consider connected if it's a permission issue
          status: "permission-issue",
          message:
            "Firebase Storage is connected but has permission restrictions",
          error: {
            code: listError.code,
            message: listError.message,
          },
        };
      }

      throw listError; // Re-throw for the outer catch
    }
  } catch (error) {
    console.error("Firebase Storage connection check failed:", error);
    logError("Firebase Storage Connection Check Failed", error);

    return {
      isConnected: false,
      status: "error",
      message: `Firebase Storage connection error: ${error.message}`,
      error: {
        name: error.name,
        code: error.code || "unknown",
        message: error.message,
      },
    };
  }
}
