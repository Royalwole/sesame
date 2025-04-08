import NodeCache from 'node-cache';

// Create a server-side in-memory cache
// For production, consider Redis or other distributed cache
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  maxKeys: 1000, // Maximum number of keys to prevent memory leaks
});

/**
 * Cache middleware for API responses
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Optional function to generate cache key
 */
export function withCache(ttl = 300, keyGenerator) {
  return async (req, handler) => {
    // Skip cache for non-GET methods
    if (req.method !== 'GET') {
      return handler(req);
    }
    
    try {
      // Generate cache key based on URL or custom function
      const key = keyGenerator 
        ? keyGenerator(req) 
        : `${req.url}`;
        
      // Check if we have a cached response
      const cachedData = cache.get(key);
      if (cachedData) {
        console.log(`[Cache] HIT: ${key}`);
        return new Response(JSON.stringify(cachedData), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
          },
        });
      }
      
      console.log(`[Cache] MISS: ${key}`);
      
      // Get response from handler
      const response = await handler(req);
      
      // Only cache success responses
      if (response.ok) {
        const responseData = await response.json();
        
        // Store in cache
        cache.set(key, responseData, ttl);
        
        // Return a new response with cache headers
        return new Response(JSON.stringify(responseData), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
            'Cache-Control': `public, max-age=${ttl}`,
          },
          status: response.status,
          statusText: response.statusText,
        });
      }
      
      return response;
    } catch (error) {
      console.error('[Cache] Error:', error);
      return handler(req);
    }
  };
}

/**
 * Invalidate cache entries by prefix
 */
export function invalidateCache(keyPrefix) {
  const keys = cache.keys();
  const invalidatedKeys = [];
  
  keys.forEach(key => {
    if (key.startsWith(keyPrefix)) {
      cache.del(key);
      invalidatedKeys.push(key);
    }
  });
  
  return invalidatedKeys;
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
}
