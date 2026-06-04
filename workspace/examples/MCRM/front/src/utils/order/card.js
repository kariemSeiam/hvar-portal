/**
 * Order Card Utilities - Centralized utilities for order card functionality
 * Provides comprehensive order card handling, data processing, and UI helpers
 * Optimized for Arabic RTL support and performance
 */

import {
  formatGregorianDate,
  formatTimeOnly,
  formatDateOnly,
  getRelativeTime,
} from "../core/date";
import { normalizeServiceType } from "../../constants/serviceTypes.js";

// Default note phrases for maintenance
export const DEFAULT_NOTE_PHRASES = [
  "فحص شامل",
  "تنظيف الجهاز",
  "تحديث البرمجيات",
  "استبدال قطعة",
  "إصلاح ميكانيكي",
  "معايرة الأجهزة",
  "اختبار الأداء",
  "صيانة وقائية",
];

/**
 * Get saved action data from order
 * @param {object} order - Order object
 * @returns {object} Saved action data
 */
export const getSavedActionData = (order) => {
  if (!order) return {};

  // Check for action data in various possible locations
  const actionData =
    order.actionData || order.action_data || order.latestActionData || {};

  return {
    newTrackingNumber:
      actionData.new_tracking_number || actionData.newTrackingNumber || "",
    notes: actionData.notes || "",
    actionType: actionData.action_type || actionData.actionType || "",
    timestamp: actionData.timestamp || actionData.created_at || null,
  };
};

/**
 * Get stored action data from order
 * @param {object} order - Order object
 * @returns {object} Stored action data
 */
export const getStoredActionData = (order) => {
  if (!order) return null;

  // Get the latest action data
  const actionData = getSavedActionData(order);

  // Only return if there's meaningful data
  if (actionData.newTrackingNumber || actionData.notes) {
    return actionData;
  }

  return null;
};

/**
 * Get latest action data from order
 * @param {object} order - Order object
 * @returns {object} Latest action data
 */
export const getLatestActionData = (order) => {
  if (!order) return null;

  // Check for timeline data
  if (
    order.timeline &&
    Array.isArray(order.timeline) &&
    order.timeline.length > 0
  ) {
    const latestEntry = order.timeline[order.timeline.length - 1];
    return {
      action: latestEntry.action,
      action_data: latestEntry.action_data || latestEntry.actionData,
      notes: latestEntry.notes,
      timestamp: latestEntry.timestamp,
    };
  }

  // Fallback to saved action data
  return getSavedActionData(order);
};

/**
 * Check if order is in read-only mode
 * @param {object} order - Order object
 * @returns {boolean} True if order is read-only
 */
export const isReadOnlyMode = (order) => {
  if (!order) return false;

  // Check if order is completed or failed
  if (
    order.status === "completed" ||
    order.status === "returned_to_hub" ||
    order.status === "failed"
  ) {
    return true;
  }

  // Check if it's a completed refund/replace action
  if (
    isRefundReplaceCompleted(order) ||
    isConfirmRefundReplaceCompleted(order)
  ) {
    return true;
  }

  return false;
};

/**
 * Check if refund/replace action is completed
 * @param {object} order - Order object
 * @returns {boolean} True if refund/replace is completed
 */
export const isRefundReplaceCompleted = (order) => {
  if (!order) return false;

  // Check if order has refund/replace completion indicators
  return (
    order.isRefundReplaceCompleted === true ||
    order.is_refund_replace_completed === true ||
    order.refundReplaceStatus === "completed" ||
    (order.latestAction === "refund_replace" &&
      (order.status === "completed" || order.status === "returned_to_hub"))
  );
};

/**
 * Check if confirm refund/replace action is completed
 * @param {object} order - Order object
 * @returns {boolean} True if confirm refund/replace is completed
 */
