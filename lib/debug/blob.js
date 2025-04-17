/**
 * Vercel Blob Storage debugging utilities
 */

import { put, get, list } from "@vercel/blob";
import { alertOnAnomaly } from "./index";

class BlobDebugger {
  constructor() {
    this.isDebugEnabled = false;
    this.operations = [];
    this.operationsMaxSize = 50;
    this.isConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;
  }

  // Enable debugging
  enableDebug() {
    this.isDebugEnabled = true;
    console.log("Vercel Blob debugging enabled");

    // Check if Blob storage is configured
    if (!this.isConfigured) {
      console.warn(
        "Vercel Blob storage not configured (BLOB_READ_WRITE_TOKEN missing)"
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
          "Vercel Blob is not configured (BLOB_READ_WRITE_TOKEN missing)",
      };
    }

    try {
      // Try a basic operation to test connectivity
      const testKey = `debug/test-connection-${Date.now()}.txt`;
      const testContent = `Connection test at ${new Date().toISOString()}`;

      // Upload test file
      const { url } = await put(testKey, testContent, {
        access: "public",
        contentType: "text/plain",
        addRandomSuffix: false,
      });

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
        message: "Vercel Blob storage is connected and operational",
        testUrl: url,
      };
    } catch (error) {
      this.trackOperation("checkConnection", {
        action: "put",
        error: error.message,
      });

      console.error("Blob connection check failed:", error);
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
      throw new Error("Vercel Blob is not configured");
    }

    try {
      const startTime = Date.now();
      const result = await list(options);
      const duration = Date.now() - startTime;

      this.trackOperation("listBlobs", {
        action: "list",
        options,
        count: result.blobs.length,
        duration,
      });

      if (this.isDebugEnabled) {
        console.log(`Listed ${result.blobs.length} blobs in ${duration}ms`);
      }

      return result;
    } catch (error) {
      this.trackOperation("listBlobs", {
        action: "list",
        options,
        error: error.message,
      });

      console.error("Failed to list blobs:", error);
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
      console.log("Blob operation:", operation);
    }

    // Alert on errors
    if (details.error) {
      alertOnAnomaly({
        type: "blobOperation",
        operation: source,
        error: details.error,
        message: `Blob operation ${source} failed: ${details.error}`,
      });
    }

    return operation;
  }

  // Debug blob integrity
  async checkBlobIntegrity(blobPath) {
    if (!this.isConfigured) {
      throw new Error("Vercel Blob is not configured");
    }

    try {
      const anomalies = [];

      // Try to get the blob
      const blob = await get(blobPath);

      if (!blob) {
        anomalies.push("Blob not found");
        return { exists: false, anomalies };
      }

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

      if (expectedContentType && blob.contentType !== expectedContentType) {
        anomalies.push(
          `Content type mismatch: expected ${expectedContentType}, got ${blob.contentType}`
        );
      }

      // Check for zero-byte files
      if (blob.size === 0) {
        anomalies.push("Zero-byte blob detected");
      }

      this.trackOperation("checkIntegrity", {
        blobPath,
        size: blob.size,
        contentType: blob.contentType,
        anomalies,
      });

      return {
        exists: true,
        blob,
        anomalies,
      };
    } catch (error) {
      this.trackOperation("checkIntegrity", {
        blobPath,
        error: error.message,
      });

      console.error(`Failed to check integrity of blob ${blobPath}:`, error);
      return {
        exists: false,
        error: error.message,
        anomalies: ["Error accessing blob"],
      };
    }
  }
}

// Export singleton instance
export const blobDebug = new BlobDebugger();

// Debug Vercel Blob operations
export const debugBlobStorage = async () => {
  try {
    // Test blob connectivity
    const testUpload = await put("test-debug.txt", "Debug content", {
      access: "public",
    });
    console.log("Blob upload test:", testUpload);

    // List blobs for debugging
    const { blobs } = await list();
    console.log("Available blobs:", blobs);

    return {
      testUpload,
      blobCount: blobs.length,
      configuration: {
        isConfigured: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
    };
  } catch (error) {
    console.error("Blob storage error:", error.message);
    return { error: error.message };
  }
};
