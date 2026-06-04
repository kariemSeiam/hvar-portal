/**
 * Bosta Search Result Screen - Constants
 * Single source of truth for service type config and FAB actions.
 * Updated to use design tokens instead of hardcoded gradients.
 * 
 * NOTE: For comprehensive status constants (Bosta orders, calls, order types),
 * see: front/src/utils/bostaStatusConstants.js
 * 
 * This file maintains backward compatibility and service-specific configs.
 */

// Re-export comprehensive status constants for convenience
export {
    BOSTA_ORDER_STATUSES,
    CALL_STATUSES,
    BOSTA_ORDER_TYPES,
    CALL_TYPES,
    getBostaOrderStatus,
    getStatusBadgeColor,
    getStatusBadgeClasses,
    getCallStatus,
    getOrderType,
    getCallType,
    translateOrderType,
    getStatusLabel,
    getStatusLabelShort
} from '../../../utils/bosta/status';

/** Service type configuration for type-grouped ticket sections */
export const SERVICE_TYPE_CONFIG = {
    replacement: {
        label: 'استبدال',
        gradient: 'from-brand-blue-500 to-brand-blue-600',  // For avatars/icons only
        bg: 'bg-brand-blue-50 dark:bg-brand-blue-900/30',
        text: 'text-brand-blue-700 dark:text-brand-blue-200',
        border: 'border-brand-blue-200 dark:border-brand-blue-700/60',
        solid: 'bg-brand-blue-500',
    },
    maintenance: {
        label: 'صيانة',
        gradient: 'from-accent-amber-500 to-accent-amber-600',
        bg: 'bg-accent-amber-50 dark:bg-accent-amber-900/30',
        text: 'text-accent-amber-700 dark:text-accent-amber-200',
        border: 'border-accent-amber-200 dark:border-accent-amber-700/60',
        solid: 'bg-accent-amber-500',
    },
    return: {
        label: 'إرجاع',
        gradient: 'from-brand-red-500 to-brand-red-600',
        bg: 'bg-brand-red-50 dark:bg-brand-red-900/30',
        text: 'text-brand-red-700 dark:text-brand-red-200',
        border: 'border-brand-red-200 dark:border-brand-red-700/60',
        solid: 'bg-brand-red-500',
    },
    sell: {
        label: 'المبيعات',
        gradient: 'from-accent-green-500 to-accent-green-600',
        bg: 'bg-accent-green-50 dark:bg-accent-green-900/30',
        text: 'text-accent-green-700 dark:text-accent-green-200',
        border: 'border-accent-green-200 dark:border-accent-green-700/60',
        solid: 'bg-accent-green-500',
    },
};

/** Order of service types for display (canonical four; legacy keys normalize via serviceTypes.js) */
export const SERVICE_TYPE_ORDER = ['replacement', 'maintenance', 'return', 'sell'];

/** FAB action config with solid backgrounds matching design tokens */
export const BOSTA_FAB_ACTIONS = [
    {
        id: 'replacement',
        label: 'استبدال',
        bg: 'bg-brand-blue-600 hover:bg-brand-blue-700',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>)
    },
    {
        id: 'maintenance',
        label: 'صيانة',
        bg: 'bg-accent-amber-600 hover:bg-accent-amber-700',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>)
    },
    {
        id: 'return',
        label: 'إرجاع',
        bg: 'bg-brand-red-600 hover:bg-brand-red-700',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>)
    },
    {
        id: 'sell',
        label: 'بيع',
        bg: 'bg-accent-green-600 hover:bg-accent-green-700',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>)
    },
];

/** Order type styles for Bosta order badges - using design tokens */
export const getOrderTypeStyles = (type) => {
    switch (type) {
        case 'Send':
            return 'bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200 dark:bg-brand-blue-900/30 dark:text-brand-blue-200 dark:border-brand-blue-700/60';
        case 'Exchange':
            return 'bg-accent-amber-50 text-accent-amber-700 border-accent-amber-200 dark:bg-accent-amber-900/30 dark:text-accent-amber-200 dark:border-accent-amber-700/60';
        case 'Return to Origin':
        case 'Customer Return Pickup':
            return 'bg-brand-red-50 text-brand-red-700 border-brand-red-200 dark:bg-brand-red-900/30 dark:text-brand-red-200 dark:border-brand-red-700/60';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
    }
};

// Re-export governorates from centralized location
export { EGYPTIAN_GOVERNORATES, EGYPTIAN_GOVERNORATE_OPTIONS } from '../../../utils/core/governorates';


/** Draft ticket color scheme - amber/warning theme with pulse animation */
export const DRAFT_TICKET_CONFIG = {
    label: 'مسودة',
    gradient: 'from-accent-amber-500 to-accent-amber-600',
    bg: 'bg-accent-amber-50 dark:bg-accent-amber-900/30',
    text: 'text-accent-amber-700 dark:text-accent-amber-200',
    border: 'border-accent-amber-300 dark:border-accent-amber-700/60',
    solid: 'bg-accent-amber-500',
    pulse: 'animate-pulse',
    icon: '⚠️'
};
