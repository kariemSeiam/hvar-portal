// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://192.168.1.202:5000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Application Routes
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  
  // Main Pages
  DASHBOARD: '/',
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: '/customers/:phone',
  AI_CUSTOMER: '/ai-customers/:phone',
  
  // Orders
  ORDERS: '/orders',
  
  // Stock Management
  STOCK_DASHBOARD: '/stock',
  STOCK_PRODUCTS: '/stock/products',
  STOCK_ANALYTICS: '/stock/analytics',
  STOCK_MOVEMENTS: '/stock/movements',
  
  // Customer Service
  CUSTOMER_SERVICE: '/customer-service',
  SERVICE_REQUESTS: '/customer-service/requests',
  SERVICE_REQUEST_FORM: '/customer-service/requests/new',
  SERVICE_REQUEST_EDIT: '/customer-service/requests/:id/edit',
  SERVICE_REQUEST_DETAIL: '/customer-service/requests/:id',
  
  // Other Modules
  CALL_CENTER: '/call-center',
  ANALYTICS: '/analytics',
  SERVICE_ACTIONS: '/service-actions',
  MAINTENANCE: '/maintenance',
  PRODUCTS: '/products',
  HUB_SCANNING: '/hub-scanning',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  
  // Orders
  ORDERS: '/api/orders',
  ORDER_DETAILS: '/api/orders/:id',
  ORDER_STATES: '/api/orders/states/distribution',
  ORDER_ANALYTICS: '/api/orders/analytics',
  BUSINESS_CATEGORIES: '/api/orders/business/categories',
  
  // Customers
  CUSTOMERS: '/api/customers',
  CUSTOMER_DETAIL: '/api/customers/:phone',
  CUSTOMER_ORDERS: '/api/customers/:phone/orders',
  CUSTOMER_INTERACTIONS: '/api/customers/:phone/interactions',
  CUSTOMER_SEGMENTS: '/api/customers/segments',
  CUSTOMER_ANALYTICS: '/api/customers/analytics',
  
  // Products
  PRODUCTS: '/api/products',
  PRODUCT_DETAIL: '/api/products/:id',
  PRODUCT_CATEGORIES: '/api/products/categories',
  PRODUCT_INVENTORY: '/api/products/:id/inventory',
  LOW_STOCK_ALERTS: '/api/products/inventory/alerts',
  
  // Service Actions
  SERVICE_ACTIONS: '/api/service-actions',
  SERVICE_ACTION_DETAIL: '/api/service-actions/:id',
  SERVICE_ACTION_STATUS: '/api/service-actions/:id/status',
  SERVICE_ACTION_EXECUTE: '/api/service-actions/:id/execute',
  
  // Customer Service
  SERVICE_TICKETS: '/api/customer-service/tickets',
  // Team calls removed - functionality integrated into follow-ups system
  FOLLOW_UPS: '/api/customer-service/follow-ups',
  
  // Maintenance
  MAINTENANCE_CYCLES: '/api/maintenance/cycles',
  MAINTENANCE_ANALYTICS: '/api/maintenance/analytics',
  MAINTENANCE_STOCK: '/api/maintenance/stock',
  
  // Hub Scanning
  HUB_SCAN: '/api/service-actions/hub/scan',
  HUB_INSPECTION: '/api/service-actions/hub/inspection',
};

// Order States
export const ORDER_STATES = {
  DELIVERED: { code: 45, label: 'تم التوصيل', color: 'success' },
  RETURNED_BUSINESS: { code: 46, label: 'مرتجع للعمل', color: 'warning' },
  RETURNED_FULFILLED: { code: 46, label: 'مرتجع', color: 'warning' },
  TERMINATED: { code: 48, label: 'ملغي', color: 'danger' },
  PICKUP_REQUESTED: { code: 10, label: 'طلب استلام', color: 'info' },
  AT_WAREHOUSE: { code: 24, label: 'في المستودع', color: 'info' },
  LOST: { code: 100, label: 'مفقود', color: 'danger' },
  IN_TRANSIT: { code: 30, label: 'قيد النقل', color: 'info' },
  EXCEPTION: { code: 47, label: 'استثناء', color: 'danger' },
  DAMAGED: { code: 101, label: 'تالف', color: 'danger' },
};

// Business Categories
export const BUSINESS_CATEGORIES = {
  PREMIUM_HIGH: { label: 'عالي الجودة', color: 'success', minValue: 5000 },
  HIGH_VALUE: { label: 'قيمة عالية', color: 'primary', minValue: 1500, maxValue: 5000 },
  STANDARD_VALUE: { label: 'قيمة عادية', color: 'info', minValue: 500, maxValue: 1500 },
  LOW_VALUE: { label: 'قيمة منخفضة', color: 'warning', minValue: 1, maxValue: 500 },
  ZERO_COD: { label: 'بدون دفع', color: 'secondary', value: 0 },
  SMALL_REFUND: { label: 'استرداد صغير', color: 'warning', minValue: -500, maxValue: 0 },
  LARGE_REFUND: { label: 'استرداد كبير', color: 'danger', maxValue: -500 },
  MAX_VALUE: { label: 'أعلى قيمة', color: 'success', minValue: 10000 },
};

