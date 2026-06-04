/**
 * Bosta Status Constants - Single Source of Truth
 * 
 * Comprehensive status definitions for:
 * - Bosta Order Statuses (from timeline, timestamps, status object)
 * - Call Statuses (from calls table)
 * - Order Types (from Bosta API)
 * 
 * All statuses include: Arabic label, color scheme, icon, and semantic meaning.
 * Follows design system tokens and vision.
 */

import { 
    CheckCircle, XCircle, Clock, Calendar, Package, Truck, 
    Phone, PhoneOff, PhoneIncoming, PhoneCall, AlertCircle,
    RotateCcw, RefreshCw, Send, PackageCheck, Loader2
} from 'lucide-react';

// ============================================================================
// STATUS CATEGORIES (Semantic Groups)
// ============================================================================

export const STATUS_CATEGORIES = {
    PENDING: 'pending',           // Awaiting action
    IN_PROGRESS: 'in_progress',    // Active processing
    SUCCESS: 'success',            // Completed successfully
    ERROR: 'error',                // Failed/rejected
    RETURN: 'return',              // Returned states
    SCHEDULED: 'scheduled'         // Scheduled/future
};

// ============================================================================
// BOSTA ORDER STATUSES - Complete Mapping
// ============================================================================

/**
 * Bosta Order Status Configuration
 * Maps all possible status values from Bosta API to:
 * - Arabic label
 * - Color scheme (using design tokens)
 * - Icon component
 * - Category (semantic grouping)
 * - Priority (for sorting/display)
 */
