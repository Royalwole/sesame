/**
 * Utility functions to check Firebase Storage configuration
 */

export function checkBlobConfig() {
  // Check if the required environment variables are set
  const hasStorageBucket = !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!hasStorageBucket) {
    console.error(
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is missing. File uploads will fail!"
    );
  }

  return {
    isConfigured: hasStorageBucket,
    message: hasStorageBucket
      ? "Firebase Storage is configured correctly"
      : "Firebase Storage configuration is missing",
  };
}

/**
 * Generate a blob path with proper folder structure
 */
export function generateBlobPath(folder, userId, filename) {
  // Clean user ID to ensure it's safe for paths
  const safeUserId = String(userId).replace(/[^a-z0-9]/gi, "");

  // Generate timestamp and random string for uniqueness
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);

  // Get original extension or default to .jpg
  const ext = filename ? filename.split(".").pop().toLowerCase() : "jpg";

  return `${folder}/${safeUserId}/${timestamp}-${randomStr}.${ext}`;
}
