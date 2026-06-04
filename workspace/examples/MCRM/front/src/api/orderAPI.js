/**
 * Order API - UTILITY FUNCTIONS ONLY
 * NOTE: NO authorized /orders/* endpoints in api_endpoints.md
 * This file provides utility functions for order data transformation
 * No actual API calls are made here
 */

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transform backend order to frontend format
 * Follows exact backend structure from Order.to_dict()
 */
export const transformBackendOrder = (backendOrder) => {
  if (!backendOrder) return null;

  return {
    // Direct mapping from backend Order model
    _id: backendOrder.id,
    trackingNumber: backendOrder.tracking_number,

    // Status mapping
    status: backendOrder.status,
    uiStatus: getUIStatus(backendOrder.status),
    returnCondition: backendOrder.return_condition,

    // Customer information
    receiver: {
      fullName: backendOrder.customer_name || "",
      phone: backendOrder.customer_phone || "",
      secondPhone: backendOrder.customer_second_phone || "",
    },

    // Address information
    pickupAddress: {
      city: { nameAr: backendOrder.city || "" },
      zone: { nameAr: backendOrder.district || "" },
      firstLine: backendOrder.pickup_address || "",
    },
    dropOffAddress: {
      city: { nameAr: backendOrder.city || "" },
      zone: { nameAr: backendOrder.district || "" },
      firstLine: backendOrder.dropoff_address || "",
      buildingNumber: backendOrder.building_number || "",
      floor: backendOrder.floor || "",
      apartment: backendOrder.apartment || "",
    },

    // Financial information
    cod: backendOrder.cod_amount || 0,
    bostaFees: backendOrder.bosta_fees || 0,

    // Package information
    specs: {
      packageDetails: {
        itemsCount: backendOrder.items_count || 1,
      },
    },

    // Order type and shipping
    type: {
      code: 10,
      value: backendOrder.order_type || "Send",
    },
    orderType: backendOrder.order_type,
    shippingState: backendOrder.shipping_state,
    maskedState: backendOrder.masked_state,

    // Timestamps
    createdAt: backendOrder.created_at,
    updatedAt: backendOrder.updated_at,
    scannedAt: backendOrder.scanned_at,
    receivedAt: backendOrder.received_at,
    sentAt: backendOrder.sent_at,
    returnedAt: backendOrder.returned_at,

    // Bosta integration data
    bostaData: backendOrder.bosta_data || {},
    timeline: backendOrder.timeline_data || [],
    bostaProofImages: backendOrder.bosta_proof_images || [],
    returnSpecs: backendOrder.return_specs_data || {},

    // Return information - derived from order type
    isReturnOrder:
      backendOrder.order_type === "Customer Return Pickup" ||
      backendOrder.order_type === "Exchange",
    newTrackingNumber: backendOrder.new_tracking_number,

    // Service action integration
    isServiceActionOrder: backendOrder.is_service_action_order || false,
    serviceActionType: backendOrder.service_action_type,
    serviceActionId: backendOrder.service_action_id,

    // State mapping for UI components
    state: {
      value: mapBackendStatusToBostaState(backendOrder.status),
      code: getStatusCode(backendOrder.status),
      deliveryTime: backendOrder.updated_at,
    },
  };
};

/**
 * Map backend status to UI status for tab navigation
 */
const getUIStatus = (status) => {
  const statusMap = {
    received: "received",
    in_maintenance: "inMaintenance",
    completed: "completed",
    returned_to_hub: "completed",
    failed: "failed",
    returned: "returns",
  };
  return statusMap[status] || status;
};

/**
 * Map backend status to Bosta state for UI display
 */
export const mapBackendStatusToBostaState = (status) => {
  const statusMap = {
    received: "Picked Up",
    in_maintenance: "In Transit",
    completed: "Ready for Delivery",
    failed: "Failed",
    returned: "Returned",
  };
  return statusMap[status] || status;
};

/**
 * Get status code for backend status
 */
export const getStatusCode = (status) => {
  const codeMap = {
    received: 23,
    in_maintenance: 30,
    completed: 40,
    failed: 60,
    returned: 50,
  };
  return codeMap[status] || 10;
};

// Export utility functions only
export const orderAPI = {
  transformBackendOrder,
  mapBackendStatusToBostaState,
  getStatusCode,
  getUIStatus,
};

export default orderAPI;
