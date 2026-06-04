/**
 * Product API
 * NOTE: Most endpoints unauthorized - only /api/stock/* endpoints are authorized
 * All product/part management endpoints removed per api_endpoints.md
 */

import axiosInstance from "./axios";
import { ERROR_MESSAGES } from "../config/environment";
import logger from "../utils/core/logger";

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
    !url.startsWith("/api/stock/movements")
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
 * Transform backend product to frontend format
 * Direct mapping from backend Product.to_dict() - no unnecessary complexity
 */
const transformBackendProduct = (backendProduct) => {
  if (!backendProduct) return null;

  return {
    // Direct mapping from backend Product model - keep it simple
    id: backendProduct.id,
    sku: backendProduct.sku,
    name: backendProduct.name, // Pure Arabic name from backend
    name_ar: backendProduct.name, // Alias for frontend compatibility
    category: backendProduct.category,
    specifications: backendProduct.specifications || {},
    current_stock: backendProduct.current_stock || 0,
    current_stock_damaged: backendProduct.current_stock_damaged || 0,
    min_stock_level: backendProduct.min_stock_level || 5,
    max_stock_level: backendProduct.max_stock_level || 100,
    cost_price: backendProduct.cost_price,
    selling_price: backendProduct.selling_price,
    is_active: backendProduct.is_active || true,

    // Timestamps
    created_at: backendProduct.created_at,
    updated_at: backendProduct.updated_at,

    // Computed fields
    valid_stock:
      backendProduct.valid_stock ||
      backendProduct.current_stock - backendProduct.current_stock_damaged,
    is_low_stock: backendProduct.is_low_stock || false,
  };
};

/**
 * Transform backend part to frontend format
 * Direct mapping from backend Part.to_dict() - no unnecessary complexity
 */
const transformBackendPart = (backendPart) => {
  if (!backendPart) return null;

  return {
    // Direct mapping from backend Part model - keep it simple
    id: backendPart.id,
    part_sku: backendPart.part_sku,
    part_name: backendPart.part_name, // Pure Arabic name from backend
    part_type: backendPart.part_type,
    product_id: backendPart.product_id,
    current_stock: backendPart.current_stock || 0,
    current_stock_damaged: backendPart.current_stock_damaged || 0,
    min_stock_level: backendPart.min_stock_level || 5,
    max_stock_level: backendPart.max_stock_level || 100,
    serial_number: backendPart.serial_number,
    is_active: backendPart.is_active || true,
    cost_price: backendPart.cost_price,
    selling_price: backendPart.selling_price,

    // Timestamps
    created_at: backendPart.created_at,
    updated_at: backendPart.updated_at,

    // Computed fields
    valid_stock:
      backendPart.valid_stock ||
      backendPart.current_stock - backendPart.current_stock_damaged,
    is_low_stock: backendPart.is_low_stock || false,
  };
};

/**
 * Get Arabic category name
 * Supports both static enum categories and dynamic categories
 */
const getCategoryArabic = (category) => {
  // If category is an object (dynamic category), return its name
  if (typeof category === "object" && category.name) {
    return category.name;
  }

  // If category is a string (static enum), use the mapping
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
// API FUNCTIONS - EXACT BACKEND ENDPOINT MAPPING
// ============================================================================

export const productAPI = {
  /**
   * POST /api/stock/items
   * Authorized endpoint - Create a new stock item (product)
   */
  async createProduct(payload) {
    try {
      const stockPayload = {
        sku: payload.sku,
        name: payload.name,
        type: "product",
        user_id: payload.user_id || "system",
        quantity_on_hand: payload.quantity_on_hand || 0,
      };
      if (payload.price_customer != null && payload.price_customer !== '') {
        stockPayload.price_customer = parseFloat(payload.price_customer) || null;
      }
      if (payload.price_merchant != null && payload.price_merchant !== '') {
        stockPayload.price_merchant = parseFloat(payload.price_merchant) || null;
      }
      if (payload.components && payload.components.length > 0) {
        stockPayload.components = payload.components;
      }

      const response = await backendApi.post("/api/stock/items", stockPayload);

      return {
        success: true,
        data: response.data,
        message: "تم إنشاء المنتج بنجاح",
        id: response.data.id,
      };
    } catch (error) {
      logger.error("Error creating product:", error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  /**
   * POST /api/stock/items (with type: 'part')
   * Authorized endpoint - Create a new part
   */
  async createPart(payload) {
    try {
      // Prepare data for Stock API
      const stockPayload = {
        sku: payload.sku,
        name: payload.name,
        type: "part",
        user_id: payload.user_id || "system",
        quantity_on_hand: payload.quantity_on_hand || 0,
      };
      if (payload.price_customer != null && payload.price_customer !== '') {
        stockPayload.price_customer = parseFloat(payload.price_customer) || null;
      }
      if (payload.price_merchant != null && payload.price_merchant !== '') {
        stockPayload.price_merchant = parseFloat(payload.price_merchant) || null;
      }

      const response = await backendApi.post("/api/stock/items", stockPayload);

      return {
        success: true,
        data: response.data,
        message: "تم إنشاء القطعة بنجاح",
        id: response.data.id,
      };
    } catch (error) {
      logger.error("Error creating part:", error);
      return {
        success: false,
        data: null,
        message: getErrorMessage(error),
      };
    }
  },

  // Note: Product/part management endpoints were removed due to authorization requirements.
  // See docs/api_endpoints.md for current authorized endpoints.

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Transform backend product to frontend format
   */
  transformBackendProduct,

  /**
   * Transform backend part to frontend format
   */
  transformBackendPart,

  /**
   * Get Arabic category name
   */
  getCategoryArabic,

  /**
   * Get Arabic part type name
   */
  getPartTypeArabic,
};

export default productAPI;
