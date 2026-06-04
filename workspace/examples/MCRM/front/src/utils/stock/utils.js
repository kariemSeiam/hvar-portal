/**
 * Stock Utilities for HVAR Hub
 * Centralized utility functions for stock management with Arabic RTL support
 * Enhanced utilities for inventory management, validation, and data processing
 */

import { getRelativeTime } from "../core/date";

// Arabic RTL text utilities
export const arabicUtils = {
  formatNumber: (number) => {
    return new Intl.NumberFormat("ar-EG").format(number);
  },

  formatCurrency: (amount, currency = "EGP") => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  },

  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  formatRelativeTime: (dateString) => {
    return getRelativeTime(dateString);
  },
};

/**
 * Get stock status color classes
 */
export const getStockStatusColor = (status) => {
  const colors = {
    active:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700/60",
    low_stock:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60",
    out_of_stock:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700/60",
    inactive:
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700/60",
  };
  return colors[status] || colors.inactive;
};

/**
 * Get stock status label in Arabic
 */
export const getStockStatusLabel = (status) => {
  const labels = {
    active: "متوفر",
    low_stock: "مخزون منخفض",
    out_of_stock: "نفذ المخزون",
    inactive: "غير نشط",
  };
  return labels[status] || labels.active;
};

/**
 * Get stock status variant for badges
 */
export const getStockStatusVariant = (status) => {
  const variants = {
    active: "success",
    low_stock: "warning",
    out_of_stock: "error",
    inactive: "secondary",
  };
  return variants[status] || variants.active;
};

/**
 * Get item status based on stock levels
 */
export const getItemStatus = (item) => {
  // Check if item is inactive (active field can be 0, false, or explicitly false)
  if (item.active === 0 || item.active === false) return "inactive";

  // Calculate valid stock based on stock_items table schema
  const quantityOnHand =
    item.quantity_on_hand || item.quantityOnHand || item.current_stock || 0;
  const quantityReserved = item.quantity_reserved || item.quantityReserved || 0;
  const quantityDamaged =
    item.quantity_damaged ||
    item.quantityDamaged ||
    item.current_stock_damaged ||
    0;

  const validStock = quantityOnHand - quantityDamaged;
  const availableStock = quantityOnHand - quantityReserved;

  if (availableStock <= 0) return "out_of_stock";

  const threshold = item.min_stock_level || item.alert_quantity || 5;

  if (availableStock <= threshold) return "low_stock";
  return "active";
};

/**
 * Get stock movement type label in Arabic
 */
export const getMovementTypeLabel = (movementType) => {
  const labels = {
    // Main movement types
    MANUAL: "تعديل يدوي",
    SEND: "إرسال",
    RECEIVE: "استلام",
    COMMIT_SEND: "صرف",
    RESERVE: "حجز",
    CANCEL_RESERVATION: "فك حجز",

    // Assembly operations
    ASSEMBLE: "تجميع",
    DISASSEMBLE: "فك",
    ASSEMBLY_PART_OUT: "استهلاك للتجميع",
    ASSEMBLY_PRODUCT_IN: "إنتاج من تجميع",

    // Repair and damage operations
    REPAIR_VALID: "إصلاح",
    DAMAGE_IN: "إدخال تالف",
    SALVAGE_IN: "استعادة",

    // Return operations
    RETURN_VALID: "مرتجع صالح",
    RETURN_DAMAGED: "مرتجع تالف",
  };
  return labels[movementType] || movementType;
};

/**
 * Get item condition label in Arabic
 */
export const getItemConditionLabel = (condition) => {
  const labels = {
    valid: "سليم",
    damaged: "تالف",
  };
  return labels[condition] || condition;
};

/**
 * Get item condition color
 */
export const getItemConditionColor = (condition) => {
  const colors = {
    valid: "text-green-600 dark:text-green-400",
    damaged: "text-red-600 dark:text-red-400",
  };
  return colors[condition] || colors.valid;
};

