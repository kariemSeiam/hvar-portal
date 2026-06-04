/**
 * Service Tickets API
 *
 * This module provides API functions for managing service tickets with support for different service types:
 * - Replacement (استبدال): Customer gets new product, returns defective
 * - Maintenance (صيانة): Customer sends for repair, gets back
 * - Return (استرجاع): Customer returns for refund/cancellation
 *
 * Usage examples:
 * - List replacements: listReplacements({ limit: 20, status: 'pending' })
 * - List maintenance: listMaintenance({ customer_id: 123 })
 * - List returns: listReturns({ offset: 0, limit: 10 })
 * - Generic by type: listTicketsByServiceType('replacement', { status: 'active' })
 * - Get service info: getServiceTypeInfo('replacement', 'ar')
 */

import api from "./axios";
import logger from "../utils/core/logger";
import { deduplicateRequest, invalidateServiceDataCaches } from "../utils/core/request";

const API_URL = "/api/tickets";

// Service Type Constants
export const SERVICE_TYPES = {
  REPLACEMENT: "replacement",
  MAINTENANCE: "maintenance",
  RETURN: "return",
  SELL: "sell",
};

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.REPLACEMENT]: {
    en: "Replacement",
    ar: "استبدال",
  },
  [SERVICE_TYPES.MAINTENANCE]: {
    en: "Maintenance",
    ar: "صيانة",
  },
  [SERVICE_TYPES.RETURN]: {
    en: "Return",
    ar: "استرجاع",
  },
  [SERVICE_TYPES.SELL]: {
    en: "Sell",
    ar: "بيع",
  },
};

export const SERVICE_TYPE_DESCRIPTIONS = {
  [SERVICE_TYPES.REPLACEMENT]: {
    en: "Customer gets new product, returns defective",
    ar: "يحصل العميل على منتج جديد، ويعيد المنتج المعيب",
  },
  [SERVICE_TYPES.MAINTENANCE]: {
    en: "Customer sends for repair, gets back",
    ar: "يرسل العميل للإصلاح، ويحصل عليه مرة أخرى",
  },
  [SERVICE_TYPES.RETURN]: {
    en: "Customer returns for refund/cancellation",
    ar: "يعيد العميل للاسترداد/الإلغاء",
  },
  [SERVICE_TYPES.SELL]: {
    en: "Sell parts/products to customer",
    ar: "المبيعات / منتجات للعميل",
  },
};

/**
 * Gets service type information by type.
 * @param {string} serviceType - The service type.
 * @param {string} language - The language ('en' or 'ar').
 * @returns {object} Object containing label and description.
 */
export const getServiceTypeInfo = (serviceType, language = "en") => {
  const validServiceTypes = Object.values(SERVICE_TYPES);
  if (!validServiceTypes.includes(serviceType)) {
    throw new Error(
      `Invalid service type. Must be one of: ${validServiceTypes.join(", ")}`
    );
  }

  return {
    type: serviceType,
    label: SERVICE_TYPE_LABELS[serviceType][language],
    description: SERVICE_TYPE_DESCRIPTIONS[serviceType][language],
  };
};

/**
 * Gets all available service types with their information.
 * @param {string} language - The language ('en' or 'ar').
 * @returns {Array} Array of service type information objects.
 */
export const getAllServiceTypes = (language = "en") => {
  return Object.values(SERVICE_TYPES).map((serviceType) =>
    getServiceTypeInfo(serviceType, language)
  );
};

/**
 * Lists all service tickets with pagination and optional filtering.
 * @param {object} params - The query parameters.
 * @param {number} [params.limit=20] - The number of items to return.
 * @param {number} [params.offset=0] - The offset for pagination.
 * @param {string} [params.status] - The status to filter by.
 * @param {number} [params.customer_id] - The customer ID to filter by.
 * @param {string} [params.available_actions] - Comma-separated list of required available actions.
 * @param {boolean} [params.forceRefresh=false] - Force refresh, bypass cache
 * @param {AbortSignal} [signal] - AbortSignal for request cancellation
 * @returns {Promise<object>} The response from the API.
 */
export const listTickets = async (params = {}, options = {}) => {
  const { forceRefresh = false, signal, ...requestParams } = { ...params, ...options };
  
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(API_URL, { params: requestParams, signal });
        return response.data;
      } catch (error) {
        // Don't log cancellation errors
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          console.error("Error listing tickets:", error);
        }
        throw error;
      }
    },
    API_URL,
    requestParams,
    {
      useCache: !forceRefresh,
      ttl: 60000, // 60 second cache for list requests (increased from 5s for better performance)
      forceRefresh
    }
  );
};

