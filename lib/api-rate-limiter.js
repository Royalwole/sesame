/**
 * API Rate Limiter
 *
 * Simple memory-based rate limiter for API endpoints
 * In production, consider using Redis or a dedicated rate limiting service
 */

// In-memory storage for rate limit tracking
// Maps IP addresses or keys to { count, resetTime }
const limiters = new Map();

/**
 * Configure a rate limiter
 * @param {Object} options - Rate limiting options
 * @param {number} options.maxRequests - Maximum number of requests allowed in the window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {Function} options.keyGenerator - Function to generate a key from request (default: IP address)
 * @param {Function} options.handler - Function to handle rate limit exceeded
 * @returns {Function} Middleware function to apply rate limiting
 */
export function createRateLimiter({
  maxRequests = 100,
  windowMs = 60 * 1000, // 1 minute by default
  keyGenerator = (req) => req.ip || req.headers["x-forwarded-for"] || "unknown",
  handler = (req, res) =>
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    }),
}) {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Get existing rate limit data or create new
    const limiter = limiters.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Reset if window expired
    if (now > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + windowMs;
    }

    // Increment counter
    limiter.count++;
    limiters.set(key, limiter);

    // Add rate limit information to response headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - limiter.count)
    );
    res.setHeader("X-RateLimit-Reset", Math.ceil(limiter.resetTime / 1000)); // in seconds

    // Check if rate limit exceeded
    if (limiter.count > maxRequests) {
      return handler(req, res);
    }

    // Continue to the next middleware or route handler
    if (typeof next === "function") {
      next();
      return;
    }

    // If no next function (used directly in API route), return true to continue
    return true;
  };
}

/**
 * Function version of rate limiter for direct use in API routes
 * Returns true if request can proceed, false if rate limited
 */
export function checkRateLimit(req, options = {}) {
  const limiter = createRateLimiter({
    ...options,
    handler: () => false,
  });

  return limiter(req, {
    setHeader: () => {}, // No-op for function version
  });
}

/**
 * Special rate limiter for webhooks
 * More lenient than regular API endpoints, but still protects against abuse
 */
export const webhookRateLimiter = createRateLimiter({
  maxRequests: 300, // Higher limit for legitimate webhook traffic
  windowMs: 60 * 1000, // 1 minute window
  keyGenerator: (req) => {
    // Use webhook type as part of the key if available
    try {
      const type = req.body?.type || "unknown";
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
      return `webhook:${type}:${ip}`;
    } catch (e) {
      return `webhook:unknown:${req.ip || "unknown"}`;
    }
  },
});

// Export a singleton instance for common use cases
export const apiRateLimiter = createRateLimiter({});