export const isConfirmRefundReplaceCompleted = (order) => {
  if (!order) return false;

  // Check if order has confirm refund/replace completion indicators
  return (
    order.isConfirmRefundReplaceCompleted === true ||
    order.is_confirm_refund_replace_completed === true ||
    order.confirmRefundReplaceStatus === "completed" ||
    (order.latestAction === "confirm_refund_replace" &&
      (order.status === "completed" || order.status === "returned_to_hub"))
  );
};

/**
 * Get order type label
 * @param {string} orderType - Order type
 * @returns {string} Arabic label for order type
 */
export const getOrderTypeLabel = (orderType) => {
  const labels = {
    normal: "عادي",
    return: "إرجاع",
    exchange: "استبدال",
    refund: "استرداد",
    warranty: "ضمان",
    repair: "إصلاح",
    maintenance: "صيانة",
  };

  return labels[orderType] || "عادي";
};

/**
 * Get order type badge variant
 * @param {string} orderType - Order type
 * @returns {string} Badge variant color
 */
export const getOrderTypeBadgeVariant = (orderType) => {
  const variants = {
    normal: "blue",
    return: "red",
    exchange: "purple",
    refund: "orange",
    warranty: "green",
    repair: "amber",
    maintenance: "blue",
  };

  return variants[orderType] || "blue";
};

/**
 * Get BOSTA data from order
 * @param {object} order - Order object
 * @returns {object} BOSTA shipping data
 */
export const getBostaData = (order) => {
  if (!order) return {};

  return {
    orderType: order.orderType || order.order_type || "normal",
    receiver: {
      name:
        order.receiver_name ||
        order.receiverName ||
        order.customer_name ||
        order.customerName ||
        "",
      phone:
        order.receiver_phone ||
        order.receiverPhone ||
        order.customer_phone ||
        order.customerPhone ||
        "",
      secondPhone:
        order.receiver_second_phone ||
        order.receiverSecondPhone ||
        order.customer_second_phone ||
        order.customerSecondPhone ||
        "",
      address:
        order.receiver_address ||
        order.receiverAddress ||
        order.customer_address ||
        order.customerAddress ||
        "",
    },
    shippingState:
      order.shipping_state || order.shippingState || order.status || "unknown",
    trackingNumber: order.tracking_number || order.trackingNumber || "",
    starPhone: order.star_phone || order.starPhone || "",
    attemptsCount: order.attempts_count || order.attemptsCount || 0,
    lastAttemptDate: order.last_attempt_date || order.lastAttemptDate || null,
  };
};

/**
 * Clean phone number and normalize to 01XXXXXXXXX format
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number in 01XXXXXXXXX format
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Normalize to 01XXXXXXXXX format
  if (cleaned.startsWith("201") && cleaned.length === 12) {
    return "0" + cleaned.substring(2);
  } else if (cleaned.startsWith("01") && cleaned.length === 11) {
    return cleaned;
  } else if (cleaned.startsWith("1") && cleaned.length === 10) {
    return "0" + cleaned;
  } else if (cleaned.length === 9) {
    return "01" + cleaned;
  }

  return cleaned;
};

/**
 * Get status variant for badges
 * @param {string} status - Order status
 * @returns {string} Badge variant
 */
export const getStatusVariant = (status) => {
  const variants = {
    received: "blue",
    inMaintenance: "amber",
    maintenancing: "amber",
    completed: "green",
    failed: "red",
    sending: "purple",
    pending_sending: "purple",
    returned: "gray",
    return_pending: "gray",
  };

  return variants[status] || "blue";
};

/**
 * Get status label in Arabic
 * @param {string} status - Order status
 * @returns {string} Arabic status label
 */
export const getStatusLabel = (status) => {
  const labels = {
    received: "مستلمة",
    inMaintenance: "قيد الصيانة",
    maintenancing: "قيد الصيانة",
    completed: "مكتملة",
    failed: "فاشلة",
    sending: "قيد الإرسال",
    pending_sending: "في انتظار الإرسال",
    returned: "مرتجعة",
    return_pending: "في انتظار الإرجاع",
  };

  return labels[status] || "غير محدد";
};

