import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
    Package, MapPin, User, Truck, Eye, CheckCircle, X, Wrench, Settings, 
    RotateCcw, RefreshCw, QrCode, ThumbsUp, Calendar, Info, Trash2 
} from 'lucide-react';
import { ServiceStatusBadge, SessionStyleMoneyBadge } from '../ui';
import { formatPhoneForLocalDisplay } from '../../utils/core/phone';
import { getSafeNotesDisplay } from '../../utils/ui/notes';
import { formatServiceType, formatPriority, getPriorityColor } from '../../utils/service/utils';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';

/**
 * ServiceActionDisplayModal - Enhanced modal with actions
 * Displays action details and available actions in expert design
 */
const ServiceActionDisplayModal = ({
    isOpen,
    onClose,
    action,
    onAction,
    availableActions
}) => {
    if (!isOpen || !action) return null;

    // Icon mapping function
    const getIconComponent = (iconName) => {
        const iconMap = {
            'AlertTriangle': Info,
            'Clock': Calendar,
            'CheckCircle': CheckCircle,
            'Wrench': Wrench,
            'Package': Package,
            'Settings': Settings,
            'RotateCcw': RotateCcw,
            'RefreshCw': RefreshCw,
            'Eye': Eye,
            'Truck': Truck,
            'QrCode': QrCode,
            'Loader': RefreshCw,
            'ThumbsUp': ThumbsUp,
            'Calendar': Calendar,
            'Info': Info,
            'X': X,
            'Trash2': Trash2,
            'Scan': QrCode,
            'ScanLine': QrCode
        };
        return iconMap[iconName] || CheckCircle;
    };

    // Get filtered actions (exclude 'view' since we're already viewing)
    const actions = useMemo(() => {
        if (!availableActions) return [];
        const actionsList = typeof availableActions === 'function' ? availableActions() : availableActions;
        return actionsList.filter(actionItem => actionItem.id !== 'view');
    }, [availableActions]);

    // Handle action click
    const handleActionClick = (actionId) => {
        if (onAction) {
            onAction(actionId);
            // Close display modal when opening another modal
            if (actionId !== 'refresh') {
                onClose();
            }
        }
    };

    const normalizedStatus = useMemo(() => action.status ? action.status.toLowerCase() : 'pending', [action.status]);

    const serviceType = useMemo(() => formatServiceType(action.service_type), [action.service_type]);
    const priority = useMemo(() => formatPriority(action.priority), [action.priority]);
    const priorityColor = useMemo(() => getPriorityColor(action.priority), [action.priority]);

    const headerSubtitle = action.ticket_number ? `رقم التذكرة: ${action.ticket_number}` : undefined;

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-2xl"
            maxHeight="max-h-[85vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title="عرض الخدمة"
                    subtitle={headerSubtitle}
                    icon={Eye}
                    iconColor="from-blue-500 to-blue-600"
                    onClose={onClose}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-4">
                    {/* Status Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">الحالة</p>
                            <ServiceStatusBadge status={normalizedStatus} size="sm" showIcon={true} />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">الأولوية</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${priorityColor}`}>
                                {priority}
                            </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 col-span-2 sm:col-span-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">النوع</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {serviceType}
                            </p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    {(action.customer_name || action.phone) && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                بيانات العميل
                            </h3>
                            {action.customer_name && (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">الاسم:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">{action.customer_name}</span>
                                </div>
                            )}
                            {action.phone && (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">الهاتف:</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono" dir="ltr">{formatPhoneForLocalDisplay(action.phone)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Location Info */}
                    {(action.city || action.governorate || action.customer_address) && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                الموقع
                            </h3>
                            {(action.city || action.governorate) && (
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {action.city && <span>{action.city}</span>}
                                    {action.city && action.governorate && <span> • </span>}
                                    {action.governorate && <span>{action.governorate}</span>}
                                </p>
                            )}
                            {action.customer_address && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {action.customer_address}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Tracking Numbers */}
                    {(action.original_tracking || action.new_tracking_send || action.new_tracking_receive) && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                أرقام التتبع
                            </h3>
                            {action.original_tracking && (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">الأصلي:</span>
                                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 text-right break-all">{action.original_tracking}</span>
                                </div>
                            )}
                            {action.new_tracking_send && (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">إرسال:</span>
                                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 text-right break-all">{action.new_tracking_send}</span>
                                </div>
                            )}
                            {action.new_tracking_receive && (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">الاستلام:</span>
                                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 text-right break-all">{action.new_tracking_receive}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Items */}
                    {action.items && action.items.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                                العناصر ({action.items.length})
                            </h3>
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                                {action.items.map((item, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 text-xs flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <span className={`px-1 py-0.5 rounded text-xs font-medium whitespace-nowrap ${item.condition === 'valid'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {item.condition === 'valid' ? 'سليم' : 'تالف'}
                                            </span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">×{item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cost */}
                    {action.cost_adjustment != null && String(action.cost_adjustment).trim() !== '' && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-cairo">تعديل التكلفة</p>
                            <SessionStyleMoneyBadge value={action.cost_adjustment} size="md" variant="badge" />
                        </div>
                    )}

                    {/* Notes */}
                    {(() => {
                        const safeNotes = getSafeNotesDisplay(action.notes);
                        if (!safeNotes) return null;
                        return (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">ملاحظات</p>
                                <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                                    {safeNotes}
                                </p>
                            </div>
                        );
                    })()}

                    {/* Reason */}
                    {action.reason && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">السبب</p>
                            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                                {action.reason}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer with Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
                    {/* Actions Section */}
                    {actions.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {actions.map((actionItem) => {
                                const IconComponent = getIconComponent(actionItem.icon);
                                const isPrimary = actionItem.variant === 'primary';
                                const isDanger = actionItem.variant === 'danger';
                                
                                // Get color classes based on action color
                                const getActionColorClasses = (color, variant) => {
                                    if (variant === 'danger') {
                                        return 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg';
                                    }
                                    if (variant === 'primary') {
                                        const colorMap = {
                                            blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg',
                                            green: 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg',
                                            orange: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg',
                                            purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg',
                                            amber: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg',
                                            red: 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg',
                                            gray: 'bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg'
                                        };
                                        return colorMap[color] || 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg';
                                    }
                                    return 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md';
                                };
                                
                                return (
                                    <button
                                        key={actionItem.id}
                                        onClick={() => handleActionClick(actionItem.id)}
                                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-cairo font-medium transition-all duration-200 hover:scale-105 active:scale-95 min-h-[40px] sm:min-h-[44px] ${getActionColorClasses(actionItem.color, actionItem.variant)}`}
                                        title={actionItem.label}
                                        aria-label={actionItem.label}
                                    >
                                        <IconComponent className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                        <span className="whitespace-nowrap">{actionItem.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[40px] sm:min-h-[44px] ${actions.length > 0 ? 'sm:ml-auto' : 'ml-auto'}`}
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </ServiceModalWrapper>
    );
};

ServiceActionDisplayModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    action: PropTypes.object,
    onAction: PropTypes.func,
    availableActions: PropTypes.oneOfType([PropTypes.func, PropTypes.array])
};

export default ServiceActionDisplayModal;