/**
 * Format stock quantity with proper sign
 */
export const formatStockQuantity = (quantity, movementType) => {
  if (movementType === "send") {
    return `-${Math.abs(quantity)}`;
  }
  return `+${Math.abs(quantity)}`;
};

/**
 * Get stock movement icon
 */
export const getMovementIcon = (movementType) => {
  const icons = {
    // Main movement types
    MANUAL: "edit",
    SEND: "arrow-up-right",
    RECEIVE: "arrow-down-left",
    COMMIT_SEND: "arrow-up-right",
    RESERVE: "lock",
    CANCEL_RESERVATION: "unlock",

    // Assembly operations
    ASSEMBLE: "plus-circle",
    DISASSEMBLE: "minus-circle",
    ASSEMBLY_PART_OUT: "minus-circle",
    ASSEMBLY_PRODUCT_IN: "plus-circle",

    // Repair and damage operations
    REPAIR_VALID: "wrench",
    DAMAGE_IN: "alert-triangle",
    SALVAGE_IN: "recycle",

    // Return operations
    RETURN_VALID: "arrow-down-left",
    RETURN_DAMAGED: "alert-triangle",
  };
  return icons[movementType] || "activity";
};

/**
 * Calculate stock percentage
 */
export const calculateStockPercentage = (current, max) => {
  if (!max || max <= 0) return 0;
  return Math.round((current / max) * 100);
};

/**
 * Get stock level indicator
 */
export const getStockLevelIndicator = (percentage) => {
  if (percentage >= 80) return "high";
  if (percentage >= 50) return "medium";
  if (percentage >= 20) return "low";
  return "critical";
};

/**
 * Get stock level color
 */
export const getStockLevelColor = (level) => {
  const colors = {
    high: "text-green-600 dark:text-green-400",
    medium: "text-blue-600 dark:text-blue-400",
    low: "text-amber-600 dark:text-amber-400",
    critical: "text-red-600 dark:text-red-400",
  };
  return colors[level] || colors.medium;
};

/**
 * Format stock value with currency
 */
export const formatStockValue = (value, currency = "EGP") => {
  if (!value || value <= 0) return `0 ${currency}`;
  return `${value.toLocaleString("ar-EG")} ${currency}`;
};

/**
 * Get low stock threshold
 */
export const getLowStockThreshold = (item) => {
  if (item.min_stock_level !== undefined) return item.min_stock_level;
  if (item.alert_quantity !== undefined) return item.alert_quantity;
  return 5; // Default threshold
};

/**
 * Check if item needs attention
 */
export const needsStockAttention = (item) => {
  const validStock = item.valid_stock !== undefined
    ? item.valid_stock
    : (item.current_stock || 0) - (item.current_stock_damaged || 0);

  const threshold = getLowStockThreshold(item);
  return validStock <= threshold;
};

/**
 * Get stock alert level
 */
export const getStockAlertLevel = (item) => {
  if (!item.is_active) return "none";

  const validStock = item.current_stock - (item.current_stock_damaged || 0);
  const threshold = getLowStockThreshold(item);

  if (validStock === 0) return "critical";
  if (validStock <= threshold) return "warning";
  return "normal";
};

/**
 * Get stock alert color
 */
export const getStockAlertColor = (level) => {
  const colors = {
    normal: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    critical: "text-red-600 dark:text-red-400",
    none: "text-gray-600 dark:text-gray-400",
  };
  return colors[level] || colors.none;
};

/**
 * Get stock alert icon
 */
export const getStockAlertIcon = (level) => {
  const icons = {
    normal: "✅",
    warning: "⚠️",
    critical: "🚨",
    none: "⏸️",
  };
  return icons[level] || icons.none;
};

/**
 * Format stock movement date
 */
