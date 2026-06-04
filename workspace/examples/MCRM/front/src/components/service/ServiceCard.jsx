import { memo, useState, useMemo } from 'react';
import { Badge } from '../';
import { ServiceStatusBadge } from '../ui';
import { formatGregorianDate, formatTimeOnly, getRelativeTime } from '../../utils/core/date';
import { formatPhoneForLocalDisplay } from '../../utils/core/phone';
import { toast } from 'react-hot-toast';
import { getActionTypeLabel, getServiceStatusLabel } from '../../utils/service/utils';
import { normalizeServiceTypeOrFallback } from '../../constants/serviceTypes.js';

const ServiceCard = ({
    serviceAction,
    relatedOrder = null,
    onAction,
    actions = [],
    showDetails = false,
    onShowDetails,
    className = '',
    isHighlighted = false,
    ...props
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [hoveredAction, setHoveredAction] = useState(null);

    // Local state for dynamic inputs
    const [showInput, setShowInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeAction, setActiveAction] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Using centralized utilities from /utils/serviceActionUtils.js
    // Note: Status badge now handled by ServiceStatusBadge component using centralized utilities

    // Get priority label and variant
    const getPriorityInfo = (priority) => {
        const info = {
            'low': { label: 'منخفضة', variant: 'secondary', color: 'gray' },
            'normal': { label: 'عادية', variant: 'info', color: 'blue' },
            'high': { label: 'عالية', variant: 'warning', color: 'amber' },
            'urgent': { label: 'عاجلة', variant: 'danger', color: 'red' }
        };
        return info[priority] || info.normal;
    };

    // Get action type icon (canonical service types + legacy normalized)
    const getActionTypeIcon = (actionType) => {
        const key = normalizeServiceTypeOrFallback(actionType, { fallback: 'replacement' });
        const icons = {
            replacement: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
            return: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
            ),
            maintenance: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            sell: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        };
        return icons[key] || icons.replacement;
    };

    // Get status-based actions
    const getDynamicActions = (serviceAction) => {
        const baseActions = [];

        switch (serviceAction.status) {
            case 'created':
                baseActions.push({
                    type: 'confirm',
                    label: 'تأكيد الإجراء',
                    className: 'bg-blue-600 hover:bg-blue-700 text-white',
                    priority: 'primary',
                    requiresInput: true,
                    inputType: 'tracking',
                    inputLabel: 'رقم التتبع الجديد',
                    inputPlaceholder: 'أدخل رقم التتبع الجديد'
                });
                break;

            case 'confirmed':
                baseActions.push({
                    type: 'pending_receive',
                    label: 'في انتظار الاستلام',
                    className: 'bg-amber-600 hover:bg-amber-700 text-white',
                    priority: 'primary',
                    requiresInput: true,
                    inputType: 'notes',
                    inputLabel: 'ملاحظات',
                    inputPlaceholder: 'ملاحظات حول الإجراء'
                });
                break;

            case 'pending_receive':
                baseActions.push(
                    {
                        type: 'receive',
                        label: 'تأكيد الاستلام',
                        className: 'bg-green-600 hover:bg-green-700 text-white',
                        priority: 'primary',
                        requiresInput: true,
                        inputType: 'notes',
                        inputLabel: 'ملاحظات الاستلام',
                        inputPlaceholder: 'ملاحظات حول الاستلام'
                    },
                    {
                        type: 'fail',
                        label: 'فشل الإجراء',
                        className: 'bg-red-600 hover:bg-red-700 text-white',
                        priority: 'secondary',
                        requiresInput: true,
                        inputType: 'notes',
                        inputLabel: 'سبب الفشل',
                        inputPlaceholder: 'أدخل سبب فشل الإجراء'
                    }
                );
                break;

            case 'completed':
                baseActions.push({
                    type: 'view',
                    label: 'عرض التفاصيل',
                    className: 'bg-gray-600 hover:bg-gray-700 text-white',
                    priority: 'secondary',
                    requiresInput: false
                });
                break;

            case 'failed':
                baseActions.push({
                    type: 'retry',
                    label: 'إعادة المحاولة',
                    className: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                    priority: 'primary',
                    requiresInput: true,
                    inputType: 'notes',
                    inputLabel: 'ملاحظات إعادة المحاولة',
                    inputPlaceholder: 'ملاحظات حول إعادة المحاولة'
                });
                break;

                baseActions.push({
                    type: 'reactivate',
                    label: 'إعادة تفعيل',
                    className: 'bg-blue-600 hover:bg-blue-700 text-white',
                    priority: 'primary',
                    requiresInput: true,
                    inputType: 'notes',
                    inputLabel: 'سبب إعادة التفعيل',
                    inputPlaceholder: 'أدخل سبب إعادة التفعيل'
                });
                break;

            default:
                break;
        }

        return baseActions;
    };

    // Handle action execution
    const handleAction = async (actionType, serviceAction, notes = '', trackingNumber = '') => {
        if (isActionLoading) return;

        setIsActionLoading(true);
        try {
            await onAction?.(actionType, serviceAction, notes, trackingNumber);
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setIsActionLoading(false);
        }
    };

    // Handle action button click
    const handleActionClick = (action) => {
        if (action.requiresInput) {
            setActiveAction(action);
            setShowInput(true);
            setInputValue('');
        } else {
            handleAction(action.type, serviceAction);
        }
    };

    // Handle input submission
    const handleInputSubmit = async () => {
        if (!activeAction) return;

        // Validate input based on action type
        if (activeAction.inputType === 'tracking') {
            if (!inputValue.trim()) {
                toast.error('يرجى إدخال رقم التتبع الجديد');
                return;
            }
            // Basic tracking number validation (alphanumeric, at least 3 characters)
            if (!/^[A-Za-z0-9]{3,}$/.test(inputValue.trim())) {
                toast.error('رقم التتبع يجب أن يكون 3 أحرف على الأقل ويحتوي على أحرف وأرقام فقط');
                return;
            }
        } else {
            if (!inputValue.trim()) {
                toast.error('يرجى إدخال الملاحظات');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Handle different input types
            if (activeAction.inputType === 'tracking') {
                // For confirm action, pass tracking number as second parameter, notes as third
                await handleAction(activeAction.type, serviceAction, '', inputValue.trim());
            } else {
                // For other actions, pass notes as third parameter
                await handleAction(activeAction.type, serviceAction, inputValue.trim());
            }

            setShowInput(false);
            setActiveAction(null);
            setInputValue('');
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle input cancellation
    const handleInputCancel = () => {
        setShowInput(false);
        setActiveAction(null);
        setInputValue('');
    };

    // Get dynamic actions based on service action state
    const dynamicActions = useMemo(() => getDynamicActions(serviceAction), [serviceAction]);
    const priorityInfo = useMemo(() => getPriorityInfo(serviceAction.priority), [serviceAction.priority]);


    const serviceTypeCanon = normalizeServiceTypeOrFallback(
        serviceAction.action_type || serviceAction.service_type,
        { fallback: 'replacement' }
    );
    const headerIconBg =
        serviceTypeCanon === 'return'
            ? 'bg-gradient-to-br from-orange-100 to-orange-200'
            : serviceTypeCanon === 'replacement'
              ? 'bg-gradient-to-br from-purple-100 to-purple-200'
              : serviceTypeCanon === 'sell'
                ? 'bg-gradient-to-br from-green-100 to-green-200'
                : 'bg-gradient-to-br from-blue-100 to-blue-200';
    const headerIconText =
        serviceTypeCanon === 'return'
            ? 'text-orange-700'
            : serviceTypeCanon === 'replacement'
              ? 'text-purple-700'
              : serviceTypeCanon === 'sell'
                ? 'text-green-700'
                : 'text-blue-700';

    return (
        <div className={`rounded-lg shadow-md border-2 transition-all duration-300 ${isHighlighted
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 shadow-lg'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-500'
            } ${className}`} {...props}>

            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${headerIconBg}`}>
                            <div className={headerIconText}>
                                {getActionTypeIcon(serviceAction.action_type || serviceAction.service_type)}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <h3 className="text-sm font-cairo font-bold text-gray-900 dark:text-gray-100">
                                    SA-{serviceAction.id || serviceAction._id}
                                </h3>
                                <ServiceStatusBadge
                                    status={serviceAction.status}
                                    size="sm"
                                    showIcon={true}
                                />
                                {priorityInfo.label !== 'عادية' && (
                                    <span className={`px-2 py-1 text-xs font-cairo font-semibold rounded-full ${priorityInfo.color === 'red' ? 'bg-red-200 text-red-800' :
                                        priorityInfo.color === 'amber' ? 'bg-amber-200 text-amber-800' :
                                            'bg-gray-200 text-gray-800'
                                        }`}>
                                        {priorityInfo.label}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse mt-1">
                                <span className="text-xs font-cairo font-medium text-gray-600 dark:text-gray-400">
                                    {getActionTypeLabel(serviceAction.action_type || serviceAction.service_type)}
                                </span>
                                {serviceAction.customer_name && (
                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                        • {serviceAction.customer_name}
                                    </span>
                                )}
                                {serviceAction.customer_phone && (
                                    <span className="text-xs text-green-600 font-medium">
                                        {formatPhoneForLocalDisplay(serviceAction.customer_phone)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={isExpanded ? 'تصغير التفاصيل' : 'توسيع التفاصيل'}
                        >
                            <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Service Action Details */}
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-b border-gray-100 dark:border-gray-700">
                {/* Related Order Information */}
                {relatedOrder && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <span className="text-sm font-cairo font-semibold text-blue-800 dark:text-blue-200">
                                الطلب المرتبط
                            </span>
                        </div>
                        <div className="text-sm font-cairo text-blue-700 dark:text-blue-300">
                            <span className="font-medium">رقم التتبع:</span> {relatedOrder.tracking_number || relatedOrder.trackingNumber}
                        </div>
                        {relatedOrder.description && (
                            <div className="text-xs font-cairo text-blue-600 dark:text-blue-400 mt-1">
                                {relatedOrder.description}
                            </div>
                        )}
                    </div>
                )}

                {/* Product/Part Information */}
                {(serviceAction.product_name || serviceAction.part_name) && (
                    <div className="mb-3">
                        <div className="flex items-center space-x-1 space-x-reverse mb-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                            </svg>
                            <span className="text-gray-500 font-cairo text-xs">تفاصيل المنتج/القطعة</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            {serviceAction.product_name && (
                                <div className="mb-2">
                                    <span className="text-xs font-cairo text-gray-600 dark:text-gray-400">المنتج:</span>
                                    <p className="text-sm font-cairo font-medium text-gray-900 dark:text-gray-100">
                                        {serviceAction.product_name}
                                    </p>
                                </div>
                            )}
                            {serviceAction.part_name && (
                                <div className="mb-2">
                                    <span className="text-xs font-cairo text-gray-600 dark:text-gray-400">القطعة:</span>
                                    <p className="text-sm font-cairo font-medium text-gray-900 dark:text-gray-100">
                                        {serviceAction.part_name}
                                    </p>
                                </div>
                            )}
                            {serviceAction.replacement_product_name && (
                                <div>
                                    <span className="text-xs font-cairo text-gray-600 dark:text-gray-400">المنتج البديل:</span>
                                    <p className="text-sm font-cairo font-medium text-gray-900 dark:text-gray-100">
                                        {serviceAction.replacement_product_name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {serviceAction.notes && (
                    <div className="mb-3">
                        <div className="flex items-center space-x-1 space-x-reverse mb-1">
                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-gray-500 font-cairo text-xs">ملاحظات</span>
                        </div>
                        <p className="font-cairo text-xs text-gray-900 dark:text-gray-100 leading-relaxed bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            {serviceAction.notes}
                        </p>
                    </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-cairo">
                    <span>تم الإنشاء: {formatGregorianDate(serviceAction.created_at)}</span>
                    <span>{getRelativeTime(serviceAction.created_at)}</span>
                </div>
            </div>

            {/* Dynamic Actions */}
            {dynamicActions.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-white to-gray-50 border-t border-gray-200">
                    <div className="flex items-center space-x-2 space-x-reverse mb-3">
                        <div className="w-5 h-5 bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-sm font-cairo font-semibold text-gray-800">إجراءات متاحة</span>
                    </div>

                    <div className={`grid gap-2 ${dynamicActions.length >= 3 ? 'grid-cols-3' : dynamicActions.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {dynamicActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => handleActionClick(action)}
                                disabled={action.disabled || isActionLoading}
                                className={`
                  relative group px-4 py-2.5 rounded-lg font-cairo text-xs font-semibold transition-all duration-300
                  flex items-center justify-center space-x-1 space-x-reverse shadow-sm border-2
                  ${action.className}
                  ${action.disabled || isActionLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md hover:border-opacity-80'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red-500
                  w-full whitespace-nowrap
                `}
                                aria-label={action.label}
                            >
                                {/* Loading State */}
                                {isActionLoading && (
                                    <div className="absolute inset-0 bg-white/80 rounded-md flex items-center justify-center">
                                        <svg className="w-3 h-3 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}

                                <span className="font-cairo whitespace-nowrap">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Dynamic Input UI */}
            {showInput && activeAction && (
                <div className="p-4 bg-gradient-to-r from-white to-gray-50 border-t border-gray-200">
                    <div className="flex items-center space-x-2 space-x-reverse mb-3">
                        <div className="w-5 h-5 bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-sm font-cairo font-semibold text-gray-800">إدخال البيانات</span>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <label htmlFor={`input-${activeAction.type}`} className="text-xs font-cairo font-medium text-gray-700 dark:text-gray-300">
                            {activeAction.inputLabel}
                            {activeAction.inputType === 'tracking' && <span className="text-red-500 mr-1">*</span>}
                        </label>
                        <input
                            type={activeAction.inputType === 'tracking' ? 'text' : 'text'}
                            id={`input-${activeAction.type}`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className={`p-2 border rounded-md text-sm font-cairo focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 dark:bg-gray-700 dark:text-white ${activeAction.inputType === 'tracking' && !inputValue.trim()
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                            placeholder={activeAction.inputPlaceholder}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleInputSubmit();
                                }
                            }}
                            autoFocus
                        />
                        {activeAction.inputType === 'tracking' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                مثال: ABC123, 123ABC, ABC123DEF
                            </div>
                        )}
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleInputCancel}
                                className="p-2 px-4 text-sm font-cairo font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                disabled={isSubmitting}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleInputSubmit}
                                className={`p-2 px-4 text-sm font-cairo font-medium text-white rounded-md transition-colors ${isSubmitting || !inputValue.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                disabled={isSubmitting || !inputValue.trim()}
                            >
                                {isSubmitting ? 'جاري الإرسال...' : activeAction.label}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="p-4 space-y-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                        <h4 className="font-cairo font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">
                            تفاصيل إضافية
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                <span className="text-gray-500 font-cairo">معرف الإجراء:</span>
                                <p className="font-cairo font-medium mt-1">SA-{serviceAction.id || serviceAction._id}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                <span className="text-gray-500 font-cairo">النوع:</span>
                                <p className="font-cairo font-medium mt-1">{getActionTypeLabel(serviceAction.action_type || serviceAction.service_type)}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                <span className="text-gray-500 font-cairo">الحالة:</span>
                                <p className="font-cairo font-medium mt-1">{getServiceStatusLabel(serviceAction.status)}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                <span className="text-gray-500 font-cairo">الأولوية:</span>
                                <p className="font-cairo font-medium mt-1">{priorityInfo.label}</p>
                            </div>

                            {serviceAction.tracking_number && (
                                <div className="bg-white dark:bg-gray-800 rounded p-2">
                                    <span className="text-gray-500 font-cairo">رقم التتبع الجديد:</span>
                                    <p className="font-cairo font-medium mt-1">{serviceAction.tracking_number}</p>
                                </div>
                            )}

                            {serviceAction.updated_at && (
                                <div className="bg-white dark:bg-gray-800 rounded p-2">
                                    <span className="text-gray-500 font-cairo">آخر تحديث:</span>
                                    <p className="font-cairo font-medium mt-1">{formatGregorianDate(serviceAction.updated_at)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(ServiceCard);
