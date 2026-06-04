// HVAR Bosta V2 - Comprehensive API Service
const API_BASE_URL = 'http://localhost:5000/api';

// --- HELPER FUNCTIONS ---

/**
 * Handles API responses, parsing JSON and throwing errors for non-ok responses.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<any>} - The response JSON data.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
    throw new Error(errorData.error || errorData.message || 'An error occurred with the API request.');
  }
  return response.json();
};

/**
 * Creates a URL with query parameters from an object.
 * @param {string} baseUrl - The base URL.
 * @param {object} params - The query parameters object.
 * @returns {string} - The full URL with query string.
 */
const createUrlWithParams = (baseUrl, params = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        }
      });
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// --- API SERVICE ---

export const api = {
  // --- Customer Service ---
  customerService: {
    // Core Service Management
    getTickets: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/customer-service/tickets`, params)).then(handleResponse),
    getTicket: (ticketId) => fetch(`${API_BASE_URL}/customer-service/tickets/${ticketId}`).then(handleResponse),
    createTicket: (data) => fetch(`${API_BASE_URL}/customer-service/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    updateTicket: (ticketId, data) => fetch(`${API_BASE_URL}/customer-service/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Team calls removed - functionality integrated into follow-ups system
    
    // Customer Follow-ups
    getFollowUps: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/customer-service/follow-ups`, params)).then(handleResponse),
    
    // Analytics & Dashboard
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/customer-service/analytics`, params)).then(handleResponse),
    getDashboard: () => fetch(`${API_BASE_URL}/customer-service/dashboard`).then(handleResponse),
    
    // Initialization
    init: () => fetch(`${API_BASE_URL}/customer-service/init`, { method: 'POST' }).then(handleResponse),
  },

  // --- Products/Stock Management ---
  products: {
    // Core Product Management
    getProducts: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products`, params)).then(handleResponse),
    getProduct: (productId) => fetch(`${API_BASE_URL}/products/${productId}`).then(handleResponse),
    createProduct: (data) => fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    updateProduct: (productId, data) => fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    deleteProduct: (productId) => fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
    }).then(handleResponse),
    
    // Categories Management
    getCategories: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/categories`, params)).then(handleResponse),
    createCategory: (data) => fetch(`${API_BASE_URL}/products/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    updateCategory: (categoryId, data) => fetch(`${API_BASE_URL}/products/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    deleteCategory: (categoryId) => fetch(`${API_BASE_URL}/products/categories/${categoryId}`, {
      method: 'DELETE',
    }).then(handleResponse),
    
    // Stock Management
    getStockLevels: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/stock/levels`, params)).then(handleResponse),
    updateStockLevel: (productId, data) => fetch(`${API_BASE_URL}/products/${productId}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getStockMovements: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/stock/movements`, params)).then(handleResponse),
    recordStockMovement: (data) => fetch(`${API_BASE_URL}/products/stock/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Stock Alerts
    getLowStockAlerts: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/stock/alerts/low`, params)).then(handleResponse),
    getOutOfStockAlerts: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/stock/alerts/out`, params)).then(handleResponse),
    
    // Analytics & Reporting
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/analytics`, params)).then(handleResponse),
    getStockAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/stock/analytics`, params)).then(handleResponse),
    getSalesAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/sales/analytics`, params)).then(handleResponse),
    
    // Text Analytics
    analyzeProductText: (data) => fetch(`${API_BASE_URL}/products/text/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getTextAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/text/analytics`, params)).then(handleResponse),
    
    // Import/Export
    importProducts: (data) => fetch(`${API_BASE_URL}/products/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    exportProducts: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products/export`, params)).then(handleResponse),
  },

  // --- Maintenance Management ---
  maintenance: {
    // Core Maintenance Management
    getCycles: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/cycles`, params)).then(handleResponse),
    getCycle: (cycleId) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}`).then(handleResponse),
    createCycle: (data) => fetch(`${API_BASE_URL}/maintenance/cycles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    startCycle: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    completeCycle: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Stock Management
    allocateStock: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/stock/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    recordStockUsage: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/stock/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    processStockReturns: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/stock/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getStockForecast: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/stock/forecast`, params)).then(handleResponse),
    getStockAlerts: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/stock/alerts`, params)).then(handleResponse),
    
    // SLA Management
    startSLAMonitoring: () => fetch(`${API_BASE_URL}/maintenance/sla/monitor/start`, { method: 'POST' }).then(handleResponse),
    stopSLAMonitoring: () => fetch(`${API_BASE_URL}/maintenance/sla/monitor/stop`, { method: 'POST' }).then(handleResponse),
    checkSLAViolations: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/sla/violations/check`, params)).then(handleResponse),
    processEscalations: () => fetch(`${API_BASE_URL}/maintenance/sla/escalations/process`, { method: 'POST' }).then(handleResponse),
    
    // Technician Management
    registerTechnician: (data) => fetch(`${API_BASE_URL}/maintenance/technicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getTechnicianWorkload: (technicianId, params) => {
      const url = technicianId 
        ? `${API_BASE_URL}/maintenance/technicians/${technicianId}/workload`
        : `${API_BASE_URL}/maintenance/technicians/workload`;
      return fetch(createUrlWithParams(url, params)).then(handleResponse);
    },
    
    // Analytics & Reporting
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/analytics`, params)).then(handleResponse),
    getPerformanceAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/analytics/performance`, params)).then(handleResponse),
    getStockSummary: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/stock/summary`, params)).then(handleResponse),
    getSLAPerformanceReport: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/analytics/sla`, params)).then(handleResponse),
    
    // Quality Inspections
    createQualityInspection: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getQualityInspections: (cycleId) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/inspections`).then(handleResponse),
    
    // Escalation Rules
    getEscalationRules: () => fetch(`${API_BASE_URL}/maintenance/escalation-rules`).then(handleResponse),
    updateEscalationRule: (ruleId, data) => fetch(`${API_BASE_URL}/maintenance/escalation-rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  },

  // --- Unified Customer Service ---
  unifiedService: {
    // Service Actions
    getServiceActions: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/service-actions`, params)).then(handleResponse),
    getServiceAction: (actionId) => fetch(`${API_BASE_URL}/unified-service/service-actions/${actionId}`).then(handleResponse),
    createServiceAction: (data) => fetch(`${API_BASE_URL}/unified-service/service-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    updateServiceActionStatus: (actionId, data) => fetch(`${API_BASE_URL}/unified-service/service-actions/${actionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Hub Operations
    hubScan: (data) => fetch(`${API_BASE_URL}/unified-service/hub/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    hubInspection: (data) => fetch(`${API_BASE_URL}/unified-service/hub/inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Follow-ups & Analytics
    getFollowUps: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/follow-ups`, params)).then(handleResponse),
    scheduleFollowUp: (actionId, data) => fetch(`${API_BASE_URL}/unified-service/follow-ups/${actionId}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/analytics`, params)).then(handleResponse),
    getDashboard: () => fetch(`${API_BASE_URL}/unified-service/dashboard`).then(handleResponse),
    
    // Initialization
    init: () => fetch(`${API_BASE_URL}/unified-service/init`, { method: 'POST' }).then(handleResponse),
  },

  // --- Customers ---
  customers: {
    // Core customer management
    init: () => fetch(`${API_BASE_URL}/customers/init`, { method: 'POST' }).then(handleResponse),
    getStats: () => fetch(`${API_BASE_URL}/customers/stats`).then(handleResponse),
    
    // Customer creation
    createCustomer: (data) => fetch(`${API_BASE_URL}/customers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Customer listing with enhanced filtering
    getCustomers: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/customers`, params)).then(handleResponse),
    
    // Individual customer details with comprehensive analytics
    getCustomer: (phone) => fetch(`${API_BASE_URL}/customers/${phone}`).then(handleResponse),
    
    // Customer orders with business categorization
    getCustomerOrders: (phone, params) => fetch(createUrlWithParams(`${API_BASE_URL}/customers/${phone}/orders`, params)).then(handleResponse),
    
    // Customer interactions
    getCustomerInteractions: (phone, params) => fetch(createUrlWithParams(`${API_BASE_URL}/customers/${phone}/interactions`, params)).then(handleResponse),
    createCustomerInteraction: (phone, data) => fetch(`${API_BASE_URL}/customers/${phone}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Analytics and segments
    getSegments: () => fetch(`${API_BASE_URL}/customers/segments`).then(handleResponse),
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/customers/analytics`, params)).then(handleResponse),
    getRealtimeAnalytics: (phone) => fetch(`${API_BASE_URL}/customers/realtime-analytics/${phone}`).then(handleResponse),
    
    // Duplicate management
    detectDuplicates: (data) => fetch(`${API_BASE_URL}/customers/duplicates/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    mergeDuplicates: (data) => fetch(`${API_BASE_URL}/customers/duplicates/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Profile management
    updateProfileManually: (phone) => fetch(`${API_BASE_URL}/customers/profile/update/${phone}`, { method: 'POST' }).then(handleResponse),
    updateAllSegments: () => fetch(`${API_BASE_URL}/customers/segments/update`, { method: 'POST' }).then(handleResponse),
  },

  // --- Orders - Complete Professional API Implementation ---
  orders: {
    // Core Order Management
    getOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders`, params)).then(handleResponse),
    getOrder: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}`).then(handleResponse),
    getOrderByTracking: (trackingNumber) => fetch(`${API_BASE_URL}/orders/${trackingNumber}`).then(handleResponse),
    getOrderDetails: (trackingNumber, includeFlags = {}) => {
      const params = new URLSearchParams();
      Object.entries(includeFlags).forEach(([key, value]) => {
        if (value) params.append('include', key);
      });
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/orders/${trackingNumber}?${queryString}` : `${API_BASE_URL}/orders/${trackingNumber}`;
      return fetch(url).then(handleResponse);
    },
    
    // Advanced Analytics & Business Intelligence
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/analytics`, params), {
      headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse),
    getComprehensiveAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/analytics`, params), {
      headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse),
    getStatesDistribution: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/states/distribution`, params)).then(handleResponse),
    getRevenueAnalysis: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/revenue/analysis`, params)).then(handleResponse),
    getPerformanceMetrics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/performance/metrics`, params)).then(handleResponse),
    getBusinessCategories: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/business/categories`, params)).then(handleResponse),
    getBusinessCounts: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/business/counts`, params)).then(handleResponse),
    
    // Statistics & Metrics
    getStats: () => fetch(`${API_BASE_URL}/orders/stats`).then(handleResponse),
    getStates: () => fetch(`${API_BASE_URL}/orders/states`).then(handleResponse),
    getDeliveryCategories: () => fetch(`${API_BASE_URL}/orders/delivery-categories`).then(handleResponse),
    getOrderTypes: () => fetch(`${API_BASE_URL}/orders/types`).then(handleResponse),
    
    // Order Hierarchy & Relationships
    getOrderHierarchy: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/hierarchy`).then(handleResponse),
    getHierarchyAnalytics: () => fetch(`${API_BASE_URL}/orders/hierarchy/analytics`).then(handleResponse),
    getRelatedOrders: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/related`).then(handleResponse),
    
    // Timeline & Events
    getOrderTimeline: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/timeline`).then(handleResponse),
    getOrderEvents: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/events`).then(handleResponse),
    addOrderEvent: (orderId, data) => fetch(`${API_BASE_URL}/orders/${orderId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Service Actions & Interactions
    getOrderServiceActions: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/service-actions`).then(handleResponse),
    createServiceAction: (orderId, data) => fetch(`${API_BASE_URL}/orders/${orderId}/service-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    updateServiceAction: (actionId, data) => fetch(`${API_BASE_URL}/orders/service-actions/${actionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Pending orders functionality integrated into unified orders system
    // Use getUnifiedOrders with cycle_type filter for pending orders
    
    // Unified Orders Management - Complete Cycle Integration
    getUnifiedOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders`, params)).then(handleResponse),
    getUnifiedOrderDetails: (trackingNumber) => fetch(`${API_BASE_URL}/unified-orders/${trackingNumber}`).then(handleResponse),
    processOrderUnified: (data) => fetch(`${API_BASE_URL}/unified-orders/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    processBatchUnified: (data) => fetch(`${API_BASE_URL}/unified-orders/process/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Cycle-specific endpoints
    getExchangeOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/exchange`, params)).then(handleResponse),
    getReturnPickupOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/return-pickup`, params)).then(handleResponse),
    getMaintenanceOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/maintenance`, params)).then(handleResponse),
    
    // Processing stage endpoints
    getScanningOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/scanning`, params)).then(handleResponse),
    getQualityCheckOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/quality-check`, params)).then(handleResponse),
    getServiceActionOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/service-action`, params)).then(handleResponse),
    getMaintenanceStageOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/maintenance-stage`, params)).then(handleResponse),
    getCustomerServiceOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/customer-service`, params)).then(handleResponse),
    getReturnProcessingOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/return-processing`, params)).then(handleResponse),
    
    // Cycle management
    advanceProcessingStage: (trackingNumber, data) => fetch(`${API_BASE_URL}/unified-orders/${trackingNumber}/advance-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    completeOrderCycle: (trackingNumber, data) => fetch(`${API_BASE_URL}/unified-orders/${trackingNumber}/complete-cycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Unified analytics
    getCycleDistributionAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/analytics/cycle-distribution`, params)).then(handleResponse),
    getProcessingStagesAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-orders/analytics/processing-stages`, params)).then(handleResponse),
    
    // Sync & Data Management
    syncOrders: (data) => fetch(`${API_BASE_URL}/orders/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    batchProcessOrders: (data) => fetch(`${API_BASE_URL}/orders/process/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getSyncStatus: () => fetch(`${API_BASE_URL}/orders/sync/status`).then(handleResponse),
    
    // Unified Processing & Automation
    processUnified: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/process-unified`, params), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse),
    getUnifiedStatus: () => fetch(`${API_BASE_URL}/orders/unified-status`).then(handleResponse),
    getCycleAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/cycle-analytics`, params)).then(handleResponse),
    
    // Search & Filtering
    searchOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/search`, params)).then(handleResponse),
    getOrdersByCustomer: (phone, params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/customer/${phone}`, params)).then(handleResponse),
    getOrdersByCity: (city, params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/city/${city}`, params)).then(handleResponse),
    getOrdersByDateRange: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/date-range`, params)).then(handleResponse),
    
    // Export & Reporting
    exportOrders: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/export`, params)).then(handleResponse),
    generateReport: (reportType, params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/reports/${reportType}`, params)).then(handleResponse),
    getReportStatus: (reportId) => fetch(`${API_BASE_URL}/orders/reports/${reportId}/status`).then(handleResponse),
    
    // Risk Assessment & Classification
    getRiskAssessment: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/risk`).then(handleResponse),
    getOrderClassification: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/classification`).then(handleResponse),
    bulkClassifyOrders: (data) => fetch(`${API_BASE_URL}/orders/classify/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Real-time Updates & Notifications
    getOrderUpdates: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/orders/updates`, params)).then(handleResponse),
    subscribeToUpdates: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/subscribe`, {
      method: 'POST',
    }).then(handleResponse),
    unsubscribeFromUpdates: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/unsubscribe`, {
      method: 'POST',
    }).then(handleResponse),
    
    // Quality Assurance & Validation
    validateOrder: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/validate`).then(handleResponse),
    getOrderIssues: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/issues`).then(handleResponse),
    reportOrderIssue: (orderId, data) => fetch(`${API_BASE_URL}/orders/${orderId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Delivery Management
    getDeliveryInfo: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/delivery`).then(handleResponse),
    updateDeliveryStatus: (orderId, data) => fetch(`${API_BASE_URL}/orders/${orderId}/delivery/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    scheduleDelivery: (orderId, data) => fetch(`${API_BASE_URL}/orders/${orderId}/delivery/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Financial Operations
    getOrderFinancials: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/financials`).then(handleResponse),
    processRefund: (orderId, data) => fetch(`${API_BASE_URL}/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getFeesBreakdown: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/fees`).then(handleResponse),
    
    // Inventory Integration
    checkStockAvailability: (productId) => fetch(`${API_BASE_URL}/orders/stock/check/${productId}`).then(handleResponse),
    reserveStock: (orderId, data) => fetch(`${API_BASE_URL}/orders/${orderId}/stock/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    releaseStock: (orderId) => fetch(`${API_BASE_URL}/orders/${orderId}/stock/release`, {
      method: 'POST',
    }).then(handleResponse),
  },

  // --- Products ---
  products: {
    getProducts: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/products`, params)).then(handleResponse),
    getProduct: (productId) => fetch(`${API_BASE_URL}/products/${productId}`).then(handleResponse),
    createProduct: (data) => fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    updateProduct: (productId, data) => fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    deleteProduct: (productId) => fetch(`${API_BASE_URL}/products/${productId}`, { method: 'DELETE' }).then(handleResponse),
    getCategories: () => fetch(`${API_BASE_URL}/products/categories`).then(handleResponse),
    getProductInventory: (productId) => fetch(`${API_BASE_URL}/products/${productId}/inventory`).then(handleResponse),
    updateProductInventory: (productId, data) => fetch(`${API_BASE_URL}/products/${productId}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getLowStockAlerts: () => fetch(`${API_BASE_URL}/products/inventory/alerts`).then(handleResponse),
    getParts: () => fetch(`${API_BASE_URL}/products/parts`).then(handleResponse),
    getProductParts: (productId) => fetch(`${API_BASE_URL}/products/${productId}/parts`).then(handleResponse),
  },
  
  // --- Hub Scanning & Inspection (Based on Backend Implementation) ---
  hub: {
    // Initialize hub scanning system
    init: () => fetch(`${API_BASE_URL}/unified-service/init`, { method: 'POST' }).then(handleResponse),
    
    // Scan return tracking number - Unified Customer Service endpoint
    scan: (data) => fetch(`${API_BASE_URL}/unified-service/hub/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Complete hub inspection - Unified Customer Service endpoint
    inspect: (data) => fetch(`${API_BASE_URL}/unified-service/hub/inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Get pending hub tasks
    getPendingTasks: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/service-actions`, {
      action_status: 'requested,scanned,awaiting_inspection',
      ...params
    })).then(handleResponse),
    
    // Get hub analytics
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/analytics`, params)).then(handleResponse),
    
    // Get hub dashboard
    getDashboard: () => fetch(`${API_BASE_URL}/unified-service/dashboard`).then(handleResponse),
    
    // Legacy endpoints for backward compatibility
    legacyScan: (returnTrackingNumber) => fetch(`${API_BASE_URL}/service-actions/hub/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ return_tracking_number: returnTrackingNumber }),
    }).then(handleResponse),
    
    legacyInspect: (payload) => fetch(`${API_BASE_URL}/service-actions/hub/inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),
  },

  // --- Service Actions (Based on Backend Implementation) ---
  serviceActions: {
    // Get service actions with filtering
    getServiceActions: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/service-actions`, params)).then(handleResponse),
    
    // Get specific service action details
    getServiceActionDetails: (actionId) => fetch(`${API_BASE_URL}/service-actions/${actionId}`).then(handleResponse),
    
    // Create new service action
    createServiceAction: (data) => fetch(`${API_BASE_URL}/unified-service/service-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Update service action status
    updateServiceActionStatus: (actionId, data) => fetch(`${API_BASE_URL}/service-actions/${actionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Execute service action
    executeServiceAction: (actionId, data) => fetch(`${API_BASE_URL}/service-actions/${actionId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Get service action parts
    getServiceActionParts: (actionId) => fetch(`${API_BASE_URL}/service-actions/${actionId}/parts`).then(handleResponse),
    
    // Update service action parts
    updateServiceActionParts: (actionId, data) => fetch(`${API_BASE_URL}/service-actions/${actionId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Legacy endpoints for backward compatibility
    legacyGetServiceActions: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/service-actions`, params)).then(handleResponse),
    legacyGetServiceAction: (actionId) => fetch(`${API_BASE_URL}/service-actions/${actionId}`).then(handleResponse),
  },

  // --- Stock Management ---
  stock: {
    getSummary: () => fetch(`${API_BASE_URL}/stock/summary`).then(handleResponse),
    getLowStockAlerts: () => fetch(`${API_BASE_URL}/maintenance/stock/alerts`).then(handleResponse),
  },

  // --- Maintenance ---
  maintenance: {
    getEscalationRules: () => fetch(`${API_BASE_URL}/maintenance/escalation-rules`).then(handleResponse),
    updateEscalationRule: (ruleId, data) => fetch(`${API_BASE_URL}/maintenance/escalation-rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    createCycle: (data) => fetch(`${API_BASE_URL}/maintenance/cycles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getCycle: (cycleId) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}`).then(handleResponse),
    listCycles: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/cycles`, params)).then(handleResponse),
    startCycle: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    completeCycle: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    allocateStock: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/stock/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    recordStockUsage: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/stock/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    processStockReturns: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/stock/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getStockForecast: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/stock/forecast`, params)).then(handleResponse),
    getStockAlerts: () => fetch(`${API_BASE_URL}/maintenance/stock/alerts`).then(handleResponse),
    startSlaMonitoring: () => fetch(`${API_BASE_URL}/maintenance/sla/monitor/start`, { method: 'POST' }).then(handleResponse),
    stopSlaMonitoring: () => fetch(`${API_BASE_URL}/maintenance/sla/monitor/stop`, { method: 'POST' }).then(handleResponse),
    checkSlaViolations: () => fetch(`${API_BASE_URL}/maintenance/sla/violations/check`, { method: 'POST' }).then(handleResponse),
    processEscalations: () => fetch(`${API_BASE_URL}/maintenance/sla/escalations/process`, { method: 'POST' }).then(handleResponse),
    registerTechnician: (data) => fetch(`${API_BASE_URL}/maintenance/technicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getTechnicianWorkload: (technicianId) => fetch(`${API_BASE_URL}/maintenance/technicians/${technicianId}/workload`).then(handleResponse),
    getAllTechniciansWorkload: () => fetch(`${API_BASE_URL}/maintenance/technicians/workload`).then(handleResponse),
    getAnalytics: () => fetch(`${API_BASE_URL}/maintenance/analytics/performance`).then(handleResponse),
    getSlaReport: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/maintenance/analytics/sla`, params)).then(handleResponse),
    createInspection: (cycleId, data) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),
    getInspections: (cycleId) => fetch(`${API_BASE_URL}/maintenance/cycles/${cycleId}/inspections`).then(handleResponse),
  },
  
  // --- Unified Customer Service (Primary Hub Scanning Interface) ---
  unifiedCustomerService: {
    // System initialization
    init: () => fetch(`${API_BASE_URL}/unified-service/init`, { method: 'POST' }).then(handleResponse),
    
    // Service Actions Management - Manual Creation Only
    getServiceActions: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/service-actions`, {
      ...params,
      creation_type: 'manual' // Only manual actions allowed
    })).then(handleResponse),
    createServiceAction: (data) => fetch(`${API_BASE_URL}/unified-service/service-actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        requires_service_action: true,
        manual_creation: true,
        manual_processing: true,
        creation_type: 'manual'
      }),
    }).then(handleResponse),
    getServiceAction: (actionId) => fetch(`${API_BASE_URL}/unified-service/service-actions/${actionId}`).then(handleResponse),
    updateServiceActionStatus: (actionId, data) => fetch(`${API_BASE_URL}/unified-service/service-actions/${actionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Hub Scanning Operations
    hubScan: (data) => fetch(`${API_BASE_URL}/unified-service/hub/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    hubInspection: (data) => fetch(`${API_BASE_URL}/unified-service/hub/inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Follow-ups and Customer Management
    getFollowUps: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/follow-ups`, params)).then(handleResponse),
    
    // Legacy follow-up scheduling (for existing service actions)
    scheduleFollowUp: (actionId, data) => fetch(`${API_BASE_URL}/unified-service/follow-ups/${actionId}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // New comprehensive follow-up creation (for NewServiceActionForm.jsx)
    createFollowUp: (data) => fetch(`${API_BASE_URL}/unified-service/schedule-follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

    // Unified command endpoint
    command: (payload) => fetch(`${API_BASE_URL}/unified-service/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handleResponse),
    
    // Follow-up management
    getFollowUpDetails: (followUpId) => fetch(`${API_BASE_URL}/unified-service/follow-ups/${followUpId}`).then(handleResponse),
    completeFollowUp: (followUpId, data) => fetch(`${API_BASE_URL}/unified-service/follow-ups/${followUpId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    
    // Analytics and Dashboard
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/analytics`, params)).then(handleResponse),
    getDashboard: () => fetch(`${API_BASE_URL}/unified-service/dashboard`).then(handleResponse),
    getNotifications: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/unified-service/notifications`, params)).then(handleResponse),
  },

  // --- Legacy Customer Service (Use unifiedCustomerService where possible) ---
  // Provided for completeness, but overlaps with unified endpoints.
  legacyCustomerService: {
    init: () => fetch(`${API_BASE_URL}/customer-service/init`, { method: 'POST' }).then(handleResponse),
    getTickets: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/customer-service/tickets`, params)).then(handleResponse),
    createTicket: (data) => fetch(`${API_BASE_URL}/customer-service/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
    getTicket: (ticketId) => fetch(`${API_BASE_URL}/customer-service/tickets/${ticketId}`).then(handleResponse),
    scheduleCall: (data) => fetch(`${API_BASE_URL}/customer-service/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),
    completeCall: (callId, data) => fetch(`${API_BASE_URL}/customer-service/calls/${callId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(handleResponse),
    getAnalytics: (params) => fetch(createUrlWithParams(`${API_BASE_URL}/customer-service/analytics`, params)).then(handleResponse),
    getDashboard: () => fetch(`${API_BASE_URL}/customer-service/dashboard`).then(handleResponse),
  },

};

export default api; 