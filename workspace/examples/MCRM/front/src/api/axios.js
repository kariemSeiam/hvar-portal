// src/api/axios.js
import axios from 'axios';
import { getCurrentConfig, FEATURES, ERROR_MESSAGES, debug } from '../config/environment';
import { loadAuthSession, clearAuthSession } from '../utils/core/authSession';

// Get environment-specific configuration
const apiConfig = getCurrentConfig();

// Determine baseURL from centralized config
// Supports both relative URLs (for same-domain) and absolute URLs (for external API)
const getBaseURL = () => {
  // Get baseURL from centralized config (reads from VITE_APP_API_URL env variable)
  const baseURL = apiConfig.baseURL;
  
  // Log baseURL in development for debugging
  if (import.meta.env.DEV && FEATURES.enableLogging) {
    debug.log(`API Base URL: ${baseURL || '(relative - same domain)'}`);
  }
  
  return baseURL;
};

// Create optimized axios instance
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor for logging, auth headers, and error handling
axiosInstance.interceptors.request.use(
  config => {
    // Add JWT Bearer token for backend auth
    try {
      const data = loadAuthSession();
      if (data?.token) {
        config.headers['Authorization'] = 'Bearer ' + data.token;
      }
    } catch (_) {}

    // Handle absolute URLs if baseURL is set to external API
    // If baseURL is empty (relative), all URLs should be relative
    const fullUrl = config.url || '';
    const baseURL = config.baseURL || '';
    
    // If baseURL is empty and URL is absolute, convert to relative
    // This ensures compatibility with Vite proxy in development
    if (!baseURL && (fullUrl.startsWith('http://') || fullUrl.startsWith('https://'))) {
      try {
        const urlObj = new URL(fullUrl);
        config.url = urlObj.pathname + urlObj.search;
        if (import.meta.env.DEV && FEATURES.enableLogging) {
          debug.log(`Converted absolute URL to relative: ${config.url}`);
        }
      } catch (e) {
        debug.error('Failed to parse URL:', fullUrl);
      }
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    // Log requests based on environment config
    if (FEATURES.enableLogging) {
      debug.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  error => {
    debug.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for unified error handling
axiosInstance.interceptors.response.use(
  response => {
    // Log response time based on environment config
    if (FEATURES.enableLogging && response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      debug.log(`API Response: ${response.config.url} (${duration}ms)`);
    }
    
    return response;
  },
  error => {
    // Skip logging for canceled requests (expected on unmount/navigation)
    const isCanceled = error.code === 'ERR_CANCELED' || error.message === 'canceled';
    if (FEATURES.enableLogging && !isCanceled) {
      debug.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    
    // Transform common errors to user-friendly messages
    if (error.code === 'ECONNABORTED') {
      error.userMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
    } else if (error.code === 'ERR_NETWORK') {
      error.userMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.response?.status === 404) {
      error.userMessage = ERROR_MESSAGES.NOT_FOUND;
    } else if (error.response?.status === 500) {
      error.userMessage = ERROR_MESSAGES.SERVER_ERROR;
    } else if (error.message?.includes('Failed to convert value to \'Response\'')) {
      // Handle service worker response conversion errors
      error.userMessage = ERROR_MESSAGES.NETWORK_ERROR;
      debug.warn('Service Worker Response Error:', error.message);
    }
    
    // Handle 401 — token expired or invalid, force logout
    if (error.response?.status === 401) {
      clearAuthSession();
      window.location.href = '/login';
      return new Promise(() => {}); // prevent further processing
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;