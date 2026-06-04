/**
 * Centralized Service Action Utilities
 * Consolidates duplicate logic for service action status handling, labels, and colors
 */

import { normalizeServiceTypeOrFallback, getServiceTypeLabelAr } from "../../constants/serviceTypes.js";
import { ServiceActionStatus, ServiceActionType } from "./types";

// Service Action Type Configuration
export const SERVICE_ACTION_TYPES = {
  [ServiceActionType.MAINTENANCE]: {
    label: "صيانة",
    icon: "Settings",
    color: "blue",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-700 dark:text-blue-300",
  },
  [ServiceActionType.REPLACEMENT]: {
    label: "استبدال",
    icon: "Package",
    color: "purple",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-700 dark:text-purple-300",
  },
  [ServiceActionType.RETURN]: {
    label: "إرجاع واسترداد",
    icon: "RotateCcw",
    color: "red",
    bgClass: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-700 dark:text-red-300",
  },
  [ServiceActionType.SELL]: {
    label: "المبيعات",
    icon: "ShoppingCart",
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-700 dark:text-green-300",
  },
};

// Service Action Status Configuration
export const SERVICE_ACTION_STATUSES = {
  [ServiceActionStatus.PENDING]: {
    label: "في الانتظار",
    color: "gray",
    progress: 10,
    category: "pending",
  },
  [ServiceActionStatus.CONFIRMED]: {
    label: "مؤكدة",
    color: "blue",
    progress: 25,
    category: "confirmed",
  },
  [ServiceActionStatus.IN_PROCESS]: {
    label: "قيد المعالجة",
    color: "orange",
    progress: 50,
    category: "inProgress",
  },
  [ServiceActionStatus.READY_FOR_DISPATCH]: {
    label: "جاهزة للإرسال",
    color: "amber",
    progress: 70,
    category: "inProgress",
  },
  [ServiceActionStatus.SENT]: {
    label: "مرسلة",
    color: "purple",
    progress: 85,
    category: "inProgress",
  },
  [ServiceActionStatus.DELIVERED]: {
    label: "تم التسليم",
    color: "green",
    progress: 95,
    category: "completed",
  },
  [ServiceActionStatus.COMPLETED]: {
    label: "مكتملة",
    color: "green",
    progress: 100,
    category: "completed",
  },
  [ServiceActionStatus.CANCELLED]: {
    label: "ملغاة",
    color: "red",
    progress: 0,
    category: "cancelled",
  },
};

export const getActionTypeConfig = (actionType) => {
  const canon = normalizeServiceTypeOrFallback(actionType, { fallback: "replacement" });
  const mapping = {
    maintenance: ServiceActionType.MAINTENANCE,
    replacement: ServiceActionType.REPLACEMENT,
    return: ServiceActionType.RETURN,
    sell: ServiceActionType.SELL,
  };
  const mappedType = mapping[canon] ?? ServiceActionType.REPLACEMENT;

  return (
    SERVICE_ACTION_TYPES[mappedType] ||
    SERVICE_ACTION_TYPES[ServiceActionType.MAINTENANCE]
  );
};

export const getStatusConfig = (status) => {
  return (
    SERVICE_ACTION_STATUSES[status] ||
    SERVICE_ACTION_STATUSES[ServiceActionStatus.PENDING]
  );
};

// Service Action Status Colors - Centralized mapping
export const getServiceStatusColor = (status) => {
  const statusColors = {
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    confirmed:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    in_process:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    ready_for_dispatch:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    delivered:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    returned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    created: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    in_progress:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    on_hub:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return statusColors[status] || statusColors["pending"];
};

// Service Action Status Badge Colors - Enhanced for better visual appeal with dark mode support
export const getServiceStatusBadgeColor = (status) => {
  const badgeColors = {
    pending:
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700",
    confirmed:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    in_process:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    ready_for_dispatch:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    sent: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    delivered:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    completed:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    cancelled:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
    returned:
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700",
    created:
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700",
    in_progress:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    failed:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };
  return badgeColors[status] || badgeColors["pending"];
};

// Service Action Status Icon Names - For use with icon components
export const getServiceStatusIconName = (status) => {
  const iconNames = {
    pending: "Clock",
    confirmed: "CheckCircle",
    in_process: "Settings",
    ready_for_dispatch: "Package",
    sent: "Send",
    delivered: "Check",
    completed: "CheckCircle",
    cancelled: "X",
    returned: "RotateCcw",
    created: "Clock",
    in_progress: "Settings",
    received: "Package",
    failed: "X",
    on_hub: "Building",
  };
  return iconNames[status] || "Clock";
};

// Service Action Type Labels - Centralized mapping
export const getActionTypeLabel = (type) => {
  const canon = normalizeServiceTypeOrFallback(type, { fallback: null });
  const typeLabels = {
    replacement: "استبدال",
    return: "إرجاع واسترداد",
    maintenance: "صيانة",
    sell: "بيع",
  };
  if (canon) return typeLabels[canon] || typeLabels.replacement;
  return type || "";
};

// Service Action Status Labels - Centralized mapping
export const getServiceStatusLabel = (status) => {
  const statusLabels = {
    pending: "في الانتظار",
    confirmed: "مؤكدة",
    in_process: "قيد المعالجة",
    ready_for_dispatch: "جاهزة للإرسال",
    sent: "مرسلة",
    delivered: "تم التسليم",
    completed: "مكتملة",
    cancelled: "ملغاة",
    returned: "مرتجعة",
    created: "في الانتظار",
    in_progress: "قيد المعالجة",
    failed: "ملغاة",
    on_hub: "في المركز",
  };
  return statusLabels[status] || (status ? status : "غير محدد");
};

// Service Action Status Labels - Compact versions (single word, same meaning)
export const getServiceStatusLabelCompact = (status) => {
  const compactLabels = {
    pending: "انتظار",
    confirmed: "مؤكدة",
    in_process: "معالجة",
    ready_for_dispatch: "جاهزة",
    sent: "مرسلة",
    delivered: "تسليم",
    completed: "مكتملة",
    cancelled: "ملغاة",
    returned: "مرتجعة",
    created: "انتظار",
    in_progress: "معالجة",
    failed: "ملغاة",
    on_hub: "المركز",
  };
  return compactLabels[status] || getServiceStatusLabel(status);
};

// Physical hub dashboard slices — see hubServiceActions.js
export {
  getHubStatusColor,
  getHubStatusLabel,
  isValidHubStatus,
  filterByHubSubTab,
  calculateHubStats,
  getHubSubTabs,
} from "./hubActions";

// Format service type for display in modals (simpler labels)
export const formatServiceType = (serviceType) => {
  const canon = normalizeServiceTypeOrFallback(serviceType, { fallback: null });
  if (canon) return getServiceTypeLabelAr(canon, { short: true });
  return serviceType || "غير محدد";
};

// Format priority for display
export const formatPriority = (priority) => {
  const map = {
    'high': 'عالية',
    'medium': 'متوسطة',
    'low': 'منخفضة',
    'normal': 'عادي'
  };
  return map[priority] || priority || 'عادي';
};

// Get priority color classes
export const getPriorityColor = (priority) => {
  return priority === 'high'
    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    : priority === 'medium'
      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
      : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
};
