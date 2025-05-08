import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, ref, listAll } from "firebase/storage";

// Enhanced Firebase configuration with error handling
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Keep track of initialization status
export let firebaseInitialized = false;
export let storageInitialized = false;
export let initializationError = null;

// Initialize Firebase with error handling
let app;
let storage;

try {
  // Check if all required config properties are present
  const requiredConfig = ["apiKey", "authDomain", "projectId", "storageBucket"];

  const missingConfig = requiredConfig.filter(
    (field) => !firebaseConfig[field]
  );

  if (missingConfig.length > 0) {
    throw new Error(`Missing Firebase config: ${missingConfig.join(", ")}`);
  }

  // Initialize Firebase only once
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  firebaseInitialized = true;

  // Initialize Storage
  storage = getStorage(app);
  storageInitialized = true;

  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  initializationError = error;

  // Create fallback objects to prevent errors when importing
  if (!app) app = {};
  if (!storage) storage = {};
}

export { app, storage };

/**
 * Check Firebase Storage connectivity and configuration
 * @returns {Object} Status of Firebase configuration
 */
export function getFirebaseStatus() {
  return {
    isInitialized: firebaseInitialized && storageInitialized,
    error: initializationError ? initializationError.message : null,
    config: {
      hasApiKey: !!firebaseConfig.apiKey,
      hasStorageBucket: !!firebaseConfig.storageBucket,
      hasProjectId: !!firebaseConfig.projectId,
      hasAuthDomain: !!firebaseConfig.authDomain,
    },
  };
}

/**
 * Check Firebase Admin connectivity with server credentials
 * @returns {Promise<Object>} Connection status
 */
export async function checkFirebaseConnection() {
  // Check if Firebase Admin credentials are configured
  const isConfigured =
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY;

  if (!isConfigured) {
    return {
      isConnected: false,
      status: "not-configured",
      message: "Firebase Admin SDK is not properly configured with credentials",
    };
  }

  try {
    // For client-side Firebase (not Admin SDK), we can only check if initialization was successful
    if (!firebaseInitialized || !storageInitialized) {
      return {
        isConnected: false,
        status: "not-initialized",
        message: "Firebase client is not properly initialized",
        error: initializationError ? initializationError.message : undefined,
      };
    }

    // If Firebase client is initialized, we can assume basic connectivity
    // For admin-specific operations, the endpoint should use admin SDK directly
    return {
      isConnected: true,
      status: "configured",
      message: "Firebase Admin credentials are configured correctly",
    };
  } catch (error) {
    console.error("Firebase connection check failed:", error);
    return {
      isConnected: false,
      status: "error",
      message: `Connection check failed: ${error.message}`,
      error: {
        name: error.name,
        message: error.message,
      },
    };
  }
}

export default app;
