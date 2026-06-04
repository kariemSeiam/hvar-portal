/**
 * Service Action API - UTILITY FUNCTIONS ONLY
 * NOTE: /services/* endpoints are NOT authorized in api_endpoints.md
 * Only /tickets/* and /hub/* endpoints are authorized
 * This file provides utility functions for service action data transformation
 * No actual API calls are made here
 */

import {
  normalizeServiceType,
  getServiceTypeLabelAr,
  SERVICE_TYPE_LABELS_AR_FULL,
} from "../constants/serviceTypes.js";

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transform backend service action to frontend format
 * Follows exact backend structure from ServiceAction.to_dict()
 */
export const transformBackendServiceAction = (backendAction) => {
  if (!backendAction) {
    console.warn(
      "transformBackendServiceAction: backendAction is null/undefined"
    );
    return null;
  }

  return {
    // Direct mapping from backend ServiceAction model
    id: backendAction.id,
    _id: backendAction.id,
    actionType: backendAction.action_type,
    status: backendAction.status,
    customerPhone: backendAction.customer_phone,
    customerFirstName: backendAction.customer_first_name,
    customerLastName: backendAction.customer_last_name,
    customerFullName: backendAction.customer_full_name,
    customerSecondPhone: backendAction.customer_second_phone,
    originalTrackingNumber: backendAction.original_tracking_number,
    productId: backendAction.product_id,
    partId: backendAction.part_id,
    refundAmount: backendAction.refund_amount,
    notes: backendAction.notes,
    actionData: backendAction.action_data || {},

    // New tracking information
    newTrackingNumber: backendAction.new_tracking_number,

    // Status timestamps
    createdAt: backendAction.created_at,
    updatedAt: backendAction.updated_at,
    confirmedAt: backendAction.confirmed_at,
    pendingReceiveAt: backendAction.pending_receive_at,
    pendingSendAt: backendAction.pending_send_at,
    maintenancingAt: backendAction.maintenancing_at,
    partReplacingAt: backendAction.part_replacing_at,
    fullReplacingAt: backendAction.full_replacing_at,
    completedAt: backendAction.completed_at,
    failedAt: backendAction.failed_at,

    // Integration fields
    isIntegratedWithMaintenance:
      backendAction.is_integrated_with_maintenance || false,
    maintenanceOrderId: backendAction.maintenance_order_id,

    // Items information
    itemsToSend: backendAction.items_to_send || [],
    itemsReceived: backendAction.items_to_receive || [],

    // Return information
    returnCondition: backendAction.return_condition,
    returnNotes: backendAction.return_notes,

    // Product and part information
    product: backendAction.product,
    part: backendAction.part,

    // Additional fields for compatibility
    customer_name:
      backendAction.customer_full_name || backendAction.customer_first_name,
    customer_phone: backendAction.customer_phone,
    original_tracking: backendAction.original_tracking_number,
    action_type: backendAction.action_type,

    // Frontend component compatibility fields
    service_action_type: backendAction.action_type,
    original_tracking_number: backendAction.original_tracking_number,

    // Status Arabic names
    statusArabic: getStatusArabic(backendAction.status),
    actionTypeArabic: getActionTypeArabic(backendAction.action_type),
  };
};

/**
 * Get Arabic status name
 */
export const getStatusArabic = (status) => {
  const statusMap = {
    created: "تم الإنشاء",
    confirmed: "تم التأكيد",
    pending_receive: "في انتظار الاستلام",
    pending_send: "في انتظار الإرسال",
    maintenancing: "تحت الصيانة",
    part_replacing: "استبدال قطعة",
    full_replacing: "استبدال كامل",
    completed: "مكتمل",
    failed: "فاشل",
    cancelled: "ملغي",
  };
  return statusMap[status] || status;
};

/**
 * Get Arabic action type name (legacy action_type strings + canonical service types)
 */
export const getActionTypeArabic = (actionType) => {
  if (actionType === undefined || actionType === null || String(actionType).trim() === "") {
    return "";
  }
  const canonical = normalizeServiceType(actionType);
  if (canonical) {
    return SERVICE_TYPE_LABELS_AR_FULL[canonical] ?? canonical;
  }
  const legacyOnly = {
    hub: "مركز الصيانة",
    part_replace: "استبدال قطعة",
    full_replace: "استبدال كامل",
    return_from_customer: "استرجاع من العميل",
  };
  const s = String(actionType).trim().toLowerCase();
  if (legacyOnly[s]) return legacyOnly[s];
  return getServiceTypeLabelAr(actionType, { short: false });
};

// Export utility functions only
export const serviceActionAPI = {
  transformBackendServiceAction,
  getStatusArabic,
  getActionTypeArabic,
};

export default serviceActionAPI;
