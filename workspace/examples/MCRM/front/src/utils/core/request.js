/**
 * Request Deduplication Utility
 * Prevents duplicate simultaneous API requests by caching in-flight requests
 *
 * To detect root causes of duplicate calls: set DEDUPE_DEBUG=true in dev
 * (e.g. in browser console or .env) and check console for "dedupe hit" logs.
 */

// In-flight request cache: key -> Promise
const inFlightRequests = new Map();

// Dev-only: log when we return a shared promise or cache hit (helps find duplicate call sites)
const DEDUPE_DEBUG = typeof window !== "undefined" && (window.__DEDUPE_DEBUG__ || (import.meta.env?.DEV && import.meta.env?.VITE_DEDUPE_DEBUG === "true"));
function logDedupeHit(key, type) {
  if (DEDUPE_DEBUG && typeof console !== "undefined" && console.debug) {
    console.debug("[dedupe hit]", type, key);
  }
}

// Request cache: key -> { data, timestamp, ttl }
const requestCache = new Map();

// Default cache TTL: 30 seconds
const DEFAULT_CACHE_TTL = 30000;

/**
 * Creates a cache key from request parameters
 */
const createCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  return `${url}?${JSON.stringify(sortedParams)}`;
};

/**
 * Checks if cached data is still valid
 */
const isCacheValid = (cacheEntry, ttl = DEFAULT_CACHE_TTL) => {
  if (!cacheEntry) return false;
  const age = Date.now() - cacheEntry.timestamp;
  return age < ttl;
};

/**
 * Deduplicates API requests - if the same request is already in flight,
 * returns the existing promise instead of making a new request
 * 
 * @param {Function} requestFn - The async function that makes the API request
 * @param {string} url - The API endpoint URL
 * @param {object} params - Request parameters
 * @param {object} options - Options { useCache: true, ttl: 30000, forceRefresh: false }
 * @returns {Promise} The request promise (shared if duplicate)
 */
export const deduplicateRequest = async (
  requestFn,
  url,
  params = {},
  options = {}
) => {
  const {
    useCache = true,
    ttl = DEFAULT_CACHE_TTL,
    forceRefresh = false
  } = options;

  const cacheKey = createCacheKey(url, params);

  // Check if request is already in flight
  if (inFlightRequests.has(cacheKey) && !forceRefresh) {
    logDedupeHit(cacheKey, "inFlight");
    return inFlightRequests.get(cacheKey);
  }

  // Check cache if not forcing refresh
  if (useCache && !forceRefresh && requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey);
    if (isCacheValid(cached, ttl)) {
      logDedupeHit(cacheKey, "cache");
      return Promise.resolve(cached.data);
    }
    // Remove stale cache
    requestCache.delete(cacheKey);
  }

  // Create new request promise
  const requestPromise = requestFn()
    .then((data) => {
      // Cache successful response
      if (useCache) {
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl
        });
      }
      // Remove from in-flight after a short delay to allow other components to reuse
      setTimeout(() => {
        inFlightRequests.delete(cacheKey);
      }, 100);
      return data;
    })
    .catch((error) => {
      // Remove from in-flight on error
      inFlightRequests.delete(cacheKey);
      throw error;
    });

  // Store in-flight request
  inFlightRequests.set(cacheKey, requestPromise);

  return requestPromise;
};

/**
 * Clears the request cache
 */
export const clearRequestCache = () => {
  requestCache.clear();
  inFlightRequests.clear();
};

/**
 * Clears cached requests for a specific URL pattern
 */
export const clearCacheForUrl = (urlPattern) => {
  for (const key of requestCache.keys()) {
    if (key.startsWith(urlPattern)) {
      requestCache.delete(key);
    }
  }
  for (const key of inFlightRequests.keys()) {
    if (key.startsWith(urlPattern)) {
      inFlightRequests.delete(key);
    }
  }
};

/**
 * Invalidate cached GETs for service tickets and hub scan (after mutations or before forced refresh).
 * Keys are prefix-matched (e.g. /api/tickets, /api/tickets/counts, /api/tickets/123, /api/hub/scan/...).
 */
export const invalidateServiceDataCaches = () => {
  clearCacheForUrl("/api/tickets");
  clearCacheForUrl("/api/hub");
};

/**
 * Gets cache statistics (for debugging)
 */
export const getCacheStats = () => {
  return {
    inFlight: inFlightRequests.size,
    cached: requestCache.size,
    inFlightKeys: Array.from(inFlightRequests.keys()),
    cachedKeys: Array.from(requestCache.keys())
  };
};

