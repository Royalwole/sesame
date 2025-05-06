import { put, list, del } from "@vercel/blob";
import { generateBlobPath } from "./blob-config";

/**
 * Utility for Vercel Blob storage operations
 * This provides file storage capabilities separate from the database
 */

// Configuration
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_ENABLED = !!BLOB_TOKEN;

/**
 * Check if Vercel Blob is properly configured
 */
export function isBlobConfigured() {
  return BLOB_ENABLED;
}

/**
 * Get detailed diagnostic information about blob configuration
 * @returns {Object} Configuration status details
 */
export function getBlobConfigStatus() {
  return {
    isConfigured: BLOB_ENABLED,
    missingToken: !BLOB_TOKEN,
    environment: process.env.NODE_ENV,
    packageInstalled: typeof put === "function" && typeof list === "function",
  };
}

/**
 * Upload a file to Vercel Blob storage
 * @param {File|Blob} file - The file to upload
 * @param {String} filename - Optional filename
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadToBlob(file, filename, options = {}) {
  if (!BLOB_ENABLED) {
    throw new Error(
      "Vercel Blob storage is not configured. Please set BLOB_READ_WRITE_TOKEN."
    );
  }

  try {
    const { folder = "uploads", metadata = {}, userId } = options;

    // Generate a unique path for the file
    const filePath = generateBlobPath(folder, userId || "anonymous", filename);

    // Upload the file
    const blob = await put(filePath, file, {
      access: "public",
      ...metadata,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: blob.size,
      path: filePath,
    };
  } catch (error) {
    console.error("Blob upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a file from Vercel Blob storage
 * @param {String} pathname - Pathname of the file to delete
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteFromBlob(pathname) {
  if (!BLOB_ENABLED) {
    throw new Error("Vercel Blob storage is not configured");
  }

  try {
    await del(pathname);
    return { success: true };
  } catch (error) {
    console.error("Blob deletion error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List files in Vercel Blob storage
 * @param {String} prefix - Prefix to filter files
 * @returns {Promise<Object>} - List result with files
 */
export async function listBlobFiles(prefix) {
  if (!BLOB_ENABLED) {
    throw new Error("Vercel Blob storage is not configured");
  }

  try {
    const blobs = await list({ prefix });
    return {
      success: true,
      files: blobs.blobs,
    };
  } catch (error) {
    console.error("Blob list error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check Vercel Blob storage connectivity
 * @returns {Promise<Object>} Connection status
 */
export async function checkBlobConnection() {
  if (!BLOB_ENABLED) {
    return {
      isConnected: false,
      status: "not-configured",
      message: "Vercel Blob is not configured (BLOB_READ_WRITE_TOKEN missing)",
      diagnostic: getBlobConfigStatus(),
    };
  }

  try {
    // Try a simple list operation to verify connectivity
    const testMarker = `test-${Date.now()}`;
    await list({ prefix: testMarker, limit: 1 });

    return {
      isConnected: true,
      status: "connected",
      message: "Vercel Blob storage is connected and operational",
    };
  } catch (error) {
    console.error("Blob connection check failed:", error);
    return {
      isConnected: false,
      status: "error",
      message: `Vercel Blob connection error: ${error.message}`,
      error: {
        name: error.name,
        code: error.code || "unknown",
      },
    };
  }
}
