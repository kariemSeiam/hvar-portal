/**
 * Service Action Workflow Utilities
 * Centralized business logic for service action lifecycle management
 * Based on service_tickets.md documentation
 */

import {
  ServiceActionType,
  ServiceActionStatus,
} from "./types";
import { normalizeServiceTypeOrFallback } from "../../constants/serviceTypes.js";

/**
 * Get the complete workflow definition for a service action type
 * Now includes proper handling of pending send confirmation states
 */
export const getWorkflowDefinition = (actionType) => {
  // Map API service type to enum value first
  const mappedType = mapApiServiceTypeToEnum(actionType);

  const workflows = {
    [ServiceActionType.MAINTENANCE]: {
      states: [
        {
          id: ServiceActionStatus.PENDING,
          label: "في الانتظار",
          progress: 10,
          category: "pending",
        },
        {
          id: ServiceActionStatus.CONFIRMED,
          label: "مؤكدة",
          progress: 25,
          category: "confirmed",
        },
        {
          id: ServiceActionStatus.IN_PROCESS,
          label: "قيد المعالجة",
          progress: 40,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.READY_FOR_DISPATCH,
          label: "جاهزة للإرسال",
          progress: 60,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.SENT,
          label: "مرسلة",
          progress: 80,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.DELIVERED,
          label: "تم التسليم",
          progress: 95,
          category: "completed",
        },
        {
          id: ServiceActionStatus.COMPLETED,
          label: "مكتملة",
          progress: 100,
          category: "completed",
        },
      ],
      transitions: {
        [ServiceActionStatus.PENDING]: [ServiceActionStatus.CONFIRMED],
        [ServiceActionStatus.CONFIRMED]: [ServiceActionStatus.IN_PROCESS],
        [ServiceActionStatus.IN_PROCESS]: [
          ServiceActionStatus.READY_FOR_DISPATCH,
        ],
        [ServiceActionStatus.READY_FOR_DISPATCH]: [ServiceActionStatus.SENT],
        [ServiceActionStatus.SENT]: [ServiceActionStatus.DELIVERED],
        [ServiceActionStatus.DELIVERED]: [ServiceActionStatus.COMPLETED],
      },
    },
    [ServiceActionType.REPLACEMENT]: {
      states: [
        {
          id: ServiceActionStatus.PENDING,
          label: "في الانتظار",
          progress: 10,
          category: "pending",
        },
        {
          id: ServiceActionStatus.CONFIRMED,
          label: "مؤكدة",
          progress: 25,
          category: "confirmed",
        },
        {
          id: ServiceActionStatus.IN_PROCESS,
          label: "قيد المعالجة",
          progress: 40,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.READY_FOR_DISPATCH,
          label: "جاهزة للإرسال",
          progress: 60,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.SENT,
          label: "مرسلة",
          progress: 80,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.DELIVERED,
          label: "تم التسليم",
          progress: 95,
          category: "completed",
        },
        {
          id: ServiceActionStatus.COMPLETED,
          label: "مكتملة",
          progress: 100,
          category: "completed",
        },
      ],
      transitions: {
        [ServiceActionStatus.PENDING]: [ServiceActionStatus.CONFIRMED],
        [ServiceActionStatus.CONFIRMED]: [ServiceActionStatus.IN_PROCESS],
        [ServiceActionStatus.IN_PROCESS]: [
          ServiceActionStatus.READY_FOR_DISPATCH,
        ],
        [ServiceActionStatus.READY_FOR_DISPATCH]: [ServiceActionStatus.SENT],
        [ServiceActionStatus.SENT]: [ServiceActionStatus.DELIVERED],
        [ServiceActionStatus.DELIVERED]: [ServiceActionStatus.COMPLETED],
      },
    },
    [ServiceActionType.RETURN]: {
      states: [
        {
          id: ServiceActionStatus.PENDING,
          label: "في الانتظار",
          progress: 10,
          category: "pending",
        },
        {
          id: ServiceActionStatus.CONFIRMED,
          label: "مؤكدة",
          progress: 25,
          category: "confirmed",
        },
        {
          id: ServiceActionStatus.IN_PROCESS,
          label: "قيد المعالجة",
          progress: 50,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.COMPLETED,
          label: "مكتملة",
          progress: 100,
          category: "completed",
        },
      ],
      transitions: {
        [ServiceActionStatus.PENDING]: [ServiceActionStatus.CONFIRMED],
        [ServiceActionStatus.CONFIRMED]: [ServiceActionStatus.IN_PROCESS],
        [ServiceActionStatus.IN_PROCESS]: [ServiceActionStatus.COMPLETED],
      },
    },
    [ServiceActionType.SELL]: {
      states: [
        {
          id: ServiceActionStatus.PENDING,
          label: "في الانتظار",
          progress: 10,
          category: "pending",
        },
        {
          id: ServiceActionStatus.CONFIRMED,
          label: "مؤكدة",
          progress: 25,
          category: "confirmed",
        },
        {
          id: ServiceActionStatus.IN_PROCESS,
          label: "قيد التحضير",
          progress: 40,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.READY_FOR_DISPATCH,
          label: "جاهزة للإرسال",
          progress: 60,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.SENT,
          label: "مرسلة",
          progress: 80,
          category: "inProgress",
        },
        {
          id: ServiceActionStatus.COMPLETED,
          label: "مكتملة",
          progress: 100,
          category: "completed",
        },
      ],
      transitions: {
        [ServiceActionStatus.PENDING]: [ServiceActionStatus.CONFIRMED],
        [ServiceActionStatus.CONFIRMED]: [ServiceActionStatus.IN_PROCESS],
        [ServiceActionStatus.IN_PROCESS]: [
          ServiceActionStatus.READY_FOR_DISPATCH,
        ],
        [ServiceActionStatus.READY_FOR_DISPATCH]: [ServiceActionStatus.SENT],
        [ServiceActionStatus.SENT]: [
          ServiceActionStatus.RETURNED,
          ServiceActionStatus.COMPLETED,
        ],
        [ServiceActionStatus.RETURNED]: [ServiceActionStatus.COMPLETED],
      },
    },
  };

  return workflows[mappedType] || workflows[ServiceActionType.MAINTENANCE];
};