export const BOSTA_ORDER_STATUSES = {
    // PENDING STATES
    pending: {
        label: 'قيد الانتظار',
        labelShort: 'انتظار',
        category: STATUS_CATEGORIES.PENDING,
        priority: 1,
        icon: Clock,
        colors: {
            bg: 'bg-gray-100 dark:bg-gray-700/50',
            text: 'text-gray-800 dark:text-gray-200',
            border: 'border-gray-200 dark:border-gray-600',
            ring: 'ring-gray-300 dark:ring-gray-600'
        },
        description: 'الطلب في انتظار المعالجة'
    },
    created: {
        label: 'تم الإنشاء',
        labelShort: 'إنشاء',
        category: STATUS_CATEGORIES.PENDING,
        priority: 2,
        icon: Package,
        colors: {
            bg: 'bg-gray-100 dark:bg-gray-700/50',
            text: 'text-gray-800 dark:text-gray-200',
            border: 'border-gray-200 dark:border-gray-600',
            ring: 'ring-gray-300 dark:ring-gray-600'
        },
        description: 'تم إنشاء الطلب'
    },

    // CONFIRMED/SCHEDULED STATES
    confirmed: {
        label: 'مؤكد',
        labelShort: 'مؤكد',
        category: STATUS_CATEGORIES.SCHEDULED,
        priority: 3,
        icon: CheckCircle,
        colors: {
            bg: 'bg-ui-warning-100 dark:bg-amber-800/80',
            text: 'text-ui-warning-800 dark:text-amber-100',
            border: 'border-ui-warning-200 dark:border-amber-600',
            ring: 'ring-amber-300 dark:ring-amber-600'
        },
        description: 'تم تأكيد الطلب'
    },
    scheduled: {
        label: 'مجدول',
        labelShort: 'مجدول',
        category: STATUS_CATEGORIES.SCHEDULED,
        priority: 4,
        icon: Calendar,
        colors: {
            bg: 'bg-ui-warning-100 dark:bg-amber-800/80',
            text: 'text-ui-warning-800 dark:text-amber-100',
            border: 'border-ui-warning-200 dark:border-amber-600',
            ring: 'ring-amber-300 dark:ring-amber-600'
        },
        description: 'الطلب مجدول للتنفيذ'
    },
    ready: {
        label: 'جاهز',
        labelShort: 'جاهز',
        category: STATUS_CATEGORIES.SCHEDULED,
        priority: 5,
        icon: PackageCheck,
        colors: {
            bg: 'bg-ui-warning-100 dark:bg-amber-800/80',
            text: 'text-ui-warning-800 dark:text-amber-100',
            border: 'border-ui-warning-200 dark:border-amber-600',
            ring: 'ring-amber-300 dark:ring-amber-600'
        },
        description: 'الطلب جاهز للشحن'
    },
    ready_for_dispatch: {
        label: 'جاهز للشحن',
        labelShort: 'جاهز',
        category: STATUS_CATEGORIES.SCHEDULED,
        priority: 6,
        icon: PackageCheck,
        colors: {
            bg: 'bg-ui-warning-100 dark:bg-amber-800/80',
            text: 'text-ui-warning-800 dark:text-amber-100',
            border: 'border-ui-warning-200 dark:border-amber-600',
            ring: 'ring-amber-300 dark:ring-amber-600'
        },
        description: 'الطلب جاهز للشحن'
    },

    // IN PROGRESS STATES
    in_process: {
        label: 'قيد المعالجة',
        labelShort: 'معالجة',
        category: STATUS_CATEGORIES.IN_PROGRESS,
        priority: 7,
        icon: Loader2,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-800/80',
            text: 'text-brand-blue-800 dark:text-brand-blue-100',
            border: 'border-brand-blue-200 dark:border-brand-blue-600',
            ring: 'ring-brand-blue-300 dark:ring-brand-blue-600'
        },
        description: 'الطلب قيد المعالجة'
    },
    processing: {
        label: 'قيد المعالجة',
        labelShort: 'معالجة',
        category: STATUS_CATEGORIES.IN_PROGRESS,
        priority: 7,
        icon: Loader2,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-800/80',
            text: 'text-brand-blue-800 dark:text-brand-blue-100',
            border: 'border-brand-blue-200 dark:border-brand-blue-600',
            ring: 'ring-brand-blue-300 dark:ring-brand-blue-600'
        },
        description: 'الطلب قيد المعالجة'
    },
    sent: {
        label: 'تم الإرسال',
        labelShort: 'إرسال',
        category: STATUS_CATEGORIES.IN_PROGRESS,
        priority: 8,
        icon: Send,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-800/80',
            text: 'text-brand-blue-800 dark:text-brand-blue-100',
            border: 'border-brand-blue-200 dark:border-brand-blue-600',
            ring: 'ring-brand-blue-300 dark:ring-brand-blue-600'
        },
        description: 'تم إرسال الطلب'
    },
    in_transit: {
        label: 'قيد الشحن',
        labelShort: 'شحن',
        category: STATUS_CATEGORIES.IN_PROGRESS,
        priority: 9,
        icon: Truck,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-800/80',
            text: 'text-brand-blue-800 dark:text-brand-blue-100',
            border: 'border-brand-blue-200 dark:border-brand-blue-600',
            ring: 'ring-brand-blue-300 dark:ring-brand-blue-600'
        },
        description: 'الطلب قيد الشحن'
    },
    out_for_delivery: {
        label: 'في الطريق للتسليم',
        labelShort: 'تسليم',
        category: STATUS_CATEGORIES.IN_PROGRESS,
        priority: 10,
        icon: Truck,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-800/80',
            text: 'text-brand-blue-800 dark:text-brand-blue-100',
            border: 'border-brand-blue-200 dark:border-brand-blue-600',
            ring: 'ring-brand-blue-300 dark:ring-brand-blue-600'
        },
        description: 'الطلب في الطريق للتسليم'
    },

    // SUCCESS STATES
    delivered: {
        label: 'تم التسليم',
        labelShort: 'تسليم',
        category: STATUS_CATEGORIES.SUCCESS,
        priority: 11,
        icon: CheckCircle,
        colors: {
            bg: 'bg-accent-green-100 dark:bg-accent-green-800/80',
            text: 'text-accent-green-800 dark:text-accent-green-100',
            border: 'border-accent-green-200 dark:border-accent-green-600',
            ring: 'ring-accent-green-300 dark:ring-accent-green-600'
        },
        description: 'تم تسليم الطلب بنجاح'
    },
    completed: {
        label: 'مكتمل',
        labelShort: 'مكتمل',
        category: STATUS_CATEGORIES.SUCCESS,
        priority: 12,
        icon: CheckCircle,
        colors: {
            bg: 'bg-accent-green-100 dark:bg-accent-green-800/80',
            text: 'text-accent-green-800 dark:text-accent-green-100',
            border: 'border-accent-green-200 dark:border-accent-green-600',
            ring: 'ring-accent-green-300 dark:ring-accent-green-600'
        },
        description: 'اكتمل الطلب'
    },
    collected: {
        label: 'تم الاستلام',
        labelShort: 'استلام',
        category: STATUS_CATEGORIES.SUCCESS,
        priority: 13,
        icon: PackageCheck,
        colors: {
            bg: 'bg-accent-green-100 dark:bg-accent-green-800/80',
            text: 'text-accent-green-800 dark:text-accent-green-100',
            border: 'border-accent-green-200 dark:border-accent-green-600',
            ring: 'ring-accent-green-300 dark:ring-accent-green-600'
        },
        description: 'تم استلام الطرد'
    },
    picked_up: {
        label: 'تم الاستلام',
        labelShort: 'استلام',
        category: STATUS_CATEGORIES.SUCCESS,
        priority: 13,
        icon: PackageCheck,
        colors: {
            bg: 'bg-accent-green-100 dark:bg-accent-green-800/80',
            text: 'text-accent-green-800 dark:text-accent-green-100',
            border: 'border-accent-green-200 dark:border-accent-green-600',
            ring: 'ring-accent-green-300 dark:ring-accent-green-600'
        },
        description: 'تم استلام الطرد'
    },

    // ERROR/REJECTED STATES
    cancelled: {
        label: 'ملغي',
        labelShort: 'ملغي',
        category: STATUS_CATEGORIES.ERROR,
        priority: 14,
        icon: XCircle,
        colors: {
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/70',
            text: 'text-brand-red-800 dark:text-brand-red-100',
            border: 'border-brand-red-200 dark:border-brand-red-600',
            ring: 'ring-brand-red-300 dark:ring-brand-red-600'
        },
        description: 'تم إلغاء الطلب'
    },
    canceled: {
        label: 'ملغي',
        labelShort: 'ملغي',
        category: STATUS_CATEGORIES.ERROR,
        priority: 14,
        icon: XCircle,
        colors: {
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/70',
            text: 'text-brand-red-800 dark:text-brand-red-100',
            border: 'border-brand-red-200 dark:border-brand-red-600',
            ring: 'ring-brand-red-300 dark:ring-brand-red-600'
        },
        description: 'تم إلغاء الطلب'
    },
    failed: {
        label: 'فشل التسليم',
        labelShort: 'فشل',
        category: STATUS_CATEGORIES.ERROR,
        priority: 15,
        icon: XCircle,
        colors: {
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/70',
            text: 'text-brand-red-800 dark:text-brand-red-100',
            border: 'border-brand-red-200 dark:border-brand-red-600',
            ring: 'ring-brand-red-300 dark:ring-brand-red-600'
        },
        description: 'فشل تسليم الطلب'
    },
    rejected: {
        label: 'مرفوض',
        labelShort: 'مرفوض',
        category: STATUS_CATEGORIES.ERROR,
        priority: 16,
        icon: XCircle,
        colors: {
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/70',
            text: 'text-brand-red-800 dark:text-brand-red-100',
            border: 'border-brand-red-200 dark:border-brand-red-600',
            ring: 'ring-brand-red-300 dark:ring-brand-red-600'
        },
        description: 'تم رفض الطلب'
    },

    // RETURN STATES
    returned: {
        label: 'مرتجع',
        labelShort: 'مرتجع',
        category: STATUS_CATEGORIES.RETURN,
        priority: 17,
        icon: RefreshCw,
        colors: {
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/70',
            text: 'text-brand-red-800 dark:text-brand-red-100',
            border: 'border-brand-red-200 dark:border-brand-red-600',
            ring: 'ring-brand-red-300 dark:ring-brand-red-600'
        },
        description: 'تم إرجاع الطلب'
    },
    return_to_origin: {
        label: 'إرجاع للمصدر',
        labelShort: 'إرجاع',
        category: STATUS_CATEGORIES.RETURN,
        priority: 18,
        icon: RotateCcw,
        colors: {
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/70',
            text: 'text-brand-red-800 dark:text-brand-red-100',
            border: 'border-brand-red-200 dark:border-brand-red-600',
            ring: 'ring-brand-red-300 dark:ring-brand-red-600'
        },
        description: 'تم إرجاع الطلب للمصدر'
    }
};