/**
 * Get state badge for order
 * @param {object} order - Order object
 * @returns {object} State badge configuration
 */
export const getStateBadge = (order) => {
  if (!order)
    return { label: "غير محدد", icon: "QuestionMarkCircle", variant: "gray" };

  // Determine state based on order properties
  // Check if this is a return order via order type
  if (
    order.order_type === "Customer Return Pickup" ||
    order.order_type === "Exchange" ||
    order.isReturnOrder
  ) {
    return { label: "إرجاع", icon: "ArrowUturnLeft", variant: "orange" };
  }

  // Check if this is a replacement order via service action type
  if (
    order.serviceActionType === "replacement" ||
    order.service_action_type === "replacement"
  ) {
    return { label: "استبدال", icon: "Refresh", variant: "purple" };
  }

  if (order.priority === "high" || order.priority === "urgent") {
    return { label: "عاجل", icon: "ExclamationTriangle", variant: "red" };
  }

  if (order.warranty || order.isWarranty) {
    return { label: "ضمان", icon: "ShieldCheck", variant: "green" };
  }

  return { label: "عادي", icon: "Package", variant: "blue" };
};

/**
 * Enhanced Order Actions Configuration - Team-Friendly UX
 * Centralized action definitions with step-by-step workflows
 */
export const ORDER_ACTION_CONFIGS = {
  // Maintenance Actions - Simple for team members
  start_maintenance: {
    id: "start_maintenance",
    label: "بدء الصيانة",
    subtitle: "إنشاء طلب صيانة جديد",
    description: "سيتم إنشاء إجراء صيانة وإرسال العنصر للمركز الفني",
    icon: "Settings",
    color: "blue",
    variant: "primary",
    steps: [
      { label: "تحديد المشكلة", field: "problem_description", required: true },
      { label: "تقدير التكلفة", field: "estimated_cost", required: false },
      { label: "إضافة ملاحظات", field: "notes", required: false },
    ],
    successMessage: "تم إنشاء طلب الصيانة بنجاح",
    confirmationRequired: false,
    category: "maintenance",
  },

  // Part Replacement - Enhanced workflow
  start_part_replacing: {
    id: "start_part_replacing",
    label: "بدء استبدال قطعة",
    subtitle: "طلب قطعة بديلة من المخزون",
    description: "سيتم حجز القطعة البديلة من المخزون وإنشاء رقم تتبع جديد",
    icon: "Wrench",
    color: "orange",
    variant: "primary",
    steps: [
      {
        label: "اختيار القطعة البديلة",
        field: "replacement_parts",
        required: true,
      },
      { label: "تحديد التكلفة", field: "estimated_cost", required: false },
      { label: "إضافة تفاصيل", field: "notes", required: false },
    ],
    successMessage: "تم إنشاء طلب استبدال القطعة بنجاح",
    confirmationRequired: true,
    category: "replacement",
  },

  // Full Replacement - Enhanced workflow
  start_full_replacing: {
    id: "start_full_replacing",
    label: "بدء الاستبدال الكامل",
    subtitle: "طلب منتج بديل كامل",
    description: "سيتم حجز منتج بديل من المخزون وإنشاء رقم تتبع جديد",
    icon: "Package",
    color: "purple",
    variant: "primary",
    steps: [
      {
        label: "اختيار المنتج البديل",
        field: "replacement_product",
        required: true,
      },
      { label: "تحديد التكلفة", field: "estimated_cost", required: false },
      { label: "إضافة تفاصيل", field: "notes", required: false },
    ],
    successMessage: "تم إنشاء طلب الاستبدال الكامل بنجاح",
    confirmationRequired: true,
    category: "replacement",
  },

  // Complete Actions - Simple confirmation
  complete_maintenance: {
    id: "complete_maintenance",
    label: "إكمال الصيانة",
    subtitle: "تأكيد إكمال الصيانة",
    description: "تأكيد أن الصيانة تمت بنجاح وإعادة العنصر للعميل",
    icon: "CheckCircle",
    color: "green",
    variant: "primary",
    steps: [
      { label: "تأكيد الإكمال", field: "completion_notes", required: false },
    ],
    successMessage: "تم إكمال الصيانة بنجاح",
    confirmationRequired: true,
    category: "completion",
  },

  complete_part_replacing: {
    id: "complete_part_replacing",
    label: "إكمال استبدال القطعة",
    subtitle: "تأكيد استبدال القطعة",
    description: "تأكيد أن القطعة تم استبدالها بنجاح",
    icon: "CheckCircle",
    color: "green",
    variant: "primary",
    steps: [
      { label: "تأكيد الاستبدال", field: "completion_notes", required: false },
    ],
    successMessage: "تم إكمال استبدال القطعة بنجاح",
    confirmationRequired: true,
    category: "completion",
  },

  complete_full_replacing: {
    id: "complete_full_replacing",
    label: "إكمال الاستبدال الكامل",
    subtitle: "تأكيد الاستبدال الكامل",
    description: "تأكيد أن المنتج تم استبداله بنجاح",
    icon: "CheckCircle",
    color: "green",
    variant: "primary",
    steps: [
      { label: "تأكيد الاستبدال", field: "completion_notes", required: false },
    ],
    successMessage: "تم إكمال الاستبدال الكامل بنجاح",
    confirmationRequired: true,
    category: "completion",
  },

  // Move to Hub Action
  move_to_hub: {
    id: "move_to_hub",
    label: "نقل للمركز",
    subtitle: "نقل الطلب للمركز",
    description: "نقل الطلب للمركز الفني للمعالجة",
    icon: "Truck",
    color: "gray",
    variant: "secondary",
    steps: [{ label: "تأكيد النقل", field: "transfer_notes", required: false }],
    successMessage: "تم نقل الطلب للمركز بنجاح",
    confirmationRequired: false,
    category: "transfer",
  },

  // Mark Failed Action
  mark_failed: {
    id: "mark_failed",
    label: "تسجيل فشل",
    subtitle: "تسجيل فشل المعالجة",
    description: "تسجيل أن المعالجة فشلت ولا يمكن إكمالها",
    icon: "AlertTriangle",
    color: "red",
    variant: "danger",
    steps: [
      { label: "سبب الفشل", field: "failure_reason", required: true },
      { label: "تفاصيل إضافية", field: "failure_notes", required: false },
    ],
    successMessage: "تم تسجيل فشل المعالجة",
    confirmationRequired: true,
    category: "failure",
  },
};

