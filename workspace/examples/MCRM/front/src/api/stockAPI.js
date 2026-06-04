/**
 * Stock API
 * NOTE: Only authorized endpoints: /api/stock/items, /api/stock/manual, /api/stock/movements
 * Other endpoints like /api/stock/current, /api/stock/validate, /api/stock/workflow-operation removed per api_endpoints.md
 */

import axiosInstance from "./axios";
import { ERROR_MESSAGES } from "../config/environment";
import logger from "../utils/core/logger";
import { deduplicateRequest } from "../utils/core/request";

// Use centralized axios instance (already configured with baseURL from env)
// All endpoints already include /api prefix, so we use the instance as-is
const backendApi = axiosInstance;

// Block unauthorized endpoints
const originalRequest = backendApi.request.bind(backendApi);
backendApi.request = function (config) {
  const url = config.url || "";
  // Only allow authorized stock endpoints
  if (
    !url.startsWith("/api/stock/items") &&
    !url.startsWith("/api/stock/manual") &&
    !url.startsWith("/api/stock/movements") &&
    !url.startsWith("/api/stock/export")
  ) {
    logger.warn(`Blocked unauthorized endpoint: ${config.method} ${url}`);
    return Promise.reject({
      response: {
        status: 403,
        data: {
          message: `Endpoint ${url} is not authorized in api_endpoints.md`,
        },
      },
    });
  }
  return originalRequest(config);
};

// Error handling
const getErrorMessage = (error) => {
  if (error.userMessage) return error.userMessage;

  if (error.response) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;

    const statusMessages = {
      400: serverMessage || ERROR_MESSAGES.VALIDATION_ERROR,
      401: ERROR_MESSAGES.UNAUTHORIZED,
      404: serverMessage || ERROR_MESSAGES.NOT_FOUND,
      500: serverMessage || ERROR_MESSAGES.SERVER_ERROR,
      503: "الخدمة غير متاحة مؤقتاً - يرجى المحاولة لاحقاً",
    };

    return (
      statusMessages[status] || serverMessage || ERROR_MESSAGES.UNKNOWN_ERROR
    );
  }

  return ERROR_MESSAGES.NETWORK_ERROR;
};

// ============================================================================
// DATA TRANSFORMATION LAYER
// ============================================================================

/**
 * Transform backend stock item to frontend format
 * Follows exact backend structure from stock_model.py
 */
const transformBackendStockItem = (backendItem) => {
  if (!backendItem) return null;

  return {
    // Direct mapping from backend stock_items table
    id: backendItem.id,
    _id: backendItem.id,
    sku: backendItem.sku,
    name: backendItem.name,
    type: backendItem.type,
    active: backendItem.active !== undefined ? backendItem.active : true,
    quantity_on_hand: backendItem.quantity_on_hand || 0,
    quantity_reserved: backendItem.quantity_reserved || 0,
    quantity_damaged: backendItem.quantity_damaged || 0,
    created_by: backendItem.created_by,
    updated_by: backendItem.updated_by,
    created_at: backendItem.created_at,
    updated_at: backendItem.updated_at,

    // Price fields from stock_items
    price_customer: backendItem.price_customer || null,
    price_merchant: backendItem.price_merchant || null,

    // Calculated fields for UI
    available_stock:
      (backendItem.quantity_on_hand || 0) -
      (backendItem.quantity_reserved || 0),

    // Components (for products)
    components: backendItem.components || [],

    // Compatibility fields (camelCase)
    quantityOnHand: backendItem.quantity_on_hand || 0,
    quantityReserved: backendItem.quantity_reserved || 0,
    quantityDamaged: backendItem.quantity_damaged || 0,
    availableStock:
      (backendItem.quantity_on_hand || 0) -
      (backendItem.quantity_reserved || 0),
    createdAt: backendItem.created_at,
    updatedAt: backendItem.updated_at,
  };
};

/**
 * Transform backend stock movement to frontend format
 * Follows exact backend structure from StockMovement.to_dict()
 */