// ============================================================================
// CALL STATUSES - Complete Mapping
// ============================================================================

/**
 * Call Status Configuration
 * Maps call statuses from calls table to Arabic labels and styling
 */
export const CALL_STATUSES = {
    confirmed: {
        label: 'مؤكد',
        labelShort: 'مؤكد',
        icon: CheckCircle,
        colors: {
            bg: 'bg-accent-green-100 dark:bg-accent-green-900/40',
            text: 'text-accent-green-700 dark:text-accent-green-200',
            border: 'border-accent-green-200 dark:border-accent-green-800/50'
        },
        description: 'تم تأكيد المكالمة'
    },
    completed: {
        label: 'مكتملة',
        labelShort: 'مكتملة',
        icon: CheckCircle,
        colors: {
            bg: 'bg-accent-green-100 dark:bg-accent-green-900/40',
            text: 'text-accent-green-700 dark:text-accent-green-200',
            border: 'border-accent-green-200 dark:border-accent-green-800/50'
        },
        description: 'تم إكمال الاستفسار'
    },
    scheduled: {
        label: 'مجدول',
        labelShort: 'مجدول',
        icon: Calendar,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-900/40',
            text: 'text-brand-blue-700 dark:text-brand-blue-200',
            border: 'border-brand-blue-200 dark:border-brand-blue-800/50'
        },
        description: 'تم جدولة المكالمة'
    },
    canceled: {
        label: 'ملغي',
        labelShort: 'ملغي',
        icon: XCircle,
        colors: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-200',
            border: 'border-red-200 dark:border-red-800/50'
        },
        description: 'تم إلغاء المكالمة'
    },
    cancelled: {
        label: 'ملغي',
        labelShort: 'ملغي',
        icon: XCircle,
        colors: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-200',
            border: 'border-red-200 dark:border-red-800/50'
        },
        description: 'تم إلغاء المكالمة'
    },
    no_answer: {
        label: 'لم يرد',
        labelShort: 'لم يرد',
        icon: PhoneOff,
        colors: {
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-700 dark:text-amber-200',
            border: 'border-amber-200 dark:border-amber-800/50'
        },
        description: 'لم يرد العميل على المكالمة'
    }
};