export const formatMovementDate = (dateString) => {
  if (!dateString) return "غير محدد";

  try {
    // Parse the date string properly, handling GMT timezone
    let date;

    if (dateString.includes("GMT")) {
      // For GMT strings like "Mon, 27 Oct 2025 20:17:45 GMT"
      // Parse as UTC to avoid timezone conversion issues
      const utcString = dateString.replace(" GMT", "") + " UTC";
      date = new Date(utcString);
    } else {
      // For non-GMT strings, assume they are already in local timezone
      date = new Date(dateString);
    }

    // Ensure we're working with a valid date
    if (isNaN(date.getTime())) {
      console.warn("Invalid date format received:", dateString);
      return "تاريخ غير صحيح";
    }

    // Format date in Egyptian locale with proper timezone handling
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting movement date:", error, dateString);
    return "تاريخ غير صحيح";
  }
};

/**
 * Format relative time for stock movements
 */
export const formatRelativeTime = (dateString) => {
  return arabicUtils.formatRelativeTime(dateString);
};

/**
 * Get stock movement summary
 */
export const getMovementSummary = (movements) => {
  if (!movements || movements.length === 0) {
    return {
      total: 0,
      byType: {},
      byCondition: {},
      recent: [],
    };
  }

  const summary = {
    total: movements.length,
    byType: {},
    byCondition: {},
    recent: movements.slice(0, 5),
  };

  movements.forEach((movement) => {
    // Count by movement type
    const type = movement.movement_type || "unknown";
    summary.byType[type] = (summary.byType[type] || 0) + 1;

    // Count by condition
    const condition = movement.condition || "unknown";
    summary.byCondition[condition] = (summary.byCondition[condition] || 0) + 1;
  });

  return summary;
};

/**
 * Get comprehensive stock statistics
 */
export const getStockStatistics = (items) => {
  if (!items || items.length === 0) {
    return {
      total: 0,
      active: 0,
      lowStock: 0,
      outOfStock: 0,
      averageStock: 0,
      products: 0,
      parts: 0,
      validStock: 0,
      damagedStock: 0,
    };
  }

  const stats = {
    total: items.length,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
    totalStock: 0,
    products: 0,
    parts: 0,
    validStock: 0,
    damagedStock: 0,
  };

  items.forEach((item) => {
    const status = getItemStatus(item);
    if (status === "active") stats.active++;
    if (status === "low_stock") stats.lowStock++;
    if (status === "out_of_stock") stats.outOfStock++;

    // Count by type
    if (item.sku) stats.products++;
    if (item.part_sku) stats.parts++;

    // Stock calculations
    const totalStock = item.total_stock || 0;
    const damagedStock = item.damaged_stock || 0;
    const validStock = item.valid_stock !== undefined
      ? item.valid_stock
      : totalStock - damagedStock;

    stats.totalStock += totalStock;
    stats.validStock += validStock;
    stats.damagedStock += damagedStock;
  });

  stats.averageStock =
    stats.total > 0 ? Math.round(stats.totalStock / stats.total) : 0;

  return stats;
};

/**
 * Enhanced stock validation with Arabic error messages
 */