// Customer Segments
export const CUSTOMER_SEGMENTS = {
  VIP: { label: 'VIP', color: 'success', description: 'عملاء VIP' },
  CHAMPION: { label: 'Champion', color: 'primary', description: 'عملاء مميزون' },
  LOYAL: { label: 'Loyal', color: 'info', description: 'عملاء مخلصون' },
  REGULAR: { label: 'Regular', color: 'warning', description: 'عملاء عاديون' },
  RECENT: { label: 'Recent', color: 'secondary', description: 'عملاء جدد' },
  AT_RISK: { label: 'At Risk', color: 'danger', description: 'عملاء معرضون للخطر' },
};

// Service Action Types
export const SERVICE_ACTION_TYPES = {
  MAINTENANCE: { label: 'صيانة', color: 'primary' },
  REPLACEMENT: { label: 'استبدال', color: 'warning' },
  REFUND: { label: 'استرداد', color: 'danger' },
  INSPECTION: { label: 'فحص', color: 'info' },
  PICKUP: { label: 'استلام', color: 'secondary' },
};

// Service Action Statuses
export const SERVICE_ACTION_STATUSES = {
  PENDING: { label: 'في الانتظار', color: 'warning' },
  IN_PROGRESS: { label: 'قيد التنفيذ', color: 'primary' },
  COMPLETED: { label: 'مكتمل', color: 'success' },
  CANCELLED: { label: 'ملغي', color: 'danger' },
  ON_HOLD: { label: 'معلق', color: 'secondary' },
};

// Maintenance Statuses
export const MAINTENANCE_STATUSES = {
  SCHEDULED: { label: 'مجدول', color: 'info' },
  IN_PROGRESS: { label: 'قيد التنفيذ', color: 'primary' },
  COMPLETED: { label: 'مكتمل', color: 'success' },
  CANCELLED: { label: 'ملغي', color: 'danger' },
  OVERDUE: { label: 'متأخر', color: 'danger' },
};

// Stock Movement Types
export const STOCK_MOVEMENT_TYPES = {
  ALLOCATION: { label: 'تخصيص', color: 'primary' },
  USAGE: { label: 'استخدام', color: 'warning' },
  RETURN: { label: 'إرجاع', color: 'success' },
  TRANSFER: { label: 'نقل', color: 'info' },
  ADJUSTMENT: { label: 'تعديل', color: 'secondary' },
  DAMAGE: { label: 'تلف', color: 'danger' },
  LOSS: { label: 'فقدان', color: 'danger' },
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-dd HH:mm:ss',
  ISO: 'yyyy-MM-ddTHH:mm:ss.SSSZ',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'hvar_auth_token',
  USER_DATA: 'hvar_user_data',
  THEME: 'hvar_theme',
  LANGUAGE: 'hvar_language',
  SIDEBAR_COLLAPSED: 'hvar_sidebar_collapsed',
  TABLE_PREFERENCES: 'hvar_table_preferences',
  FILTER_PREFERENCES: 'hvar_filter_preferences',
};

// Theme Configuration
export const THEME_CONFIG = {
  LIGHT: {
    name: 'light',
    label: 'فاتح',
    icon: '☀️',
  },
  DARK: {
    name: 'dark',
    label: 'داكن',
    icon: '🌙',
  },
  AUTO: {
    name: 'auto',
    label: 'تلقائي',
    icon: '🔄',
  },
};

// Language Configuration
export const LANGUAGE_CONFIG = {
  AR: {
    code: 'ar',
    name: 'العربية',
    dir: 'rtl',
    flag: '🇪🇬',
  },
  EN: {
    code: 'en',
    name: 'English',
    dir: 'ltr',
    flag: '🇺🇸',
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'خطأ في الاتصال بالشبكة',
  UNAUTHORIZED: 'غير مصرح لك بالوصول',
  FORBIDDEN: 'ممنوع الوصول',
  NOT_FOUND: 'المورد غير موجود',
  SERVER_ERROR: 'خطأ في الخادم',
  VALIDATION_ERROR: 'خطأ في التحقق من البيانات',
  TIMEOUT_ERROR: 'انتهت مهلة الاتصال',
  UNKNOWN_ERROR: 'خطأ غير معروف',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'تم الإنشاء بنجاح',
  UPDATED: 'تم التحديث بنجاح',
  DELETED: 'تم الحذف بنجاح',
  SAVED: 'تم الحفظ بنجاح',
  SENT: 'تم الإرسال بنجاح',
  UPLOADED: 'تم الرفع بنجاح',
};

// Validation Rules
export const VALIDATION_RULES = {
  PHONE: {
    pattern: /^(\+20|0)?1[0125][0-9]{8}$/,
    message: 'يرجى إدخال رقم هاتف مصري صحيح',
  },
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'يرجى إدخال بريد إلكتروني صحيح',
  },
  PASSWORD: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل مع حرف كبير وصغير ورقم',
  },
  REQUIRED: {
    message: 'هذا الحقل مطلوب',
  },
  MIN_LENGTH: (min) => ({
    message: `يجب أن يكون الطول على الأقل ${min} أحرف`,
  }),
  MAX_LENGTH: (max) => ({
    message: `يجب أن يكون الطول على الأكثر ${max} أحرف`,
  }),
};

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
};

// Breakpoints
export const BREAKPOINTS = {
  XS: 480,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
};

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
}; 