// ============================================================================
// ORDER TYPES - Complete Mapping
// ============================================================================

/**
 * Bosta Order Type Configuration
 * Maps Bosta API order types (code 10, 20, 25, 30) to Arabic labels and styling
 */
export const BOSTA_ORDER_TYPES = {
    'Send': {
        code: 10,
        label: 'إرسال',
        labelShort: 'إرسال',
        icon: Send,
        colors: {
            bg: 'bg-brand-blue-50 dark:bg-brand-blue-900/30',
            text: 'text-brand-blue-700 dark:text-brand-blue-200',
            border: 'border-brand-blue-200 dark:border-brand-blue-700/60'
        },
        description: 'طلب إرسال عادي'
    },
    'Exchange': {
        code: 30,
        label: 'استبدال',
        labelShort: 'استبدال',
        icon: RotateCcw,
        colors: {
            bg: 'bg-accent-amber-50 dark:bg-accent-amber-900/30',
            text: 'text-accent-amber-700 dark:text-accent-amber-200',
            border: 'border-accent-amber-200 dark:border-accent-amber-700/60'
        },
        description: 'طلب استبدال منتج'
    },
    'Return to Origin': {
        code: 20,
        label: 'إرجاع للمصدر',
        labelShort: 'إرجاع',
        icon: RefreshCw,
        colors: {
            bg: 'bg-brand-red-50 dark:bg-brand-red-900/30',
            text: 'text-brand-red-700 dark:text-brand-red-200',
            border: 'border-brand-red-200 dark:border-brand-red-700/60'
        },
        description: 'إرجاع الطرد للمصدر'
    },
    'Customer Return Pickup': {
        code: 25,
        label: 'استرجاع العميل',
        labelShort: 'استرجاع',
        icon: RefreshCw,
        colors: {
            bg: 'bg-brand-red-50 dark:bg-brand-red-900/30',
            text: 'text-brand-red-700 dark:text-brand-red-200',
            border: 'border-brand-red-200 dark:border-brand-red-700/60'
        },
        description: 'استرجاع من العميل'
    }
};

