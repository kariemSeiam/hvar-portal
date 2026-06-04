/**
 * Environment Configuration
 * Centralized configuration for different environments
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Get API URL based on environment mode
// Production: VITE_APP_API_URL (required)
// Development: VITE_APP_API_URL_DEV (required)
const getApiBaseURL = () => {
  if (isDevelopment) {
    // Development: VITE_APP_API_URL_DEV or local Flask (run.py default PORT=5050)
    return import.meta.env.VITE_APP_API_URL_DEV || 'http://127.0.0.1:5050';
  }
  // Production mode: use VITE_APP_API_URL
  return import.meta.env.VITE_APP_API_URL || 'https://mcrm.hvarstore.com';
};

// Single API Configuration
// Timeout and other settings can vary by mode, but baseURL is determined by env vars
const apiBaseURL = getApiBaseURL();

// Verbose env dump: set VITE_DEBUG_VERBOSE=true in .env (optional)
if (isDevelopment && import.meta.env.VITE_DEBUG_VERBOSE === 'true') {
  console.log('🔧 Environment Configuration:', {
    mode: isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION',
    VITE_APP_API_URL_DEV: import.meta.env.VITE_APP_API_URL_DEV,
    VITE_APP_API_URL: import.meta.env.VITE_APP_API_URL,
    resolvedBaseURL: apiBaseURL
  });
}

export const API_CONFIG = {
  baseURL: apiBaseURL,
  timeout: isProduction ? 15000 : 30000,
  retryAttempts: isProduction ? 3 : 2,
  cacheDuration: isProduction ? 60000 : 30000,
  /** Per-request HTTP logs (axios). Off by default; set VITE_DEBUG_HTTP=true to enable. */
  enableLogging: import.meta.env.VITE_DEBUG_HTTP === 'true',
};

// Get current environment config
export const getCurrentConfig = () => {
  return API_CONFIG;
};

// Feature flags
export const FEATURES = {
  // Enable/disable features based on environment
  enableCaching: true,
  enableLogging: getCurrentConfig().enableLogging,
  enablePerformanceMonitoring: isDevelopment,
  enableErrorReporting: isProduction,
  enableAnalytics: isProduction,

  // Scanner features
  enableQRScanner: true,
  enableManualInput: true,
  enableAutoScan: true,

  // Order management features
  enableBulkActions: true,
  enableSearch: true,
  enableTimeline: true,
  enableMaintenanceHistory: true,
};

// Performance settings
export const PERFORMANCE = {
  // Debounce settings
  searchDebounce: 300,
  scanDebounce: 1000,

  // Cache settings
  maxCacheSize: 100,
  cacheCleanupInterval: 60000, // 1 minute

  // Request settings
  maxConcurrentRequests: 5,
  requestTimeout: getCurrentConfig().timeout,

  // UI settings
  animationDuration: 200,
  loadingTimeout: 10000,
};

// Error messages in Arabic
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "خطأ في الاتصال بالشبكة - تحقق من اتصالك بالإنترنت",
  TIMEOUT_ERROR: "انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى",
  SERVER_ERROR: "خطأ في الخادم - يرجى المحاولة مرة أخرى",
  NOT_FOUND: "المورد غير موجود",
  UNAUTHORIZED: "خطأ في المصادقة - تحقق من إعدادات API",
  VALIDATION_ERROR: "بيانات الطلب غير صحيحة",
  UNKNOWN_ERROR: "خطأ غير معروف - يرجى المحاولة مرة أخرى",
};

