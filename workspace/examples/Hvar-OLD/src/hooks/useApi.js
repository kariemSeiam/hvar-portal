import { useState, useEffect, useCallback, useRef } from 'react';
import { API_CONFIG } from '../constants';

/**
 * Custom hook for making API calls with loading states and error handling
 */
export const useApi = (initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const retryCountRef = useRef(0);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Clear specific cache entry
  const clearCacheEntry = useCallback((key) => {
    cacheRef.current.delete(key);
  }, []);

  // Make API request
  const request = useCallback(async (
    url,
    options = {},
    {
      useCache = false,
      cacheKey = null,
      cacheTimeout = 5 * 60 * 1000, // 5 minutes
      retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
      retryDelay = 1000,
      transformResponse = null,
      onSuccess = null,
      onError = null,
    } = {}
  ) => {
    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Check cache first
    if (useCache && cacheKey) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        setData(cached.data);
        setLastUpdated(cached.timestamp);
        return { success: true, data: cached.data, fromCache: true };
      }
    }

    setLoading(true);
    setError(null);
    retryCountRef.current = 0;

    const makeRequest = async (attempt = 0) => {
      try {
        const defaultOptions = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: abortControllerRef.current.signal,
          timeout: API_CONFIG.TIMEOUT,
        };

        const finalOptions = { ...defaultOptions, ...options };

        // Add authentication token if available
        const token = localStorage.getItem('hvar_auth_token');
        if (token) {
          finalOptions.headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, finalOptions);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        let responseData = await response.json();

        // Transform response if provided
        if (transformResponse) {
          responseData = transformResponse(responseData);
        }

        // Cache the response
        if (useCache && cacheKey) {
          cacheRef.current.set(cacheKey, {
            data: responseData,
            timestamp: Date.now(),
          });
        }

        setData(responseData);
        setLastUpdated(Date.now());
        setLoading(false);

        // Call success callback
        if (onSuccess) {
          onSuccess(responseData);
        }

        return { success: true, data: responseData };

      } catch (err) {
        // Don't retry if request was aborted
        if (err.name === 'AbortError') {
          setLoading(false);
          return { success: false, error: 'Request cancelled' };
        }

        // Retry logic
        if (attempt < retryAttempts && retryCountRef.current < retryAttempts) {
          retryCountRef.current++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          return makeRequest(attempt + 1);
        }

        setError(err.message);
        setLoading(false);

        // Call error callback
        if (onError) {
          onError(err);
        }

        return { success: false, error: err.message };
      }
    };

    return makeRequest();
  }, []);

  // GET request
  const get = useCallback((url, options = {}) => {
    return request(url, { method: 'GET', ...options });
  }, [request]);

  // POST request
  const post = useCallback((url, data, options = {}) => {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }, [request]);

  // PUT request
  const put = useCallback((url, data, options = {}) => {
    return request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }, [request]);

  // PATCH request
  const patch = useCallback((url, data, options = {}) => {
    return request(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }, [request]);

  // DELETE request
  const del = useCallback((url, options = {}) => {
    return request(url, { method: 'DELETE', ...options });
  }, [request]);

  // Abort current request
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setLastUpdated(null);
    retryCountRef.current = 0;
  }, [initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    abort,
    reset,
    clearCache,
    clearCacheEntry,
  };
};

/**
 * Hook for making API calls with automatic retry and exponential backoff
 */
export const useApiWithRetry = (initialData = null) => {
  const api = useApi(initialData);
  const [retryCount, setRetryCount] = useState(0);

  const requestWithRetry = useCallback(async (
    url,
    options = {},
    retryConfig = {}
  ) => {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      retryCondition = (error) => {
        // Retry on network errors and 5xx server errors
        return error.includes('Network') || error.includes('500') || error.includes('502') || error.includes('503');
      },
    } = retryConfig;

    let lastError = null;
    let delay = baseDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await api.request(url, options);
        if (result.success) {
          setRetryCount(0);
          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = error.message;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) break;

      // Check if we should retry based on error condition
      if (!retryCondition(lastError)) break;

      setRetryCount(attempt + 1);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }

    // If we get here, all retries failed
    api.setError(lastError);
    return { success: false, error: lastError };
  }, [api]);

  return {
    ...api,
    requestWithRetry,
    retryCount,
  };
};