// ============================================================================
// CALL TYPES - Complete Mapping
// ============================================================================

/**
 * Call Type Configuration
 * Maps call types from calls table to Arabic labels and styling
 */
export const CALL_TYPES = {
    ask: {
        label: 'استفسار',
        labelShort: 'استفسار',
        icon: PhoneCall,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-900/40',
            text: 'text-brand-blue-700 dark:text-brand-blue-200',
            gradient: 'from-brand-blue-500 to-cyan-500'
        },
        description: 'مكالمة استفسار'
    },
    sell: {
        label: 'مبيعات',
        labelShort: 'مبيعات',
        icon: Phone,
        colors: {
            bg: 'bg-accent-green-100 dark:bg-accent-green-900/40',
            text: 'text-accent-green-700 dark:text-accent-green-200',
            gradient: 'from-accent-green-500 to-emerald-500'
        },
        description: 'مكالمة مبيعات'
    },
    replacement: {
        label: 'استبدال',
        labelShort: 'استبدال',
        icon: PhoneIncoming,
        colors: {
            bg: 'bg-brand-blue-100 dark:bg-brand-blue-900/40',
            text: 'text-brand-blue-700 dark:text-brand-blue-200',
            gradient: 'from-brand-blue-500 to-indigo-500'
        },
        description: 'مكالمة استبدال'
    },
    maintenance: {
        label: 'صيانة',
        labelShort: 'صيانة',
        icon: PhoneCall,
        colors: {
            bg: 'bg-amber-100 dark:bg-amber-900/40',
            text: 'text-amber-700 dark:text-amber-200',
            gradient: 'from-amber-500 to-orange-500'
        },
        description: 'مكالمة صيانة'
    },
    return: {
        label: 'استرجاع',
        labelShort: 'استرجاع',
        icon: PhoneOff,
        colors: {
            bg: 'bg-brand-red-100 dark:bg-brand-red-900/40',
            text: 'text-brand-red-700 dark:text-brand-red-200',
            gradient: 'from-brand-red-500 to-pink-500'
        },
        description: 'مكالمة استرجاع'
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get Bosta order status configuration
 * Normalizes status string and returns full config object
 */
export const getBostaOrderStatus = (status) => {
    if (!status) return BOSTA_ORDER_STATUSES.pending;
    
    // Handle string status
    if (typeof status === 'string') {
        const normalized = status.toLowerCase().replace(/\s+/g, '_');
        return BOSTA_ORDER_STATUSES[normalized] || BOSTA_ORDER_STATUSES.pending;
    }
    
    // Handle object status (Bosta unified format)
    if (typeof status === 'object' && !Array.isArray(status)) {
        // Check timeline first (most accurate)
        const timeline = status.timeline || [];
        if (Array.isArray(timeline) && timeline.length > 0) {
            const latest = timeline[timeline.length - 1];
            if (latest?.status) {
                const normalized = String(latest.status).toLowerCase().replace(/\s+/g, '_');
                return BOSTA_ORDER_STATUSES[normalized] || BOSTA_ORDER_STATUSES.pending;
            }
        }
        
        // Check timestamps
        const timestamps = status.timestamps || {};
        if (timestamps.collected || timestamps.collectedFromConsignee) {
            return BOSTA_ORDER_STATUSES.collected;
        }
        
        // Check confirmed flag
        if (status.confirmed === true) {
            return BOSTA_ORDER_STATUSES.confirmed;
        }
    }
    
    return BOSTA_ORDER_STATUSES.pending;
};

/**
 * Get status badge color classes only (for custom badge styling)
 * Returns: bg-xxx text-xxx border-xxx classes
 */
export const getStatusBadgeColor = (status) => {
    const config = getBostaOrderStatus(status);
    const { bg, text, border } = config.colors;
    return `${bg} ${text} ${border}`;
};

/**
 * Get status badge classes (for Tailwind)
 */
export const getStatusBadgeClasses = (status, variant = 'default') => {
    const config = getBostaOrderStatus(status);
    const { bg, text, border } = config.colors;
    
    const baseClasses = 'px-2 py-1 rounded-md border font-semibold text-xs font-cairo whitespace-nowrap';
    
    switch (variant) {
        case 'compact':
            return `${baseClasses} px-1.5 py-0.5 text-[10px] ${bg} ${text} ${border}`;
        case 'pill':
            return `${baseClasses} rounded-full ${bg} ${text} ${border}`;
        case 'minimal':
            return `text-[10px] ${text}`;
        default:
            return `${baseClasses} ${bg} ${text} ${border}`;
    }
};

/**
 * Get call status configuration.
 * For ask-only calls (call_type='ask') with status='confirmed', returns 'مكتملة' (completed).
 */
export const getCallStatus = (status, callType) => {
    if (!status) return CALL_STATUSES.no_answer;
    const normalized = String(status).toLowerCase().replace(/\s+/g, '_');
    return CALL_STATUSES[normalized] || CALL_STATUSES.no_answer;
};

/**
 * Get call status configuration for display.
 * When call_type is 'ask' and status is 'confirmed', shows مكتملة (completed) — no ticket created.
 */
export const getCallStatusForDisplay = (status, callType) => {
    const callTypeNorm = callType ? String(callType).toLowerCase() : '';
    const statusNorm = status ? String(status).toLowerCase() : '';
    if (callTypeNorm === 'ask' && statusNorm === 'confirmed') {
        return CALL_STATUSES.completed;
    }
    return getCallStatus(status, callType);
};

/**
 * Get order type configuration
 */
export const getOrderType = (type) => {
    if (!type) return BOSTA_ORDER_TYPES['Send'];
    return BOSTA_ORDER_TYPES[type] || BOSTA_ORDER_TYPES['Send'];
};

/**
 * Get call type configuration
 */
export const getCallType = (type) => {
    if (!type) return CALL_TYPES.ask;
    return CALL_TYPES[type] || CALL_TYPES.ask;
};

/**
 * Translate order type to Arabic (backward compatibility)
 */
export const translateOrderType = (type) => {
    const config = getOrderType(type);
    return config.label;
};

/**
 * Get status label (backward compatibility)
 */
export const getStatusLabel = (status) => {
    const config = getBostaOrderStatus(status);
    return config.label;
};

/**
 * Get status label short (compact version)
 */
export const getStatusLabelShort = (status) => {
    const config = getBostaOrderStatus(status);
    return config.labelShort || config.label;
};
