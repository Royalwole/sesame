import {
  checkBlobConnection,
  getBlobConfigStatus,
  isBlobConfigured,
} from "../../../lib/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Check if Vercel Blob package is installed
    let packageCheck;
    try {
      // Try importing the package
      require("@vercel/blob");
      packageCheck = { installed: true };
    } catch (err) {
      packageCheck = {
        installed: false,
        error: err.message,
        recommendation: "Run 'npm install @vercel/blob'",
      };
    }

    // Get configuration status
    const configStatus = {
      isConfigured: isBlobConfigured(),
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      environment: process.env.NODE_ENV,
    };

    // Check connection
    const connectionStatus = await checkBlobConnection();

    // Diagnostic recommendations
    let recommendations = [];
    if (!packageCheck.installed) {
      recommendations.push(
        "Install the @vercel/blob package with 'npm install @vercel/blob'"
      );
    }
    if (!configStatus.hasToken) {
      recommendations.push("Add BLOB_READ_WRITE_TOKEN to your .env.local file");
      recommendations.push(
        "Create a Vercel Blob store with 'npx vercel blob new'"
      );
    }
    if (connectionStatus.status === "error") {
      recommendations.push("Verify your BLOB_READ_WRITE_TOKEN is valid");
      recommendations.push("Ensure proper permissions for the token");
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
          ? "Configure Vercel Blob with valid BLOB_READ_WRITE_TOKEN"
          : connectionStatus.isConnected
            ? "Your Vercel Blob setup appears to be working correctly"
            : "Fix connection issues based on recommendations",
      },
    });
  } catch (error) {
    console.error("Blob diagnostic API error:", error);
    return res.status(500).json({
      success: false,
      error: `Diagnostic failed: ${error.message}`,
      type: error.name,
      timestamp: new Date().toISOString(),
    });
  }
}