export const validateStockData = (data, type = "item") => {
  const errors = [];
  const warnings = [];

  switch (type) {
    case "product":
      if (!data.sku || data.sku.trim() === "") {
        errors.push("رمز المنتج (SKU) مطلوب");
      }
      if (!data.name || data.name.trim() === "") {
        errors.push("اسم المنتج بالعربية مطلوب");
      }
      if (data.current_stock < 0) {
        errors.push("المخزون الحالي لا يمكن أن يكون سالب");
      }
      if (data.alert_quantity < 0) {
        errors.push("كمية التنبيه لا يمكن أن تكون سالبة");
      }
      if (data.current_stock_damaged > data.current_stock) {
        errors.push("المخزون التالف لا يمكن أن يتجاوز المخزون الإجمالي");
      }
      if (data.current_stock_damaged < 0) {
        errors.push("المخزون التالف لا يمكن أن يكون سالب");
      }
      break;

    case "part":
      if (!data.part_sku || data.part_sku.trim() === "") {
        errors.push("رمز القطعة (SKU) مطلوب");
      }
      if (!data.part_name || data.part_name.trim() === "") {
        errors.push("اسم القطعة مطلوب");
      }
      if (data.current_stock < 0) {
        errors.push("المخزون الحالي لا يمكن أن يكون سالب");
      }
      if (data.min_stock_level < 0) {
        errors.push("الحد الأدنى للمخزون لا يمكن أن يكون سالب");
      }
      if (data.current_stock_damaged > data.current_stock) {
        errors.push("المخزون التالف لا يمكن أن يتجاوز المخzون الإجمالي");
      }
      break;

    case "movement":
      if (!data.item_type || !["product", "part"].includes(data.item_type)) {
        errors.push('نوع العنصر يجب أن يكون "product" أو "part"');
      }
      if (!data.item_id || data.item_id <= 0) {
        errors.push("معرف العنصر غير صحيح");
      }
      if (!data.quantity_change || data.quantity_change === 0) {
        errors.push("تغيير الكمية يجب أن يكون غير صفر");
      }
      if (
        !data.movement_type ||
        !["maintenance", "send", "receive"].includes(data.movement_type)
      ) {
        errors.push("نوع الحركة غير صحيح");
      }
      if (!data.condition || !["valid", "damaged"].includes(data.condition)) {
        errors.push('حالة العنصر يجب أن تكون "valid" أو "damaged"');
      }
      break;

    default:
      errors.push("نوع البيانات غير مدعوم");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
  };
};

/**
 * Enhanced stock operations with validation
 */
export const processStockOperation = async (operation, stockAPI) => {
  try {
    // Validate operation data
    const validation = validateStockData(operation.data, operation.type);
    if (!validation.isValid) {
      return {
        success: false,
        message: "بيانات العملية غير صحيحة",
        errors: validation.errors,
        data: null,
      };
    }

    // Execute operation
    let result;
    switch (operation.type) {
      case "maintenance_adjustment":
        result = await stockAPI.adjustStock(operation.data);
        break;
      case "send_items":
        result = await stockAPI.createStockMovement({
          ...operation.data,
          movement_type: "send",
        });
        break;
      case "receive_items":
        result = await stockAPI.createStockMovement({
          ...operation.data,
          movement_type: "receive",
        });
        break;
      case "receive_returns":
        result = await stockAPI.createStockMovement({
          ...operation.data,
          movement_type: "receive",
        });
        break;
      default:
        result = {
          success: false,
          message: `نوع العملية غير مدعوم: ${operation.type}`,
          data: null,
        };
    }

    return result;
  } catch (error) {
    console.error("Error processing stock operation:", error);
    return {
      success: false,
      message: "حدث خطأ أثناء تنفيذ العملية",
      data: null,
      error: error.message,
    };
  }
};

/**
 * Enhanced stock analytics and statistics
 */
export const getStockAnalytics = (items) => {
  const analytics = {
    total: items.length,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0,
    active: 0,
    inactive: 0,
    categories: {},
    types: {},
    stockLevels: {
      healthy: 0,
      low: 0,
      critical: 0,
      out: 0,
    },
    recentActivity: 0,
    averageStock: 0,
    stockUtilization: 0,
  };

  items.forEach((item) => {
    // Basic counts
    if (item.is_active !== false) analytics.active++;
    else analytics.inactive++;

    // Stock calculations
    const validStock =
      item.valid_stock !== undefined
        ? item.valid_stock
        : (item.current_stock || 0) - (item.current_stock_damaged || 0);
    const totalStock =
      item.total_stock !== undefined
        ? item.total_stock
        : item.current_stock || 0;
    const alertQuantity = item.alert_quantity || item.min_stock_level || 10;

    analytics.totalStock += totalStock;

    // Stock level analysis
    if (validStock === 0) {
      analytics.outOfStock++;
      analytics.stockLevels.out++;
    } else if (validStock <= alertQuantity * 0.5) {
      analytics.lowStock++;
      analytics.stockLevels.critical++;
    } else if (validStock <= alertQuantity) {
      analytics.lowStock++;
      analytics.stockLevels.low++;
    } else {
      analytics.stockLevels.healthy++;
    }

    // Category analysis
    const category = item.category || item.part_type || "غير محدد";
    if (!analytics.categories[category]) {
      analytics.categories[category] = { count: 0, stock: 0 };
    }
    analytics.categories[category].count++;
    analytics.categories[category].stock += totalStock;

    // Type analysis
    const type = item.item_type || (item.part_sku ? "part" : "product");
    if (!analytics.types[type]) {
      analytics.types[type] = { count: 0, stock: 0 };
    }
    analytics.types[type].count++;
    analytics.types[type].stock += totalStock;
  });

  // Calculate averages and percentages
  analytics.averageStock =
    analytics.total > 0
      ? Math.round(analytics.totalStock / analytics.total)
      : 0;
  analytics.stockUtilization =
    analytics.total > 0
      ? Math.round((analytics.active / analytics.total) * 100)
      : 0;

  return analytics;
};