// Backend endpoints used across the app
// NOTE: Only authorized endpoints from api_endpoints.md are included
export const API_ENDPOINTS = {
  // Bosta API endpoints (authorized)
  bosta: {
    search: "/api/bosta/search",
    order: (trackingNumber) => `/api/bosta/order/${trackingNumber}`,
    customerOrders: (phoneNumber) =>
      `/api/bosta/customer/${phoneNumber}/orders`,
    syncCustomer: (phoneNumber) => `/api/bosta/customer/${phoneNumber}/sync`,
    health: "/api/bosta/health",
  },

  // Customers API endpoints (authorized)
  customers: {
    list: "/api/customers/",
    create: "/api/customers/",
    search: "/api/customers/search",
    getById: (id) => `/api/customers/${id}`,
    update: (id) => `/api/customers/${id}`,
  },

  // Hub API endpoints (authorized)
  hub: {
    scan: (trackingNumber) => `/api/hub/scan/${trackingNumber}`,
    receive: "/api/hub/scan/receive",
    dispatch: "/api/hub/scan/dispatch",
    workshopQueue: "/api/hub/queues/workshop",
    pendingDispatch: "/api/hub/queues/pending-dispatch",
    completeWorkshop: "/api/hub/workshop/complete",
  },

  // Tickets API endpoints (authorized)
  tickets: {
    create: "/api/tickets/create",
    list: "/api/tickets/",
    getById: (id) => `/api/tickets/${id}`,
    confirm: (id) => `/api/tickets/${id}/confirm`,
    cancel: (id) => `/api/tickets/${id}/cancel`,
    history: (id) => `/api/tickets/${id}/history`,
    actions: (id) => `/api/tickets/${id}/actions`,
    action: (id) => `/api/tickets/${id}/action`,
  },

  // Stock API endpoints (authorized)
  stock: {
    items: "/api/stock/items",
    itemById: (id) => `/api/stock/items/${id}`,
    updateItem: (id) => `/api/stock/items/${id}`,
    adjustItem: (id) => `/api/stock/items/${id}/adjust`,
    addComponent: (productId) => `/api/stock/items/${productId}/components`,
    removeComponent: (productId, componentId) =>
      `/api/stock/items/${productId}/components/${componentId}`,
    manual: "/api/stock/manual",
    movements: "/api/stock/movements",
  },
};

// Success messages in Arabic
export const SUCCESS_MESSAGES = {
  ORDER_SCANNED: "تم مسح الطلب بنجاح",
  ORDER_UPDATED: "تم تحديث الطلب بنجاح",
  ORDER_CREATED: "تم إنشاء الطلب بنجاح",
  DATA_LOADED: "تم جلب البيانات بنجاح",
  CACHE_CLEARED: "تم مسح الذاكرة المؤقتة",
};

// Validation rules
export const VALIDATION = {
  // Tracking number validation
  trackingNumber: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Za-z0-9\-_]+$/,
    invalidPatterns: [
      /^[0-9]{1,2}$/, // Single or double digits
      /^[a-zA-Z]{1,2}$/, // Single or double letters
      /^[\\\/\-_]{1,}$/, // Only special characters
      /^[0-9]{1,2}[a-zA-Z]{1,2}$/, // Short alphanumeric
    ],
  },

  // Phone number validation
  phoneNumber: {
    pattern: /^[0-9+\-\s()]+$/,
    minLength: 8,
    maxLength: 15,
  },

  // Notes validation
  notes: {
    maxLength: 500,
  },
};

// Status mappings
export const STATUS_MAPPING = {
  // Backend to frontend status mapping
  backendToFrontend: {
    in_maintenance: "inMaintenance",
    returned: "returns",
  },

  // Frontend to backend status mapping
  frontendToBackend: {
    inMaintenance: "in_maintenance",
    returns: "returned",
  },

  // Status colors
  colors: {
    received: "blue",
    inMaintenance: "amber",
    completed: "green",
    failed: "red",
    sending: "purple",
    returns: "gray",
  },
};

// Export current environment info
export const ENV_INFO = {
  isDevelopment,
  isProduction,
  mode: import.meta.env.MODE,
  config: getCurrentConfig(),
};

// Debug utilities - automatically disabled in production
export const debug = {
  log: (message, data) => {
    // Double check: both FEATURES.enableLogging and production mode
    if (FEATURES.enableLogging && !import.meta.env.PROD) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  error: (message, error) => {
    // Always log errors, even in production (for debugging)
    console.error(`[ERROR] ${message}`, error);
  },

  warn: (message, data) => {
    if (FEATURES.enableLogging && !import.meta.env.PROD) {
      console.warn(`[WARN] ${message}`, data);
    }
  },

  info: (message, data) => {
    if (FEATURES.enableLogging && !import.meta.env.PROD) {
      console.info(`[INFO] ${message}`, data);
    }
  },
};
