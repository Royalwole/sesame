/**
 * Firebase Storage debugging utilities
 */

import { storage } from "../firebase-config";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  getBlob,
} from "firebase/storage";
import { alertOnAnomaly } from "./index";

class BlobDebugger {
  constructor() {
    this.isDebugEnabled = false;
    this.operations = [];
    this.operationsMaxSize = 50;
    this.isConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  }

  // Enable debugging
  enableDebug() {
    this.isDebugEnabled = true;
    console.log("Firebase Storage debugging enabled");

    // Check if Firebase Storage is configured
    if (!this.isConfigured) {
      console.warn(
        "Firebase Storage not configured (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing)"
      );
    }

    return this;
  }

  // Disable debugging
  disableDebug() {
    this.isDebugEnabled = false;
    return this;
  }

  // Check blob connection
  async checkConnection() {
    if (!this.isConfigured) {
      return {
        isConnected: false,
        status: "not-configured",
        message:
          "Firebase Storage is not configured (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing)",
      };
    }

    try {
      // Try a basic operation to test connectivity
      const testKey = `debug/test-connection-${Date.now()}.txt`;
      const testContent = `Connection test at ${new Date().toISOString()}`;

      // Create storage reference
      const storageRef = ref(storage, testKey);

      // Upload test file
      await uploadString(storageRef, testContent, "raw", {
        contentType: "text/plain",
      });

      // Get download URL
      const url = await getDownloadURL(storageRef);

      // Log the operation
      this.trackOperation("checkConnection", {
        action: "put",
        key: testKey,
        size: testContent.length,
        result: "success",
        url,
      });

      return {
        isConnected: true,
        status: "connected",
        message: "Firebase Storage is connected and operational",
        testUrl: url,
      };
    } catch (error) {
      this.trackOperation("checkConnection", {
        action: "put",
        error: error.message,
      });

      console.error("Firebase Storage connection check failed:", error);
      return {
        isConnected: false,
        status: "error",
        message: `Connection error: ${error.message}`,
        error: {
          name: error.name,
          message: error.message,
        },
      };
    }
  }

  // List available blobs
  async listBlobs(options = {}) {
    if (!this.isConfigured) {
      throw new Error("Firebase Storage is not configured");
    }

    try {
      const startTime = Date.now();

      // Create reference to the folder we want to list
      const prefix = options.prefix || "";
      const listRef = ref(storage, prefix);

      // List all items in the folder
      const listResult = await listAll(listRef);

      // Map to a format similar to Vercel Blob's output
      const blobs = await Promise.all(
        listResult.items.map(async (itemRef) => {
          const metadata = await getMetadata(itemRef);
          const url = await getDownloadURL(itemRef);

          return {
            url,
            pathname: itemRef.fullPath,
            contentType: metadata.contentType,
            size: metadata.size,
            uploadedAt: new Date(metadata.timeCreated),
          };
        })
      );

      const duration = Date.now() - startTime;

      this.trackOperation("listBlobs", {
        action: "list",
        options,
        count: blobs.length,
        duration,
      });

      if (this.isDebugEnabled) {
        console.log(`Listed ${blobs.length} files in ${duration}ms`);
      }

      return { blobs };
    } catch (error) {
      this.trackOperation("listBlobs", {
        action: "list",
        options,
        error: error.message,
      });

      console.error("Failed to list files:", error);
      throw error;
    }
  }

  // Track blob operations
  trackOperation(source, details) {
    const operation = {
      timestamp: new Date(),
      source,
      ...details,
    };

    this.operations.push(operation);

    // Maintain log size limit
    if (this.operations.length > this.operationsMaxSize) {
      this.operations.shift();
    }

    // Log if debugging is enabled
    if (this.isDebugEnabled) {
      console.log("Storage operation:", operation);
    }

    // Alert on errors
    if (details.error) {
      alertOnAnomaly({
        type: "storageOperation",
        operation: source,
        error: details.error,
        message: `Storage operation ${source} failed: ${details.error}`,
      });
    }

    return operation;
  }

  // Debug blob integrity
  async checkBlobIntegrity(blobPath) {
    if (!this.isConfigured) {
      throw new Error("Firebase Storage is not configured");
    }

    try {
      const anomalies = [];

      // Create reference to the file
      const fileRef = ref(storage, blobPath);

      try {
        // Try to get the metadata
        const metadata = await getMetadata(fileRef);

        // Check expected content type based on extension
        const extension = blobPath.split(".").pop().toLowerCase();
        const expectedContentType = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          pdf: "application/pdf",
          txt: "text/plain",
          json: "application/json",
        }[extension];

        if (
          expectedContentType &&
          metadata.contentType !== expectedContentType
        ) {
          anomalies.push(
            `Content type mismatch: expected ${expectedContentType}, got ${metadata.contentType}`
          );
        }

        // Check for zero-byte files
        if (metadata.size === 0) {
          anomalies.push("Zero-byte file detected");
        }

        // Try to download a small portion of the file to verify it's accessible
        try {
          await getDownloadURL(fileRef);
        } catch (downloadError) {
          anomalies.push(`File not accessible: ${downloadError.message}`);
        }

        this.trackOperation("checkIntegrity", {
          blobPath,
          size: metadata.size,
          contentType: metadata.contentType,
          anomalies,
        });

        return {
          exists: true,
          blob: metadata,
          anomalies,
        };
      } catch (error) {
        // File doesn't exist or couldn't be accessed
        return { exists: false, anomalies: ["File not found"] };
      }
    } catch (error) {
      this.trackOperation("checkIntegrity", {
        blobPath,
        error: error.message,
      });

      console.error(`Failed to check integrity of file ${blobPath}:`, error);
      return {
        exists: false,
        error: error.message,
        anomalies: ["Error accessing file"],
      };
    }
  }
}

// Export singleton instance
export const blobDebug = new BlobDebugger();

// Debug Firebase Storage operations
export const debugBlobStorage = async () => {
  try {
    // Test Firebase Storage connectivity
    const testKey = `test-debug-${Date.now()}.txt`;
    const storageRef = ref(storage, testKey);

    // Upload test content
    await uploadString(storageRef, "Debug content", "raw", {
      contentType: "text/plain",
    });

    // Get test URL
    const url = await getDownloadURL(storageRef);

    // List files for debugging (limited to 'test' folder)
    const listRef = ref(storage, "test");
    const { items } = await listAll(listRef);

    console.log("Storage upload test:", { url, path: testKey });
    console.log("Available test files:", items.length);

    return {
      testUpload: {
        url,
        path: testKey,
      },
      fileCount: items.length,
      configuration: {
        isConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      },
    };
  } catch (error) {
    console.error("Firebase Storage error:", error.message);
    return { error: error.message };
  }
};