// Action Type Configuration - Enhanced for Team Creation UX
export const ACTION_CONFIGS = {
  // Maintenance Confirmation - Items are added during confirmation phase
  maintenancing_confirm: {
    requiresInput: true,
    inputFields: [
      "tracking_number",
      "cost",
      "items_to_send",
      "items_to_receive",
      "notes",
    ],
    title: "تأكيد الصيانة",
    subtitle: "تأكيد طلب الصيانة وتحديد العناصر",
    description: "سيتم تأكيد طلب الصيانة وتسجيل العناصر المستلمة والمرسلة",
    icon: "Settings",
    color: "orange",
    steps: [
      {
        label: "إنشاء رقم التتبع",
        field: "tracking_number",
        required: true,
      },
      {
        label: "العناصر للاستلام (من العميل)",
        field: "items_to_receive",
        required: false,
      },
      {
        label: "العناصر للإرسال (للعميل)",
        field: "items_to_send",
        required: false,
      },
      { label: "تحديد التكلفة", field: "cost", required: false },
      { label: "إضافة ملاحظات", field: "notes", required: false },
    ],
    successMessage: "تم تأكيد طلب الصيانة بنجاح",
    stockValidation: false,
    stockProcessing: true,
    note: "سيتم تسجيل العناصر المستلمة والمرسلة مع تحديث المخزون",
  },

  // Part Replacement Confirmation - Enhanced for team workflow
  part_replace_confirm: {
    requiresInput: true,
    inputFields: ["tracking_number", "cost", "items_to_send", "notes"],
    title: "تأكيد استبدال قطعة",
    subtitle: "طلب قطعة بديلة من المخزون",
    description: "سيتم حجز القطعة من المخزون وإنشاء رقم تتبع للعميل",
    icon: "Wrench",
    color: "blue",
    steps: [
      {
        label: "إنشاء رقم التتبع",
        field: "tracking_number",
        required: true,
      },
      {
        label: "اختيار القطعة البديلة",
        field: "items_to_send",
        required: true,
      },
      { label: "تحديد التكلفة", field: "cost", required: false },
      { label: "إضافة ملاحظات", field: "notes", required: false },
    ],
    successMessage: "تم تأكيد طلب استبدال القطعة بنجاح",
    stockValidation: true,
    stockProcessing: true,
    note: "سيتم حجز القطعة من المخزون تلقائياً",
  },

  // Full Replacement Confirmation - Enhanced for team workflow
  full_replace_confirm: {
    requiresInput: true,
    inputFields: ["tracking_number", "cost", "items_to_send", "notes"],
    title: "تأكيد استبدال كامل",
    subtitle: "طلب منتج بديل من المخزون",
    description: "سيتم حجز المنتج من المخزون وإنشاء رقم تتبع للعميل",
    icon: "Package",
    color: "green",
    steps: [
      {
        label: "إنشاء رقم التتبع",
        field: "tracking_number",
        required: true,
      },
      {
        label: "اختيار المنتج البديل",
        field: "items_to_send",
        required: true,
      },
      { label: "تحديد التكلفة", field: "cost", required: false },
      { label: "إضافة ملاحظات", field: "notes", required: false },
    ],
    successMessage: "تم تأكيد طلب الاستبدال الكامل بنجاح",
    stockValidation: true,
    stockProcessing: true,
    note: "سيتم حجز المنتج من المخزون تلقائياً",
  },

  // Return from Customer Confirmation
  return_from_customer_confirm: {
    requiresInput: true,
    inputFields: ["tracking_number", "refund_amount", "notes"],
    title: "تأكيد استلام من العميل",
    subtitle: "تسجيل استلام المنتج من العميل",
    description: "سيتم تسجيل استلام المنتج وتحديد مبلغ الاسترداد",
    icon: "RotateCcw",
    color: "yellow",
    steps: [
      {
        label: "رقم التتبع الأصلي",
        field: "tracking_number",
        required: true,
      },
      {
        label: "مبلغ الاسترداد (ج.م)",
        field: "refund_amount",
        required: true,
      },
      { label: "ملاحظات الاستلام", field: "notes", required: false },
    ],
    successMessage: "تم تأكيد استلام المنتج من العميل بنجاح",
    stockValidation: true,
    stockProcessing: true,
    note: "سيتم إضافة المنتج إلى المخزون تلقائياً",
  },

  // Service Action Status Updates
  maintenancing_in_progress: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "بدء الصيانة",
    subtitle: "تأكيد بدء عملية الصيانة",
    description: "سيتم تحديث حالة الطلب إلى قيد المعالجة",
    icon: "Settings",
    color: "orange",
    steps: [{ label: "ملاحظات إضافية", field: "notes", required: false }],
    successMessage: "تم تأكيد بدء الصيانة بنجاح",
    stockValidation: false,
    stockProcessing: false,
  },

  part_replace_in_progress: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "بدء استبدال القطعة",
    subtitle: "تأكيد بدء عملية الاستبدال",
    description: "سيتم تحديث حالة الطلب إلى قيد المعالجة",
    icon: "Wrench",
    color: "blue",
    steps: [{ label: "ملاحظات إضافية", field: "notes", required: false }],
    successMessage: "تم تأكيد بدء استبدال القطعة بنجاح",
    stockValidation: false,
    stockProcessing: false,
  },

  full_replace_in_progress: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "بدء الاستبدال الكامل",
    subtitle: "تأكيد بدء عملية الاستبدال الكامل",
    description: "سيتم تحديث حالة الطلب إلى قيد المعالجة",
    icon: "Package",
    color: "green",
    steps: [{ label: "ملاحظات إضافية", field: "notes", required: false }],
    successMessage: "تم تأكيد بدء الاستبدال الكامل بنجاح",
    stockValidation: false,
    stockProcessing: false,
  },

  // Return Confirmation - Enhanced for team workflow
  return_confirm: {
    requiresInput: true,
    inputFields: ["tracking_number", "refund_amount", "notes"],
    title: "تأكيد الإرجاع والاسترداد",
    subtitle: "معالجة طلب إرجاع العميل",
    description:
      "سيتم إنشاء رقم تتبع لاستلام العناصر المرتجعة ومعالجة الاسترداد",
    icon: "RotateCcw",
    color: "green",
    steps: [
      {
        label: "إنشاء رقم التتبع",
        field: "tracking_number",
        required: true,
      },
      {
        label: "تحديد مبلغ الاسترداد",
        field: "refund_amount",
        required: false,
      },
      { label: "إضافة ملاحظات", field: "notes", required: false },
    ],
    successMessage: "تم تأكيد طلب الإرجاع والاسترداد بنجاح",
    stockValidation: false,
    stockProcessing: false,
    note: "سيتم استلام العناصر ومعالجة الاسترداد حسب السياسات",
  },
  pending_send: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "إعداد للإرسال",
    description: "تأكيد التحضير لإرسال العناصر البديلة",
  },
  pending_send_confirmation: {
    requiresInput: true,
    inputFields: ["tracking_number", "notes"],
    title: "تأكيد الإرسال المعلق",
    description: (action) => {
      if (action.action_type === ServiceActionType.MAINTENANCING) {
        return "تأكيد أن العناصر جاهزة للإرسال للعميل برقم التتبع الجديد - سيتم تحديث المخزون";
      } else if (action.action_type === ServiceActionType.PART_REPLACE) {
        return "تأكيد إرسال القطعة البديلة برقم التتبع الجديد - سيتم تحديث المخزون";
      } else if (action.action_type === ServiceActionType.FULL_REPLACE) {
        return "تأكيد إرسال المنتج البديل برقم التتبع الجديد - سيتم تحديث المخزون";
      }
      return "تأكيد الإرسال برقم التتبع الجديد - سيتم تحديث المخزون";
    },
    requiresTrackingNumber: true,
    stockProcessing: true, // This action processes stock
    note: "هذا الإجراء يؤكد الإرسال ويحدث المخزون",
  },
  scan_send: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "مسح الإرسال",
    description:
      "تأكيد إرسال العناصر فعلياً للعميل - سيتم تحديث المخزون نهائياً",
    stockProcessing: true, // This action processes stock
    note: "مسح نهائي للإرسال مع تحديث المخزون",
  },
  confirm_return: {
    requiresInput: true,
    inputFields: ["tracking_number", "refund_amount", "notes"],
    title: "تأكيد الإرجاع",
    description: "أدخل رقم التتبع الجديد ومبلغ الاسترداد للإرجاع",
  },
  receive: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "استلام العناصر",
    description: "تأكيد استلام العناصر",
  },
  receive_return: {
    requiresInput: true,
    inputFields: ["items_received", "notes"],
    title: "استلام الإرجاع",
    description: "أدخل تفاصيل العناصر المستلمة",
  },
  process_refund: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "معالجة الاسترداد",
    description: "تأكيد معالجة الاسترداد",
  },
  update_condition: {
    requiresInput: true,
    inputFields: ["return_condition", "return_notes"],
    title: "تحديث حالة الإرجاع",
    description: "اختر حالة الإرجاع وأضف ملاحظات",
  },
  complete: {
    requiresInput: false,
    inputFields: ["notes"],
    title: "إكمال إجراء الخدمة",
    description: "تأكيد إكمال إجراء الخدمة",
  },
  fail: {
    requiresInput: true,
    inputFields: ["notes"],
    title: "تسجيل فشل إجراء الخدمة",
    description: "أدخل سبب الفشل",
  },
  retry: {
    requiresInput: true,
    inputFields: ["tracking_number", "notes", "cost", "items_to_send"],
    title: "إعادة المحاولة",
    description:
      "أدخل رقم التتبع الجديد لإعادة المحاولة. يمكنك تحديث التكلفة والأجزاء (اختياري)",
    showAdvancedFields: (action) =>
      action.action_type === "part_replace" ||
      action.action_type === "full_replace",
  },
  cancel: {
    requiresInput: false,
    inputFields: [],
    title: "إلغاء إجراء الخدمة",
    description: "تأكيد إلغاء إجراء الخدمة",
  },
};

