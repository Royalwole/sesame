import { NextResponse } from 'next/server';
import LRUCache from 'lru-cache';

/**
 * Rate limiting middleware using in-memory LRU cache
 * For production, consider Redis or other persistent stores
 */
function getRateLimitConfig(opts = {}) {
  const options = {
    uniqueTokenPerInterval: 500, // Max number of unique tokens per interval
    interval: 60 * 1000, // 1 minute in milliseconds
    ...opts,
  };

  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (token, limit, timeWindow) => {
      const tokenCount = (tokenCache.get(token) || 0) + 1;
      
      // Store token with count
      tokenCache.set(token, tokenCount);
      
      // Return object with rate limit information
      const remaining = Math.max(0, limit - tokenCount);
      const success = tokenCount <= limit;
      
      return {
        success,
        limit,
        remaining,
        reset: Date.now() + timeWindow,
      };
    }
  };
}

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.limit - Max requests per window
 * @param {number} options.windowMs - Time window in ms
 */
export function createRateLimiter(options = { limit: 50, windowMs: 60 * 1000 }) {
  // Create instance with configuration
  const rateLimit = getRateLimitConfig({
    uniqueTokenPerInterval: 500,
    interval: options.windowMs,
  });

  return async function rateLimit(req) {
    try {
      // Get token from request (IP address or API key)
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 '127.0.0.1';
                 
      // Add API key support
      const apiKey = req.headers.get('x-api-key');
      const token = apiKey || ip;
      
      // Check rate limit
      const { success, limit, remaining, reset } = rateLimit.check(
        token,
        options.limit,
        options.windowMs
      );
      
      // Set rate limit headers
      const headers = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      };
      
      // Return modified response if rate limited
      if (!success) {
        return { 
          isRateLimited: true, 
          headers, 
          response: new NextResponse(
            JSON.stringify({ 
              error: 'Too many requests', 
              message: 'Please try again later' 
            }),
            { 
              status: 429, 
              headers: {
                'Content-Type': 'application/json',
                ...headers
              }
            }
          )
        };
      }
      
      // Return headers to be applied
      return { 
        isRateLimited: false, 
        headers 
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      return { isRateLimited: false, headers: {} };
    }
  };
}

// Utility: Apply rate limit response headers
export function applyRateLimitHeaders(res, headers) {
  if (!res || !headers) return res;
  
  Object.entries(headers).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  
  return res;
}