/**
 * Get dynamic actions based on order state - ENHANCED FOR TEAM UX
 * Uses centralized configuration with step-by-step workflows
 * @param {object} order - Order object
 * @returns {array} Available actions with enhanced configuration
 */
export const getDynamicActions = (order) => {
  if (!order) return [];

  const actions = [];

  // === EXACT BACKEND ORDER ACTIONS ONLY ===
  // Based on MaintenanceAction enum and valid transitions

  switch (order.status) {
    case "received":
      actions.push(
        ORDER_ACTION_CONFIGS.start_maintenance,
        ORDER_ACTION_CONFIGS.start_full_replacing,
        ORDER_ACTION_CONFIGS.start_part_replacing,
        ORDER_ACTION_CONFIGS.move_to_hub
      );
      break;

    case "in_maintenance":
      // From IN_MAINTENANCE status, valid transitions per backend:
      // → UNDER_FULL_REPLACING, UNDER_PART_REPLACING, RETURNED_TO_HUB
      actions.push(
        ORDER_ACTION_CONFIGS.complete_maintenance,
        ORDER_ACTION_CONFIGS.start_full_replacing,
        ORDER_ACTION_CONFIGS.start_part_replacing,
        ORDER_ACTION_CONFIGS.move_to_hub
      );
      break;

    case "under_full_replacing":
      // From UNDER_FULL_REPLACING status, valid transitions per backend:
      // → RETURNED_TO_HUB
      actions.push(
        ORDER_ACTION_CONFIGS.complete_full_replacing,
        ORDER_ACTION_CONFIGS.move_to_hub
      );
      break;

    case "under_part_replacing":
      // From UNDER_PART_REPLACING status, valid transitions per backend:
      // → RETURNED_TO_HUB
      actions.push(
        ORDER_ACTION_CONFIGS.complete_part_replacing,
        ORDER_ACTION_CONFIGS.move_to_hub
      );
      break;

    case "returned_to_hub":
      // Check if this is a return order that needs to be moved to hub
      const isReturnOrderCompleted =
        normalizeServiceType(order.service_action_type) === "return" ||
        order.order_type === "return" ||
        normalizeServiceType(order.action_type) === "return";

      if (
        isReturnOrderCompleted &&
        order.return_condition &&
        !order.isMovedToHub
      ) {
        // Return order is validated but not moved to hub - show move to hub action
        actions.push(ORDER_ACTION_CONFIGS.move_to_hub);
      }
      // FINAL STATE - No other transitions allowed per backend
      break;

    case "completed":
      // FINAL STATE - No transitions allowed per backend
      // Only viewing actions available
      break;

    case "failed":
      // FINAL STATE - No transitions allowed per backend
      // Only viewing actions available
      break;

    default:
      // Unknown status - no actions
      break;
  }

  // === UNIVERSAL ACTIONS (all statuses) ===

  // === CONDITIONAL ACTIONS ===

  // Add scanning actions based on status context
  if (["received", "in_maintenance"].includes(order.status)) {
    actions.push({
      id: "scan_receive",
      label: "مسح الاستلام",
      icon: "QrCode",
      color: "green",
      variant: "outline",
      description: "مسح رمز QR للاستلام",
    });
  }

  if (
    [
      "under_part_replacing",
      "under_full_replacing",
      "completed",
      "returned_to_hub",
    ].includes(order.status)
  ) {
    actions.push({
      id: "scan_send",
      label: "مسح الإرسال",
      icon: "QrCode",
      color: "blue",
      variant: "outline",
      description: "مسح رمز QR للإرسال",
    });
  }

  return actions;
};