const transformBackendStockMovement = (backendMovement) => {
  if (!backendMovement) return null;

  return {
    // Direct mapping from backend StockMovement model
    id: backendMovement.id,
    _id: backendMovement.id,
    item_type: backendMovement.item_info?.type || backendMovement.item_type || "part",
    item_id: backendMovement.item_info?.id || backendMovement.item_id,
    movement_type: backendMovement.movement_type,
    quantity: backendMovement.quantity,
    quantity_change: backendMovement.quantity,
    condition: backendMovement.condition,
    order_id: backendMovement.order_id,
    service_action_id: backendMovement.service_action_id,
    reference_id: backendMovement.reference_id,
    reference_type: backendMovement.reference_type,
    reason: backendMovement.reason,
    scanning_phase: backendMovement.scanning_phase,
    created_by: backendMovement.created_by,
    created_at: backendMovement.created_at,
    updated_at: backendMovement.updated_at,

    // Item information from nested object or direct fields
    item_name: backendMovement.item_info?.name || backendMovement.item_name || "",
    item_sku: backendMovement.item_info?.sku || backendMovement.sku || "",
    sku: backendMovement.item_info?.sku || backendMovement.sku || "",

    // Additional fields for compatibility
    itemType: backendMovement.item_info?.type || "part",
    itemId: backendMovement.item_info?.id || backendMovement.item_id,
    movementType: backendMovement.movement_type,
    orderId: backendMovement.order_id,
    serviceActionId: backendMovement.service_action_id,
    notes: backendMovement.reason,
    userName: backendMovement.created_by,
    createdAt: backendMovement.created_at,
    updatedAt: backendMovement.updated_at,
    movement_type_arabic: getMovementTypeArabic(backendMovement.movement_type),
    condition_arabic: getConditionArabic(backendMovement.condition),
  };
};

/**
 * Get Arabic movement type name
 */
const getMovementTypeArabic = (movementType) => {
  const typeMap = {
    maintenance: "صيانة",
    send: "إرسال",
    receive: "استلام",
  };
  return typeMap[movementType] || movementType;
};

/**
 * Get Arabic condition name
 */
const getConditionArabic = (condition) => {
  const conditionMap = {
    valid: "سليم",
    damaged: "تالف",
  };
  return conditionMap[condition] || condition;
};

/**
 * Get Arabic category name
 */
const getCategoryArabic = (category) => {
  const categoryMap = {
    "هاند بلندر": "هاند بلندر",
    مكنسة: "مكنسة",
    كبه: "كبه",
    "خلاط هفار": "خلاط هفار",
    "فرن هفار كهربائي": "فرن هفار كهربائي",
    عجان: "عجان",
    "مطحنه توابل": "مطحنه توابل",
  };
  return categoryMap[category] || category;
};

/**
 * Get Arabic part type name
 */
const getPartTypeArabic = (partType) => {
  const typeMap = {
    motor: "محرك",
    component: "مكون",
    assembly: "تجميع",
    packaging: "تغليف",
    heating_element: "عنصر تسخين",
    coupon: "كوبون",
  };
  return typeMap[partType] || partType;
};

// ============================================================================
// API FUNCTIONS - EXACT BACKEND ENDPOINT MAPPING (stock.md)
// ============================================================================

