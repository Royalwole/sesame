// Firebase Storage diagnostic endpoint
// This replaces the previous Vercel Blob diagnostic since we've migrated to Firebase Storage

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Check if Firebase Admin SDK is installed
    let packageCheck;
    let firebaseAdmin = null;
    let isFirebaseConfigured = false;
    let checkFirebaseConnection = async () => ({
      isConnected: false,
      status: "error",
      message: "Module not available",
    });

    try {
      // Try importing Firebase Admin
      firebaseAdmin = await import("firebase-admin").catch(() => null);
      packageCheck = { installed: !!firebaseAdmin };

      // Check if we have a Firebase config
      isFirebaseConfigured =
        !!process.env.FIREBASE_PROJECT_ID &&
        !!process.env.FIREBASE_CLIENT_EMAIL &&
        !!process.env.FIREBASE_PRIVATE_KEY;

      // Dynamic import of firebase config utility if it exists
      try {
        const firebaseUtils = await import(
          "../../../lib/firebase-config"
        ).catch(() => null);
        if (firebaseUtils && firebaseUtils.checkFirebaseConnection) {
          checkFirebaseConnection = firebaseUtils.checkFirebaseConnection;
        }
      } catch (err) {
        console.warn("Firebase config utilities not available:", err.message);
      }
    } catch (err) {
      packageCheck = {
        installed: false,
        error: err.message,
        recommendation: "Run 'npm install firebase-admin'",
      };
    }

    // Get configuration status
    const configStatus = {
      isConfigured: isFirebaseConfigured,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      environment: process.env.NODE_ENV,
    };

    // Check connection if possible
    let connectionStatus;
    try {
      connectionStatus = await checkFirebaseConnection();
    } catch (error) {
      connectionStatus = {
        isConnected: false,
        status: "error",
        message: `Connection check failed: ${error.message}`,
      };
    }

    // Diagnostic recommendations
    let recommendations = [];
    if (!packageCheck.installed) {
      recommendations.push(
        "Install the Firebase Admin SDK with 'npm install firebase-admin'"
      );
    }
    if (!configStatus.hasProjectId) {
      recommendations.push("Add FIREBASE_PROJECT_ID to your .env.local file");
    }
    if (!configStatus.hasClientEmail) {
      recommendations.push("Add FIREBASE_CLIENT_EMAIL to your .env.local file");
    }
    if (!configStatus.hasPrivateKey) {
      recommendations.push("Add FIREBASE_PRIVATE_KEY to your .env.local file");
    }
    if (connectionStatus.status === "error") {
      recommendations.push("Verify your Firebase credentials are valid");
      recommendations.push("Ensure proper permissions for the service account");
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostic: {
        packageStatus: packageCheck,
        configStatus,
        connectionStatus,
        recommendations:
          recommendations.length > 0 ? recommendations : ["No issues detected"],
        nextSteps: !configStatus.isConfigured
          ? "Configure Firebase Storage with valid credentials"
          : connectionStatus.isConnected
            ? "Your Firebase Storage setup appears to be working correctly"
            : "Fix connection issues based on recommendations",
      },
    });
  } catch (error) {
    console.error("Firebase Storage diagnostic API error:", error);
    return res.status(500).json({
      success: false,
      error: `Diagnostic failed: ${error.message}`,
      type: error.name,
      timestamp: new Date().toISOString(),
    });
  }
}