/**
 * Get action configuration by ID
 * @param {string} actionId - Action ID
 * @returns {object} Action configuration or null
 */
export const getOrderActionConfig = (actionId) => {
  return ORDER_ACTION_CONFIGS[actionId] || null;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return "غير محدد";

  try {
    return formatGregorianDate(date);
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "تاريخ غير صحيح";
  }
};

/**
 * Convert order timeline to display format
 * @param {object} order - Order object
 * @returns {array} Display timeline entries
 */
export const convertToDisplayTimeline = (order) => {
  if (!order || !order.timeline || !Array.isArray(order.timeline)) {
    return [];
  }

  return order.timeline.map((entry) => ({
    ...entry,
    formattedDate: formatDate(entry.timestamp),
    relativeTime: getRelativeTime(entry.timestamp),
    actionTitle: getArabicActionTitle(
      entry.action,
      entry.action_data || entry.actionData
    ),
    icon: getTimelineIcon(entry.action),
  }));
};

/**
 * Get Arabic status title
 * @param {string} status - Status
 * @returns {string} Arabic title
 */
export const getArabicStatusTitle = (status) => {
  const titles = {
    received: "تم الاستلام",
    inMaintenance: "قيد الصيانة",
    maintenancing: "قيد الصيانة",
    completed: "تم الإكمال",
    failed: "فشل العملية",
    sending: "قيد الإرسال",
    pending_sending: "في انتظار الإرسال",
    returned: "تم الإرجاع",
    return_pending: "في انتظار الإرجاع",
  };

  return titles[status] || "حالة غير محددة";
};