/**
 * Gets a single ticket by its ID.
 * @param {number} ticketId - The ID of the ticket.
 * @param {boolean} [forceRefresh=false] - Force refresh, bypass cache
 * @param {boolean} [includeBosta=true] - Include Bosta order data (default: true for detail views)
 * @returns {Promise<object>} The ticket data.
 */
export const getTicket = async (ticketId, forceRefresh = false, includeBosta = true) => {
  const url = `${API_URL}/${ticketId}`;
  const params = includeBosta ? { include_bosta: 'true' } : {};
  
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(url, { params });
        return response.data;
      } catch (error) {
        logger.error(`Error getting ticket ${ticketId}:`, error);
        throw error;
      }
    },
    url,
    { ticketId, includeBosta },
    {
      useCache: !forceRefresh,
      ttl: 30000, // 30 second cache for individual tickets (increased from 10s)
      forceRefresh
    }
  );
};

/**
 * Creates a new service ticket.
 * @param {object} ticketData - The data for the new ticket.
 * @returns {Promise<object>} The created ticket data.
 */
export const createTicket = async (ticketData) => {
  try {
    const response = await api.post(`${API_URL}/create`, ticketData);
    invalidateServiceDataCaches();
    return response.data;
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
};

/**
 * Executes an action on a ticket.
 * @param {number} ticketId - The ID of the ticket.
 * @param {object} actionData - The action data.
 * @param {string} actionData.action - The action to perform.
 * @param {number} actionData.user_id - The ID of the user performing the action.
 * @param {string} [actionData.notes] - Optional notes.
 * @returns {Promise<object>} The updated ticket data.
 */
export const executeTicketAction = async (ticketId, actionData) => {
  try {
    const response = await api.post(
      `${API_URL}/${ticketId}/action`,
      actionData
    );
    invalidateServiceDataCaches();
    return response.data;
  } catch (error) {
    logger.error(`Error executing action on ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Cancels a ticket.
 * @param {number} ticketId - The ID of the ticket to cancel.
 * @param {object} cancellationData - The cancellation data.
 * @param {number} cancellationData.user_id - The ID of the user performing the cancellation.
 * @param {string} [cancellationData.reason] - The reason for cancellation.
 * @returns {Promise<object>} The updated ticket data.
 */
export const cancelTicket = async (ticketId, cancellationData) => {
  try {
    const response = await api.post(
      `${API_URL}/${ticketId}/cancel`,
      cancellationData
    );
    invalidateServiceDataCaches();
    return response.data;
  } catch (error) {
    logger.error(`Error canceling ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Deletes a cancelled ticket permanently.
 * Only tickets with CANCELLED status can be deleted.
 * This operation is irreversible.
 * @param {number} ticketId - The ID of the ticket to delete.
 * @param {object} deletionData - The deletion data.
 * @param {number} deletionData.user_id - The ID of the user performing the deletion.
 * @returns {Promise<object>} The response data.
 */
export const deleteTicket = async (ticketId, deletionData) => {
  try {
    const response = await api.delete(
      `${API_URL}/${ticketId}`,
      { data: deletionData }
    );
    invalidateServiceDataCaches();
    return response.data;
  } catch (error) {
    logger.error(`Error deleting ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Lists all replacement tickets (استبدال - Customer gets new product, returns defective).
 * @param {object} params - The query parameters.
 * @param {number} [params.limit=20] - The number of items to return.
 * @param {number} [params.offset=0] - The offset for pagination.
 * @param {string} [params.status] - The status to filter by.
 * @returns {Promise<object>} The response from the API.
 */
export const listReplacements = async (params = {}) => {
  const requestParams = {
        service_type: SERVICE_TYPES.REPLACEMENT,
        ...params,
  };
  
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(API_URL, { params: requestParams });
    return response.data;
  } catch (error) {
    logger.error("Error listing replacements:", error);
    throw error;
  }
    },
    API_URL,
    requestParams,
    {
      useCache: true,
      ttl: 5000, // 5 second cache
    }
  );
};

/**
 * Lists all maintenance tickets (صيانة - Customer sends for repair, gets back).
 * @param {object} params - The query parameters.
 * @param {number} [params.limit=20] - The number of items to return.
 * @param {number} [params.offset=0] - The offset for pagination.
 * @param {string} [params.status] - The status to filter by.
 * @returns {Promise<object>} The response from the API.
 */
export const listMaintenance = async (params = {}) => {
  const requestParams = {
        service_type: SERVICE_TYPES.MAINTENANCE,
        ...params,
  };
  
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(API_URL, { params: requestParams });
    return response.data;
  } catch (error) {
    logger.error("Error listing maintenance tickets:", error);
    throw error;
  }
    },
    API_URL,
    requestParams,
    {
      useCache: true,
      ttl: 5000, // 5 second cache
    }
  );
};

/**
 * Lists all return tickets (استرجاع - Customer returns for refund/cancellation).
 * @param {object} params - The query parameters.
 * @param {number} [params.limit=20] - The number of items to return.
 * @param {number} [params.offset=0] - The offset for pagination.
 * @param {string} [params.status] - The status to filter by.
 * @returns {Promise<object>} The response from the returns API.
 */
export const listReturns = async (params = {}) => {
  const requestParams = {
        service_type: SERVICE_TYPES.RETURN,
        ...params,
  };
  
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(API_URL, { params: requestParams });
    return response.data;
  } catch (error) {
    logger.error("Error listing returns:", error);
    throw error;
  }
    },
    API_URL,
    requestParams,
    {
      useCache: true,
      ttl: 5000, // 5 second cache
    }
  );
};

/**
 * Lists tickets by service type with pagination and optional filtering.
 * @param {string} serviceType - The service type to filter by (replacement, maintenance, return).
 * @param {object} params - The query parameters.
 * @param {number} [params.limit=20] - The number of items to return.
 * @param {number} [params.offset=0] - The offset for pagination.
 * @param {string} [params.status] - The status to filter by.
 * @returns {Promise<object>} The response from the API.
 */
export const listTicketsByServiceType = async (serviceType, params = {}) => {
    const validServiceTypes = Object.values(SERVICE_TYPES);
    if (!validServiceTypes.includes(serviceType)) {
      throw new Error(
        `Invalid service type. Must be one of: ${validServiceTypes.join(", ")}`
      );
    }

  const requestParams = {
        service_type: serviceType,
        ...params,
  };
  
  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(API_URL, { params: requestParams });
    return response.data;
  } catch (error) {
    logger.error(`Error listing ${serviceType} tickets:`, error);
    throw error;
  }
    },
    API_URL,
    requestParams,
    {
      useCache: true,
      ttl: 5000, // 5 second cache
    }
  );
};

/**
 * Gets ticket counts for all tabs and sub-tabs efficiently.
 * This endpoint uses optimized SQL queries to count ALL tickets (not limited to 1000).
 * @param {boolean} [forceRefresh=false] - Force refresh, bypass cache
 * @param {AbortSignal} [signal] - AbortSignal for request cancellation
 * @returns {Promise<object>} Object with counts grouped by service_type and sub-tab ID.
 * Example response: { replacement: { 'in-preparation': 5, 'preparing': 3, ... }, maintenance: {...}, return: {...} }
 */
export const getTicketCounts = async (forceRefresh = false, signal = null) => {
  const url = `${API_URL}/counts`;
  const params = forceRefresh ? { force_refresh: 'true' } : {};

  return deduplicateRequest(
    async () => {
      try {
        const response = await api.get(url, { params, signal });
        return response.data;
      } catch (error) {
        // Don't log cancellation errors
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          logger.error("Error getting ticket counts:", error);
        }
        throw error;
      }
    },
    url,
    {},
    {
      useCache: !forceRefresh,
      ttl: 30000, // 30 second cache for counts (increased from 10s)
      forceRefresh
    }
  );
};

/**
 * Get filter summary counts from backend
 * @param {object} filters - Filter parameters (service_type, status, start_date, end_date, search)
 * @returns {Promise<object>} Filter summary with total, byServiceType, byStatus
 */
export const getFilterSummary = async (filters = {}) => {
  try {
    const response = await api.get(`${API_URL}/filter`, { params: filters });
    return response.data;
  } catch (error) {
    logger.error("Error getting filter summary:", error);
    throw error;
  }
};

/**
 * Export filtered tickets to Excel
 * @param {object} filters - Filter parameters (service_type, status, start_date, end_date, search)
 * @returns {Promise<void>} Triggers file download
 */
export const exportTicketsToExcel = async (filters = {}) => {
  try {
    const response = await api.get(`${API_URL}/filter`, {
      params: { ...filters, export: 'true' },
      responseType: 'blob'
    });

    // Create blob from response
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    const filename = `tickets_export_${timestamp}.xlsx`;

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    logger.error("Error exporting tickets:", error);
    throw error;
  }
};

export default {
  listTickets,
  getTicket,
  createTicket,
  executeTicketAction,
  cancelTicket,
  listReplacements,
  listMaintenance,
  listReturns,
  listTicketsByServiceType,
  getTicketCounts,
  getFilterSummary,
  exportTicketsToExcel,
  // Constants
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_DESCRIPTIONS,
  // Utilities
  getServiceTypeInfo,
  getAllServiceTypes,
};
