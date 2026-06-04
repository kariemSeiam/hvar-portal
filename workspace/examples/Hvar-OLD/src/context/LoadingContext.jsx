import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { PageLoading } from '../components/ui/Loading';

/**
 * Loading Context for global loading state management
 */
const LoadingContext = createContext();

/**
 * Loading Provider Component
 */
export const LoadingProvider = ({ children }) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [loadingMessage, setLoadingMessage] = useState('جاري التحميل...');
  const [pageLoading, setPageLoading] = useState(false);
  
  const loadingTimeouts = useRef({});
  const loadingCounters = useRef({});

  /**
   * Start global loading
   */
  const startGlobalLoading = useCallback((message = 'جاري التحميل...') => {
    setGlobalLoading(true);
    setLoadingMessage(message);
  }, []);

  /**
   * Stop global loading
   */
  const stopGlobalLoading = useCallback(() => {
    setGlobalLoading(false);
    setLoadingMessage('جاري التحميل...');
  }, []);

  /**
   * Start page loading
   */
  const startPageLoading = useCallback((message = 'جاري تحميل الصفحة...') => {
    setPageLoading(true);
    setLoadingMessage(message);
  }, []);

  /**
   * Stop page loading
   */
  const stopPageLoading = useCallback(() => {
    setPageLoading(false);
    setLoadingMessage('جاري التحميل...');
  }, []);

  /**
   * Start loading for a specific key/component
   */
  const startLoading = useCallback((key, message = null) => {
    // Clear any existing timeout for this key
    if (loadingTimeouts.current[key]) {
      clearTimeout(loadingTimeouts.current[key]);
    }

    // Increment counter for this key
    loadingCounters.current[key] = (loadingCounters.current[key] || 0) + 1;

    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        loading: true,
        message: message || 'جاري التحميل...',
        count: loadingCounters.current[key],
      }
    }));
  }, []);

  /**
   * Stop loading for a specific key/component
   */
  const stopLoading = useCallback((key, delay = 0) => {
    const executeStop = () => {
      // Decrement counter
      if (loadingCounters.current[key]) {
        loadingCounters.current[key] -= 1;
      }

      // Only stop if counter reaches 0 (no more pending requests)
      if (!loadingCounters.current[key] || loadingCounters.current[key] <= 0) {
        loadingCounters.current[key] = 0;
        setLoadingStates(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }
    };

    if (delay > 0) {
      loadingTimeouts.current[key] = setTimeout(executeStop, delay);
    } else {
      executeStop();
    }
  }, []);

  /**
   * Check if a specific key is loading
   */
  const isLoading = useCallback((key) => {
    return Boolean(loadingStates[key]?.loading);
  }, [loadingStates]);

  /**
   * Get loading message for a specific key
   */
  const getLoadingMessage = useCallback((key) => {
    return loadingStates[key]?.message || 'جاري التحميل...';
  }, [loadingStates]);

  /**
   * Set loading state for multiple keys at once
   */
  const setBulkLoading = useCallback((states) => {
    Object.entries(states).forEach(([key, state]) => {
      if (state) {
        startLoading(key, typeof state === 'string' ? state : null);
      } else {
        stopLoading(key);
      }
    });
  }, [startLoading, stopLoading]);

  /**
   * Clear all loading states
   */
  const clearAllLoading = useCallback(() => {
    // Clear all timeouts
    Object.values(loadingTimeouts.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    
    // Reset all states
    loadingTimeouts.current = {};
    loadingCounters.current = {};
    setLoadingStates({});
    setGlobalLoading(false);
    setPageLoading(false);
  }, []);

  /**
   * Wrap an async function with loading state
   */
  const withLoading = useCallback((key, asyncFn, message = null) => {
    return async (...args) => {
      try {
        startLoading(key, message);
        const result = await asyncFn(...args);
        return result;
      } catch (error) {
        throw error;
      } finally {
        stopLoading(key);
      }
    };
  }, [startLoading, stopLoading]);

  /**
   * Auto-stop loading after a timeout
   */
  const startLoadingWithTimeout = useCallback((key, timeout = 30000, message = null) => {
    startLoading(key, message);
    
    const timeoutId = setTimeout(() => {
      stopLoading(key);
    }, timeout);
    
    loadingTimeouts.current[`${key}_timeout`] = timeoutId;
    
    return () => {
      clearTimeout(timeoutId);
      stopLoading(key);
    };
  }, [startLoading, stopLoading]);

  const value = {
    // Global loading state
    globalLoading,
    startGlobalLoading,
    stopGlobalLoading,
    
    // Page loading state
    pageLoading,
    startPageLoading,
    stopPageLoading,
    
    // Component-specific loading states
    loadingStates,
    startLoading,
    stopLoading,
    isLoading,
    getLoadingMessage,
    
    // Bulk operations
    setBulkLoading,
    clearAllLoading,
    
    // Utility functions
    withLoading,
    startLoadingWithTimeout,
    
    // Current loading message
    loadingMessage,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      
      {/* Global Loading Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
          <PageLoading text={loadingMessage} showLogo={false} />
        </div>
      )}
      
      {/* Page Loading */}
      {pageLoading && (
        <PageLoading text={loadingMessage} />
      )}
    </LoadingContext.Provider>
  );
};

/**
 * Hook to use loading context
 */
export const useLoading = (key = null) => {
  const context = useContext(LoadingContext);
  
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }

  // If no key provided, return the full context
  if (!key) {
    return context;
  }

  // Return key-specific methods
  return {
    loading: context.isLoading(key),
    message: context.getLoadingMessage(key),
    start: (message) => context.startLoading(key, message),
    stop: (delay) => context.stopLoading(key, delay),
    withLoading: (asyncFn, message) => context.withLoading(key, asyncFn, message),
    startWithTimeout: (timeout, message) => context.startLoadingWithTimeout(key, timeout, message),
  };
};

