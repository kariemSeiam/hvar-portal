/**
 * Action type config (titles, subtitles, colors, workflows) for Service Action Modal.
 */

export const ACTION_CONFIGS = {
    return: {
        title: 'إرجاع واسترداد',
        subtitleDefault: 'إنشاء طلب إرجاع واسترداد جديد',
        subtitleWorkflow: 'إجراء عملية إرجاع',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        color: 'from-red-500 to-pink-600',
        bgColor: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
        reasonTitle: 'سبب الإرجاع',
        reasonPlaceholder: 'ابحث عن سبب الإرجاع أو اكتب سبب جديد...',
        reasonActionType: 'return',
        requiresRefundAmount: true,
        requiresItems: true,
        requiresMaintenanceIssues: false,
        supportsWorkflow: ['pending_send_confirmation', 'scan_send']
    },
    replacement: {
        title: 'استبدال',
        subtitleDefault: 'استبدال المنتج',
        subtitleWorkflow: (existingServiceAction) => `إجراء استبدال - ${existingServiceAction?.status ?? ''}`,
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        reasonTitle: 'سبب الاستبدال',
        reasonPlaceholder: 'ابحث عن سبب الاستبدال أو اكتب سبب جديد...',
        reasonActionType: 'replacement',
        requiresRefundAmount: false,
        requiresItems: true,
        requiresMaintenanceIssues: false,
        supportsWorkflow: ['pending_send_confirmation', 'scan_send', 'pending_receive']
    },
    maintenance: {
        title: 'إجراء صيانة',
        subtitleDefault: 'إنشاء طلب صيانة جديد',
        subtitleWorkflow: (existingServiceAction) => `إجراء صيانة - ${existingServiceAction?.status ?? ''}`,
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        color: 'from-orange-500 to-amber-600',
        bgColor: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
        reasonTitle: 'سبب الصيانة',
        reasonPlaceholder: 'ابحث عن سبب الصيانة أو اكتب سبب جديد...',
        reasonActionType: 'maintenance',
        requiresRefundAmount: false,
        requiresItems: false,
        requiresMaintenanceIssues: false,
        supportsWorkflow: ['pending_send_confirmation', 'scan_send', 'pending_receive']
    },
    sell: {
        title: 'بيع',
        subtitleDefault: 'إنشاء طلب بيع جديد',
        subtitleWorkflow: (existingServiceAction) => `إجراء بيع - ${existingServiceAction?.status ?? ''}`,
        icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
        color: 'from-green-500 to-emerald-600',
        bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        reasonTitle: 'ملاحظات المبيعات',
        reasonPlaceholder: 'أضف ملاحظات حول عملية بيع القطع...',
        reasonActionType: 'sell',
        requiresRefundAmount: false,
        requiresItems: true,
        requiresMaintenanceIssues: false,
        supportsWorkflow: ['pending_send_confirmation', 'scan_send']
    }
};

/**
 * Config for the given action type (subtitle resolved for workflow vs creation).
 */
export function getModalConfig(actionType, { isWorkflowAction = false, existingServiceAction = null } = {}) {
    const raw = ACTION_CONFIGS[actionType] || ACTION_CONFIGS.return;
    const subtitle = isWorkflowAction
        ? (typeof raw.subtitleWorkflow === 'function' ? raw.subtitleWorkflow(existingServiceAction) : raw.subtitleWorkflow)
        : raw.subtitleDefault;
    return { ...raw, subtitle };
}
