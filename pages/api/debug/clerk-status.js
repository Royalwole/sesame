import { getAuth } from "@clerk/nextjs/server";

export default function handler(req, res) {
  // Get auth data from request
  const auth = getAuth(req);

  // Return status info
  res.status(200).json({
    authenticated: !!auth?.userId,
    userId: auth?.userId,
    sessionId: auth?.sessionId,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    clerkConfig: {
      publishableKeyExists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKeyExists: !!process.env.CLERK_SECRET_KEY,
      sessionLifetime: process.env.CLERK_SESSION_TOKEN_LIFETIME || "default",
    },
  });
}