export const stockAPI = {
  /**
   * GET /api/stock/items
   * Backend: List all stock items, with optional filtering by type.
   * Response: { success, data: [items], message }
   */
  async getStockItems(params = {}) {
    if (!params.type) params.type = "product";
    return deduplicateRequest(
      async () => {
        try {
          const response = await backendApi.get("/api/stock/items", { params });
          return {
            success: true,
            data: {
              items: response.data?.map(transformBackendStockItem) || [],
              pagination: {},
              total: response.data?.length || 0,
            },
            message: "تم جلب عناصر المخزون بنجاح",
          };
        } catch (error) {
          logger.error("Error fetching stock items:", error);
          return {
            success: false,
            data: { items: [], pagination: {}, total: 0 },
            message: getErrorMessage(error),
          };
        }
      },
      "/api/stock/items",
      params,
      { useCache: true, ttl: 60000 }
    );
  },

  /**
   * GET /api/stock/items/{item_id}
   * Backend: Get a single stock item by its ID.
   * Response: { success, data: item, message }
   */
  async getStockItemById(itemId) {
    return deduplicateRequest(
      async () => {
        try {
          const response = await backendApi.get(`/api/stock/items/${itemId}`);
          return {
            success: true,
            data: transformBackendStockItem(response.data),
            message: "تم جلب العنصر بنجاح",
          };
        } catch (error) {
          logger.error(`Error fetching stock item ${itemId}:`, error);
          return {
            success: false,
            data: null,
            message: getErrorMessage(error),
          };
        }
      },
      `/api/stock/items/${itemId}`,
      { itemId },
      { useCache: true, ttl: 120000 }
    );
  },

  /**
   * PUT /api/stock/items/{item_id}
   * Backend: Update stock item details (name, sku, active status).
   * Response: { success, data: updated_item, message }
   */
  async updateStockItem(itemId, payload) {
    try {
      const response = await backendApi.put(`/api/stock/items/${itemId}`, payload);
      return {
        success: true,
        data: transformBackendStockItem(response.data),
        message: "تم تحديث العنصر بنجاح",
      };
    } catch (error) {
      logger.error(`Error updating stock item ${itemId}:`, error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },


  /**
   * DELETE /api/stock/items/{item_id}
   * Backend: Delete a stock item (part or product).
   * Response: { success, data: { message, item_id }, message }
   */
  async deleteStockItem(itemId) {
    try {
      const response = await backendApi.delete(`/api/stock/items/${itemId}`);
      return {
        success: true,
        data: response.data,
        message: response.data?.message || "تم حذف العنصر بنجاح",
      };
    } catch (error) {
      logger.error(`Error deleting stock item ${itemId}:`, error);
      
      // Handle 409 Conflict (item has dependencies)
      if (error.response?.status === 409) {
        const errorMessage = error.response.data?.error || error.response.data?.message;
        return {
          success: false,
          data: null,
          message: errorMessage || "لا يمكن حذف العنصر: مرتبط بطلبات خدمة أو حركات مخزون",
        };
      }
      
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  /**
   * POST /api/stock/manual
   * Backend: Manually adjust stock levels for valid or damaged items.
   * Response: { success, data: { message, item }, message }
   */
  async manualStockAdjustment(payload) {
    try {
      const response = await backendApi.post("/api/stock/manual", payload);
      return {
        success: true,
        data: {
          ...response.data,
          item: transformBackendStockItem(response.data.item),
        },
        message: response.data.message || "تم تعديل المخزون بنجاح",
      };
    } catch (error) {
      console.error("Error with manual stock adjustment:", error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  /**
   * POST /api/stock/items/{item_id}/adjust
   * Backend: Adjust stock for an item with a delta.
   * Response: { success, data: updated_item, message }
   */
  async adjustStock(item_id, payload) {
    try {
      const response = await backendApi.post(
        `/api/stock/items/${item_id}/adjust`,
        payload
      );
      return {
        success: true,
        data: transformBackendStockItem(response.data),
        message: "تم تعديل المخزون بنجاح",
      };
    } catch (error) {
      logger.error("Error adjusting stock:", error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  /**
   * POST /api/stock/items/{product_id}/components
   * Backend: Add a component to a product.
   * Response: { success, data: { components }, message }
   */
  async addComponentToProduct(product_id, payload) {
    try {
      const response = await backendApi.post(
        `/api/stock/items/${product_id}/components`,
        payload
      );
      return {
        success: true,
        data: response.data,
        message: "تم إضافة المكون بنجاح",
      };
    } catch (error) {
      logger.error("Error adding component to product:", error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  /**
   * DELETE /api/stock/items/{product_id}/components/{component_id}
   * Backend: Remove a component from a product.
   * Response: { success, data: { components }, message }
   */
  async removeComponentFromProduct(product_id, component_id) {
    try {
      const response = await backendApi.delete(
        `/api/stock/items/${product_id}/components/${component_id}`
      );
      return {
        success: true,
        data: response.data,
        message: "تمت إزالة المكون بنجاح",
      };
    } catch (error) {
      logger.error("Error removing component from product:", error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  /**
   * GET /api/stock/movements
   * Backend: Get stock movement history with filtering
   * Response: { success, data: { data, pagination }, message }
   */
  async getStockMovements(params = {}) {
    return deduplicateRequest(
      async () => {
        try {
          const response = await backendApi.get("/api/stock/movements", { params });
          const responseData = response.data;
          return {
            success: true,
            data: {
              movements:
                responseData.data?.map(transformBackendStockMovement) || [],
              pagination: responseData.pagination || {},
              total: responseData.pagination?.total || 0,
            },
            message: "تم جلب حركات المخزون بنجاح",
          };
        } catch (error) {
          logger.error("Error fetching stock movements:", error);
          return {
            success: false,
            data: { movements: [], pagination: {}, total: 0 },
            message: getErrorMessage(error),
          };
        }
      },
      "/api/stock/movements",
      params,
      { useCache: true, ttl: 60000 }
    );
  },

  /**
   * POST /api/stock/movements
   * Backend: Create a new stock movement
   * Response: { success, data: movement_data, message }
   */
  async createStockMovement(payload) {
    try {
      const response = await backendApi.post("/api/stock/movements", payload);

      return {
        success: response.data.success,
        data: transformBackendStockMovement(response.data.data),
        message: response.data.message,
      };
    } catch (error) {
      logger.error("Error creating stock movement:", error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Get stock movements by item ID
   */
  async getStockMovementsByItem(itemId) {
    return this.getStockMovements({ item_id: itemId });
  },

  /**
   * Get products by calling getStockItems with type='product'
   */
  async getProducts(params = {}) {
    return this.getStockItems({ ...params, type: "product" });
  },

  /**
   * Get parts by calling getStockItems with type='part'
   */
  async getParts(params = {}) {
    return this.getStockItems({ ...params, type: "part" });
  },

  /**
   * Get all items (both products and parts) from stock
   * This makes two API calls and combines the results
   */
  async getItems(params = {}) {
    const requestParams = { ...params, type: undefined };
    return deduplicateRequest(
      async () => {
        try {
          const response = await backendApi.get("/api/stock/items", {
            params: requestParams,
          });
          return {
            success: true,
            data: response.data?.map(transformBackendStockItem) || [],
            message: "تم جلب جميع العناصر بنجاح",
          };
        } catch (error) {
          logger.error("Error fetching all items:", error);
          return {
            success: false,
            data: [],
            message: getErrorMessage(error),
          };
        }
      },
      "/api/stock/items",
      requestParams,
      { useCache: true, ttl: 60000 }
    );
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Transform backend stock item to frontend format
   */
  transformBackendStockItem,

  /**
   * Transform backend stock movement to frontend format
   */
  transformBackendStockMovement,

  /**
   * Get Arabic movement type name
   */
  getMovementTypeArabic,

  /**
   * Get Arabic condition name
   */
  getConditionArabic,

  /**
   * Get Arabic category name
   */
  getCategoryArabic,

  /**
   * Get Arabic part type name
   */
  getPartTypeArabic,

  /**
   * Export stock items to Excel
   * @param {string} itemType - 'product' or 'part' (optional)
   * @returns {Promise<Blob>} Excel file blob
   */
  async exportStockItems(itemType = null) {
    try {
      const params = itemType ? { item_type: itemType } : {};

      const response = await backendApi.get('/api/stock/export', {
        params,
        responseType: 'blob'
      });

      // Create blob from response
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
      const typeAr = itemType === 'product' ? 'منتجات' : itemType === 'part' ? 'قطع' : 'المخزون';
      const filename = `stock_${typeAr}_${timestamp}.xlsx`;

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: 'تم تصدير البيانات بنجاح' };
    } catch (error) {
      logger.error('Export stock items error:', error);
      return {
        success: false,
        message: getErrorMessage(error)
      };
    }
  },

  // Note: Several endpoints were removed due to authorization requirements.
  // See docs/api_endpoints.md for current authorized endpoints.
};

export default stockAPI;