// Map API service types (and legacy aliases) to internal enum values — never default unknown to maintenance
const mapApiServiceTypeToEnum = (apiServiceType) => {
  const mapping = {
    maintenance: ServiceActionType.MAINTENANCE,
    replacement: ServiceActionType.REPLACEMENT,
    return: ServiceActionType.RETURN,
    sell: ServiceActionType.SELL,
  };

  const canonical = normalizeServiceTypeOrFallback(apiServiceType, {
    fallback: "replacement",
  });
  return mapping[canonical] ?? ServiceActionType.REPLACEMENT;
};

/**
 * Check if a service action is in pending send confirmation state
 */
export const isPendingSendConfirmation = (action) => {
  return (
    action.status === ServiceActionStatus.SENT &&
    action.actionData?.pending_send_confirmation
  );
};

/**
 * Get the state context for a service action
 */
export const getStateContext = (action) => {
  const workflow = getWorkflowDefinition(
    action.action_type || action.service_type
  );
  return workflow.stateContext?.[action.status] || {};
};

/**
 * Get the current state definition for a service action
 */
export const getCurrentState = (action) => {
  const workflow = getWorkflowDefinition(
    action.action_type || action.service_type
  );
  return (
    workflow.states.find((state) => state.id === action.status) ||
    workflow.states[0]
  );
};