/**
 * Enhanced stock filtering with Arabic RTL support
 */
export const filterStockItems = (items, filters = {}) => {
  if (!items || items.length === 0) return items;

  return items.filter((item) => {
    // Search term filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const name = (item.name || item.part_name || "").toLowerCase();
      const sku = (item.sku || item.part_sku || "").toLowerCase();

      if (!name.includes(search) && !sku.includes(search)) {
        return false;
      }
    }

    // Item type filter
    if (filters.itemType && filters.itemType !== "all") {
      const itemType = item.sku ? "product" : "part";
      if (itemType !== filters.itemType) {
        return false;
      }
    }

    // Category filter (for products)
    if (filters.category && filters.category !== "all") {
      if (item.category !== filters.category) {
        return false;
      }
    }

    // Part type filter (for parts)
    if (filters.partType && filters.partType !== "all") {
      if (item.part_type !== filters.partType) {
        return false;
      }
    }

    // Stock status filter
    if (filters.stockStatus && filters.stockStatus !== "all") {
      const status = getItemStatus(item);
      if (status !== filters.stockStatus) {
        return false;
      }
    }

    // Low stock filter
    if (filters.lowStockOnly) {
      if (!needsStockAttention(item)) {
        return false;
      }
    }

    // Date range filter (for movements)
    if (filters.dateFrom || filters.dateTo) {
      const itemDate = new Date(item.created_at || item.updated_at);
      if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && itemDate > new Date(filters.dateTo)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Enhanced sorting with Arabic RTL support
 */
export const sortStockItems = (items, sortBy = "name", sortOrder = "asc") => {
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "name":
        aValue = (a.name || a.part_name || "").toLowerCase();
        bValue = (b.name || b.part_name || "").toLowerCase();
        break;
      case "sku":
        aValue = (a.sku || a.part_sku || "").toLowerCase();
        bValue = (b.sku || b.part_sku || "").toLowerCase();
        break;
      case "stock":
        aValue = a.current_stock || 0;
        bValue = b.current_stock || 0;
        break;
      case "valid_stock":
        aValue = (a.current_stock || 0) - (a.current_stock_damaged || 0);
        bValue = (b.current_stock || 0) - (b.current_stock_damaged || 0);
        break;
      case "status":
        aValue = getItemStatus(a);
        bValue = getItemStatus(b);
        break;
      case "available":
        aValue = (a.quantity_on_hand || a.quantityOnHand || 0) - (a.quantity_reserved || a.quantityReserved || 0);
        bValue = (b.quantity_on_hand || b.quantityOnHand || 0) - (b.quantity_reserved || b.quantityReserved || 0);
        break;
      case "created_at":
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      default:
        aValue = a.name || a.part_name || "";
        bValue = b.name || b.part_name || "";
    }

    if (sortOrder === "desc") {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  return sortedItems;
};
