import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase-config";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload a file to Firebase Storage
 * @param {File|Blob} file - The file to upload
 * @param {String} filename - Optional filename
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadToStorage(file, filename, options = {}) {
  try {
    const { folder = "uploads", metadata = {} } = options;

    // Generate a unique filename if not provided
    const uniqueFilename = filename || `${uuidv4()}-${file.name}`;
    const fullPath = `${folder}/${uniqueFilename}`;

    // Create storage reference
    const storageRef = ref(storage, fullPath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      customMetadata: metadata,
    });

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url,
      path: fullPath,
      contentType: file.type,
      size: file.size,
      metadata: snapshot.metadata,
    };
  } catch (error) {
    console.error("Storage upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a file from Firebase Storage
 * @param {String} path - The path to the file in storage
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteFromStorage(path) {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error("Storage deletion error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get download URL for a file in Firebase Storage
 * @param {String} path - The path to the file in storage
 * @returns {Promise<String>} - Download URL
 */
export async function getStorageUrl(path) {
  try {
    const fileRef = ref(storage, path);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error("Failed to get storage URL:", error);
    throw error;
  }
}

export default {
  uploadToStorage,
  deleteFromStorage,
  getStorageUrl,
};