// Calculate priority based on ticket priority field, fallback to creation date
export const calculatePriority = (action) => {
  // First, check if ticket has a priority field from the API
  if (action.priority) {
    const priorityLevel = action.priority.toLowerCase();
    
    if (priorityLevel === 'high') {
      return { level: "high", color: "red", icon: "AlertCircle" };
    }
    if (priorityLevel === 'medium') {
      return { level: "medium", color: "amber", icon: "Clock" };
    }
    if (priorityLevel === 'low') {
      return { level: "low", color: "green", icon: "CheckCircle" };
    }
    // If priority is 'normal' or unknown, fall through to age-based calculation
  }

  // Fallback: Calculate priority based on creation date and status
  const createdAt = new Date(action.created_at);
  const now = new Date();
  const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

  if (hoursDiff > 48)
    return { level: "high", color: "red", icon: "AlertCircle" };
  if (hoursDiff > 24) return { level: "medium", color: "amber", icon: "Clock" };
  return { level: "low", color: "green", icon: "CheckCircle" };
};

// Get available actions based on service action state and type
// This matches the backend unified_service.py workflow transitions exactly
// Handles both old and new status names for backward compatibility
export const getAvailableActions = (action) => {
  const { status, action_type } = action;
  const actions = [];

  // Map API action type to enum value for workflow logic
  const mappedActionType = mapApiServiceTypeToEnum(action_type);

  // Note: 'view' action is now handled as a separate button in the card
  // Status-specific actions based on backend workflow
  // Normalize status for backward compatibility (handle both old and new names)

  let normalizedStatus = status;

  // Map status names to enum values for workflow logic
  const statusMapping = {
    pending: ServiceActionStatus.PENDING,
    PENDING: ServiceActionStatus.PENDING,
    confirmed: ServiceActionStatus.CONFIRMED,
    CONFIRMED: ServiceActionStatus.CONFIRMED,
    in_process: ServiceActionStatus.IN_PROCESS,
    IN_PROCESS: ServiceActionStatus.IN_PROCESS,
    ready_for_dispatch: ServiceActionStatus.READY_FOR_DISPATCH,
    READY_FOR_DISPATCH: ServiceActionStatus.READY_FOR_DISPATCH,
    sent: ServiceActionStatus.SENT,
    SENT: ServiceActionStatus.SENT,
    delivered: ServiceActionStatus.DELIVERED,
    DELIVERED: ServiceActionStatus.DELIVERED,
    completed: ServiceActionStatus.COMPLETED,
    COMPLETED: ServiceActionStatus.COMPLETED,
    cancelled: ServiceActionStatus.CANCELLED,
    CANCELLED: ServiceActionStatus.CANCELLED,
  };

  // If status is in the mapping, use the new name, otherwise keep as is
  if (statusMapping[status]) {
    normalizedStatus = statusMapping[status];
  }

  switch (normalizedStatus) {
    case ServiceActionStatus.PENDING:
      // All action types start with confirm action
      actions.push({
        id: "confirm",
        label: "تأكيد",
        icon: "CheckCircle",
        color: "blue",
        variant: "primary",
      });
      break;

    case ServiceActionStatus.CONFIRMED:
      // All action types can move to IN_PROCESS
      actions.push({
        id: "scan_inbound",
        label: "مسح الداخل",
        icon: "QrCode",
        color: "green",
        variant: "primary",
      });
      break;

    case ServiceActionStatus.IN_PROCESS:
      // From IN_PROCESS, can go to READY_FOR_DISPATCH or COMPLETED (for return)
      if (mappedActionType === ServiceActionType.RETURN) {
        // Return actions go directly to COMPLETED
        actions.push({
          id: "validate_items",
          label: "اعتماد العناصر",
          icon: "CheckCircle",
          color: "green",
          variant: "primary",
        });
      } else {
        // Maintenance and replacement actions go to READY_FOR_DISPATCH
        actions.push({
          id: "ready_for_dispatch",
          label: "جاهز للإرسال",
          icon: "Package",
          color: "purple",
          variant: "primary",
        });
      }
      break;

    case ServiceActionStatus.READY_FOR_DISPATCH:
      // From READY_FOR_DISPATCH, can go to SENT
      actions.push({
        id: "scan_outbound",
        label: "مسح الخارج",
        icon: "QrCode",
        color: "blue",
        variant: "primary",
      });
      break;

    case ServiceActionStatus.SENT:
      // From SENT, can go to DELIVERED
      actions.push({
        id: "mark_delivered",
        label: "تم التسليم",
        icon: "Check",
        color: "green",
        variant: "primary",
      });
      break;

    case ServiceActionStatus.DELIVERED:
      // From DELIVERED, can go to COMPLETED
      actions.push({
        id: "complete",
        label: "إكمال",
        icon: "CheckCircle",
        color: "green",
        variant: "primary",
      });
      break;

    case ServiceActionStatus.COMPLETED:
      // COMPLETED is a final state, only view and refresh
      actions.push({
        id: "refresh",
        label: "تحديث",
        icon: "RefreshCw",
        color: "blue",
        variant: "secondary",
      });
      break;

    case ServiceActionStatus.CANCELLED:
      // CANCELLED status has no actions - it's a final state
      break;

    default:
      // Unknown status, only show view
      console.warn(
        `⚠️ Unknown status: ${status} (normalized: ${normalizedStatus})`
      );
      break;
  }

  return actions;
};
