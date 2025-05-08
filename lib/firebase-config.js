import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

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

export default app;