/**
 * Hook for making API calls with optimistic updates
 */
export const useOptimisticApi = (initialData = null) => {
  const api = useApi(initialData);
  const [optimisticData, setOptimisticData] = useState(null);

  const optimisticUpdate = useCallback(async (
    url,
    data,
    options = {},
    {
      optimisticTransform = null,
      rollbackOnError = true,
      onOptimisticUpdate = null,
    } = {}
  ) => {
    // Store current data for potential rollback
    const currentData = api.data;

    // Apply optimistic update
    if (optimisticTransform) {
      const newData = optimisticTransform(currentData, data);
      setOptimisticData(newData);
      if (onOptimisticUpdate) {
        onOptimisticUpdate(newData);
      }
    }

    try {
      const result = await api.post(url, data, options);
      
      if (result.success) {
        setOptimisticData(null);
        return result;
      } else {
        // Rollback on error
        if (rollbackOnError) {
          setOptimisticData(null);
          api.setData(currentData);
        }
        return result;
      }
    } catch (error) {
      // Rollback on error
      if (rollbackOnError) {
        setOptimisticData(null);
        api.setData(currentData);
      }
      throw error;
    }
  }, [api]);

  return {
    ...api,
    optimisticUpdate,
    optimisticData,
    displayData: optimisticData || api.data,
  };
};

/**
 * Hook for making API calls with polling
 */
export const usePollingApi = (initialData = null) => {
  const api = useApi(initialData);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);

  const startPolling = useCallback((
    url,
    options = {},
    {
      interval = 5000, // 5 seconds
      maxAttempts = null,
      condition = null, // Stop polling when condition returns true
      onPoll = null,
    } = {}
  ) => {
    if (isPolling) return;

    setIsPolling(true);
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await api.get(url, options);
        
        if (onPoll) {
          onPoll(result);
        }

        // Check if we should stop polling
        if (maxAttempts && attempts >= maxAttempts) {
          stopPolling();
          return;
        }

        if (condition && condition(result)) {
          stopPolling();
          return;
        }

        attempts++;
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling even on error
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [api, isPolling]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...api,
    startPolling,
    stopPolling,
    isPolling,
  };
};

/**
 * Hook for making API calls with infinite scroll
 */
export const useInfiniteApi = (initialData = []) => {
  const api = useApi(initialData);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async (
    url,
    options = {},
    {
      pageParam = 'page',
      limitParam = 'limit',
      limit = 20,
      hasMoreCondition = (data, response) => {
        // Default condition: check if we got fewer items than requested
        return Array.isArray(data) && data.length === limit;
      },
      transformData = (data) => data,
    } = {}
  ) => {
    if (!hasMore || api.loading) return;

    const params = new URLSearchParams(options.params || {});
    params.set(pageParam, page.toString());
    params.set(limitParam, limit.toString());

    const result = await api.get(`${url}?${params.toString()}`, options);

    if (result.success) {
      const transformedData = transformData(result.data);
      
      if (page === 1) {
        api.setData(transformedData);
      } else {
        api.setData(prev => [...prev, ...transformedData]);
      }

      setHasMore(hasMoreCondition(transformedData, result));
      setPage(prev => prev + 1);
    }

    return result;
  }, [api, hasMore, page]);

  const reset = useCallback(() => {
    api.reset();
    setHasMore(true);
    setPage(1);
  }, [api]);

  return {
    ...api,
    loadMore,
    hasMore,
    page,
    reset,
  };
}; 