/**
 * Get Arabic action title
 * @param {string} action - Action type
 * @param {object} actionData - Action data
 * @returns {string} Arabic action title
 */
export const getArabicActionTitle = (action, actionData = {}) => {
  const titles = {
    confirm: "تأكيد الطلب",
    receive: "استلام الطلب",
    start_maintenance: "بدء الصيانة",
    complete: "إكمال العملية",
    fail: "فشل العملية",
    send: "إرسال الطلب",
    return: "إرجاع الطلب",
    refund_replace: "استبدال/استرداد",
    confirm_refund_replace: "تأكيد الاستبدال",
  };

  const baseTitle = titles[action] || "إجراء غير محدد";

  // Add context if available
  if (actionData && actionData.notes) {
    return `${baseTitle} - ${actionData.notes}`;
  }

  return baseTitle;
};

/**
 * Get action icon
 * @param {string} actionType - Action type
 * @returns {JSX.Element} Icon component
 */
export const getActionIcon = (actionType) => {
  const icons = {
    confirm: "✓",
    receive: "📦",
    start_maintenance: "🔧",
    complete: "✅",
    fail: "❌",
    send: "🚚",
    return: "↩️",
    refund_replace: "🔄",
    confirm_refund_replace: "✅",
  };

  return icons[actionType] || "?";
};

/**
 * Get state icon
 * @param {string} iconName - Icon name
 * @returns {JSX.Element} Icon component
 */
export const getStateIcon = (iconName) => {
  const icons = {
    QuestionMarkCircle: "❓",
    ArrowUturnLeft: "↩️",
    Refresh: "🔄",
    ExclamationTriangle: "⚠️",
    ShieldCheck: "🛡️",
    Package: "📦",
  };

  return icons[iconName] || "📦";
};

/**
 * Get timeline icon
 * @param {string} action - Action type
 * @returns {JSX.Element} Timeline icon
 */
export const getTimelineIcon = (action) => {
  return getActionIcon(action);
};

/**
 * Format Egyptian phone number for display (01X XXXX XXXX)
 * @param {string} phone - Phone number
 * @returns {string} Formatted Egyptian phone in 01XXXXXXXXX format
 */
export const formatEgyptianPhone = (phone) => {
  if (!phone) return "";

  const cleaned = cleanPhoneNumber(phone);

  if (cleaned.startsWith("01") && cleaned.length === 11) {
    // Format as 01X XXXX XXXX
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }

  return cleaned;
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {string} message - Success message
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text, message = "تم النسخ!") => {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("Clipboard API not available, falling back to text selection");

    // Fallback method
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error("Failed to copy text:", fallbackError);
      document.body.removeChild(textArea);
      return false;
    }
  }
};

/**
 * Check if note is a default maintenance note
 * @param {string} notes - Notes text
 * @returns {boolean} True if default note
 */
export const isDefaultMaintenanceNote = (notes) => {
  if (!notes) return true;

  return DEFAULT_NOTE_PHRASES.some((phrase) =>
    notes.toLowerCase().includes(phrase.toLowerCase())
  );
};

// Export default utilities for easy access
export default {
  DEFAULT_NOTE_PHRASES,
  getSavedActionData,
  getStoredActionData,
  getLatestActionData,
  isReadOnlyMode,
  isRefundReplaceCompleted,
  isConfirmRefundReplaceCompleted,
  getOrderTypeLabel,
  getOrderTypeBadgeVariant,
  getBostaData,
  cleanPhoneNumber,
  getStatusVariant,
  getStatusLabel,
  getStateBadge,
  getDynamicActions,
  getOrderActionConfig,
  formatDate,
  convertToDisplayTimeline,
  getArabicStatusTitle,
  getArabicActionTitle,
  getActionIcon,
  getStateIcon,
  getTimelineIcon,
  formatEgyptianPhone,
  copyToClipboard,
  isDefaultMaintenanceNote,
};
