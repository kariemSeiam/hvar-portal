import { API_CONFIG, API_ENDPOINTS } from '../constants';

/**
 * Orders API Service
 * Handles all order-related API calls
 */
class OrdersService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * Get orders with filters and pagination
   */
  async getOrders(params = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortDir = 'DESC',
      dateFrom,
      dateTo,
      date_from,
      date_to,
      stateCodes,
      state_codes,
      orderTypes,
      order_types,
      businessCategories,
      business_categories,
      codMin,
      codMax,
      cod_min,
      cod_max,
      city,
      phone,
      riskLevels,
      risk_levels,
      search,
      include = [],
    } = params;

    const queryParams = new URLSearchParams();

    // Pagination
    queryParams.set('page', page.toString());
    queryParams.set('limit', limit.toString());
    queryParams.set('sort_by', sortBy);
    queryParams.set('sort_dir', sortDir);

    // Date filters - support both camelCase and snake_case
    const dateFromValue = dateFrom || date_from;
    const dateToValue = dateTo || date_to;
    if (dateFromValue) queryParams.set('date_from', dateFromValue);
    if (dateToValue) queryParams.set('date_to', dateToValue);

    // Array filters - support both camelCase and snake_case
    const stateCodesValue = stateCodes || state_codes;
    const orderTypesValue = orderTypes || order_types;
    const businessCategoriesValue = businessCategories || business_categories;
    const riskLevelsValue = riskLevels || risk_levels;
    
    if (stateCodesValue?.length) queryParams.set('state_codes', stateCodesValue.join(','));
    if (orderTypesValue?.length) queryParams.set('order_types', orderTypesValue.join(','));
    if (businessCategoriesValue?.length) queryParams.set('business_categories', businessCategoriesValue.join(','));
    if (riskLevelsValue?.length) queryParams.set('risk_levels', riskLevelsValue.join(','));

    // Range filters - support both camelCase and snake_case
    const codMinValue = codMin || cod_min;
    const codMaxValue = codMax || cod_max;
    if (codMinValue !== undefined) queryParams.set('cod_min', codMinValue.toString());
    if (codMaxValue !== undefined) queryParams.set('cod_max', codMaxValue.toString());

    // Text filters
    if (city) queryParams.set('city', city);
    if (phone) queryParams.set('phone', phone);
    if (search) queryParams.set('search', search);

    // Include flags
    if (include.length) queryParams.set('include', include.join(','));

    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get order details by tracking number
   */
  async getOrderDetails(trackingNumber, include = []) {
    const queryParams = new URLSearchParams();
    if (include.length) {
      queryParams.set('include', include.join(','));
    }

    const url = `${this.baseURL}${API_ENDPOINTS.ORDER_DETAILS.replace(':id', trackingNumber)}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get order states distribution
   */
  async getOrderStatesDistribution(params = {}) {
    const { dateFrom, dateTo } = params;
    const queryParams = new URLSearchParams();

    if (dateFrom) queryParams.set('date_from', dateFrom);
    if (dateTo) queryParams.set('date_to', dateTo);

    const url = `${this.baseURL}${API_ENDPOINTS.ORDER_STATES}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get comprehensive order analytics
   */
  async getOrderAnalytics(params = {}) {
    const { dateFrom, dateTo, granularity = 'daily' } = params;
    const queryParams = new URLSearchParams();

    if (dateFrom) queryParams.set('date_from', dateFrom);
    if (dateTo) queryParams.set('date_to', dateTo);
    queryParams.set('granularity', granularity);

    const url = `${this.baseURL}${API_ENDPOINTS.ORDER_ANALYTICS}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get business categories
   */
  async getBusinessCategories() {
    const url = `${this.baseURL}${API_ENDPOINTS.BUSINESS_CATEGORIES}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Sync orders from external API
   */
  async syncOrders(syncType = 'incremental', options = {}) {
    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/sync`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
      body: JSON.stringify({
        sync_type: syncType,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Process orders batch
   */
  async processOrdersBatch(orders, processingMode = 'standard') {
    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/process/batch`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
      body: JSON.stringify({
        orders,
        processing_mode: processingMode,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(params = {}) {
    const { period = 'last_30_days', compareTo = 'previous_period' } = params;
    const queryParams = new URLSearchParams();

    queryParams.set('period', period);
    queryParams.set('compare_to', compareTo);

    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/performance/metrics?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get revenue analysis
   */
  async getRevenueAnalysis(params = {}) {
    const { dateFrom, dateTo, breakdownBy = 'category' } = params;
    const queryParams = new URLSearchParams();

    if (dateFrom) queryParams.set('date_from', dateFrom);
    if (dateTo) queryParams.set('date_to', dateTo);
    queryParams.set('breakdown_by', breakdownBy);

    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/revenue/analysis?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Export orders to CSV
   */
  async exportOrders(params = {}) {
    const {
      dateFrom,
      dateTo,
      stateCodes,
      orderTypes,
      businessCategories,
      format = 'csv',
    } = params;

    const queryParams = new URLSearchParams();

    if (dateFrom) queryParams.set('date_from', dateFrom);
    if (dateTo) queryParams.set('date_to', dateTo);
    if (stateCodes?.length) queryParams.set('state_codes', stateCodes.join(','));
    if (orderTypes?.length) queryParams.set('order_types', orderTypes.join(','));
    if (businessCategories?.length) queryParams.set('business_categories', businessCategories.join(','));
    queryParams.set('format', format);

    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/export?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle file download
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, message: 'Export completed successfully' };
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(updates) {
    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/bulk-update`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get order timeline
   */
  async getOrderTimeline(trackingNumber) {
    const url = `${this.baseURL}${API_ENDPOINTS.ORDER_DETAILS.replace(':id', trackingNumber)}/timeline`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get order service actions
   */
  async getOrderServiceActions(trackingNumber) {
    const url = `${this.baseURL}${API_ENDPOINTS.ORDER_DETAILS.replace(':id', trackingNumber)}/service-actions`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get order hierarchy
   */
  async getOrderHierarchy(trackingNumber) {
    const url = `${this.baseURL}${API_ENDPOINTS.ORDER_DETAILS.replace(':id', trackingNumber)}/hierarchy`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search orders by text
   */
  async searchOrders(query, params = {}) {
    const { page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();

    queryParams.set('q', query);
    queryParams.set('page', page.toString());
    queryParams.set('limit', limit.toString());

    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/search?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(params = {}) {
    const { dateFrom, dateTo, groupBy = 'day' } = params;
    const queryParams = new URLSearchParams();

    if (dateFrom) queryParams.set('date_from', dateFrom);
    if (dateTo) queryParams.set('date_to', dateTo);
    queryParams.set('group_by', groupBy);

    const url = `${this.baseURL}${API_ENDPOINTS.ORDERS}/statistics?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hvar_auth_token')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Create singleton instance
const ordersService = new OrdersService();

export default ordersService; 