/**
 * HOC to wrap components with loading functionality
 */
export const withLoadingWrapper = (WrappedComponent, defaultLoadingKey) => {
  return function LoadingWrappedComponent(props) {
    const loadingKey = props.loadingKey || defaultLoadingKey || 'default';
    const loading = useLoading(loadingKey);
    
    return (
      <WrappedComponent
        {...props}
        loading={loading}
        loadingKey={loadingKey}
      />
    );
  };
};

/**
 * Hook for API calls with automatic loading management
 */
export const useLoadingAPI = (key) => {
  const loading = useLoading(key);
  
  const request = async (apiCall, loadingMessage = null) => {
    try {
      loading.start(loadingMessage);
      const result = await apiCall();
      return result;
    } catch (error) {
      throw error;
    } finally {
      loading.stop();
    }
  };

  return {
    loading: loading.loading,
    message: loading.message,
    request,
  };
};

/**
 * Hook for form submissions with loading
 */
export const useLoadingForm = (key = 'form') => {
  const loading = useLoading(key);
  
  const handleSubmit = (onSubmit, loadingMessage = 'جاري الحفظ...') => {
    return async (data) => {
      try {
        loading.start(loadingMessage);
        await onSubmit(data);
      } catch (error) {
        throw error;
      } finally {
        loading.stop();
      }
    };
  };

  return {
    loading: loading.loading,
    handleSubmit,
  };
};

/**
 * Hook for pagination with loading
 */
export const useLoadingPagination = (key = 'pagination') => {
  const loading = useLoading(key);
  const [currentPage, setCurrentPage] = useState(1);
  
  const loadPage = async (page, apiCall, loadingMessage = 'جاري تحميل البيانات...') => {
    try {
      loading.start(loadingMessage);
      const result = await apiCall(page);
      setCurrentPage(page);
      return result;
    } catch (error) {
      throw error;
    } finally {
      loading.stop();
    }
  };

  return {
    loading: loading.loading,
    currentPage,
    loadPage,
    setCurrentPage,
  };
};

export default LoadingContext; 