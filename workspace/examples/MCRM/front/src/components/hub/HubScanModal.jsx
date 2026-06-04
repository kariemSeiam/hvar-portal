import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { receivePackage, dispatchPackage } from '../../api/hubAPI';
import { Package, Truck, CheckCircle, X, AlertCircle, Info } from 'lucide-react';
import { getStatusConfig } from '../../utils/service/utils';
import { ServiceModalWrapper, ServiceModalHeader } from '../modals/shared';

/**
 * HubScanModal - Modal for scanning receive/send actions
 * Shows ticket items and important data, validates tracking numbers
 */
const HubScanModal = ({
    isOpen,
    onClose,
    onSuccess,
    ticket,
    actionType, // 'receive' or 'send'
    scannedTrackingNumber
}) => {
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState(null);

    // Validate tracking number based on action type
    useEffect(() => {
        if (!isOpen || !ticket || !scannedTrackingNumber) return;

        if (actionType === 'receive') {
            // For receive, check if scanned tracking matches new_tracking_receive
            const expectedTracking = ticket.new_tracking_receive || ticket.new_tracking_number;
            if (expectedTracking && scannedTrackingNumber !== expectedTracking) {
                setValidationError(`رقم التتبع المستلم (${scannedTrackingNumber}) لا يطابق رقم التتبع المتوقع (${expectedTracking})`);
            } else {
                setValidationError(null);
            }
        } else if (actionType === 'send') {
            // For send, check if scanned tracking matches new_tracking_send
            const expectedTracking = ticket.new_tracking_send;
            if (expectedTracking && scannedTrackingNumber !== expectedTracking) {
                setValidationError(`رقم التتبع المرسل (${scannedTrackingNumber}) لا يطابق رقم التتبع المتوقع (${expectedTracking})`);
            } else {
                setValidationError(null);
            }
        }
    }, [isOpen, ticket, actionType, scannedTrackingNumber]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setNotes('');
            setValidationError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validationError) {
            toast.error(validationError);
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const user_id = localStorage.getItem('user_id') || '1';

            const payload = {
                tracking_number: scannedTrackingNumber,
                user_id: parseInt(user_id),
                notes: notes.trim() || undefined
            };

            // Add action-specific data
            if (actionType === 'send') {
                payload.destination = 'العميل';
            }

            const result = actionType === 'receive'
                ? await receivePackage(payload)
                : await dispatchPackage(payload);

            if (result.success) {
                toast.success(actionType === 'receive' ? 'تم تسجيل الاستلام بنجاح' : 'تم تسجيل الإرسال بنجاح');
                onSuccess(result.data);
                onClose();
            } else {
                toast.error(result.error || 'فشل في تنفيذ الإجراء');
            }
        } catch (error) {
            console.error('Error executing scan action:', error);
            toast.error('حدث خطأ في تنفيذ الإجراء');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen || !ticket) return null;

    const actionConfig = {
        receive: {
            label: 'الاستلام',
            icon: Package,
            color: 'green',
            description: 'تسجيل استلام الطلب من العميل',
            btnText: 'تأكيد الاستلام'
        },
        send: {
            label: 'إرسال',
            icon: Truck,
            color: 'blue',
            description: 'تسجيل إرسال الطلب للعميل',
            btnText: 'تأكيد الإرسال'
        }
    };

    const config = actionConfig[actionType] || actionConfig.receive;
    const ActionIcon = config.icon;

    const customerName = ticket.customer_name || 'غير محدد';
    const ticketNumber = ticket.ticket_number || 'غير محدد';
    const serviceTypeLabels = {
        'replacement': 'استبدال',
        'maintenance': 'صيانة',
        'return': 'استرجاع'
    };

    // Get items by direction
    const getItemsByDirection = () => {
        if (!ticket.items || ticket.items.length === 0) return { send: [], receive: [] };

        return ticket.items.reduce((acc, item) => {
            const direction = item.direction?.toLowerCase();
            if (direction === 'send') {
                acc.send.push(item);
            } else if (direction === 'receive') {
                acc.receive.push(item);
            }
            return acc;
        }, { send: [], receive: [] });
    };

    const { send, receive } = getItemsByDirection();
    const itemsToShow = actionType === 'receive' ? receive : send;

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-2xl"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title={config.label}
                    subtitle={config.description}
                    icon={ActionIcon}
                    iconColor={config.color === 'green' ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600'}
                    onClose={handleClose}
                    isSubmitting={isSubmitting}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 space-y-4" dir="rtl">
                    {/* Ticket Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo block mb-1">العميل</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">{customerName}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo block mb-1">رقم التذكرة</span>
                                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{ticketNumber}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo block mb-1">نوع الخدمة</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                    {serviceTypeLabels[ticket.service_type] || ticket.service_type}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo block mb-1">الحالة</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                    {getStatusConfig(ticket.status?.toLowerCase()).label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tracking Number Display */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo block mb-1">
                                    رقم التتبع الممسوح
                                </span>
                                <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {scannedTrackingNumber}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Validation Error */}
                    {validationError && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                            <div className="flex items-start space-x-2 space-x-reverse">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="text-sm font-semibold text-red-700 dark:text-red-300 font-cairo block mb-1">
                                        تحذير: عدم تطابق رقم التتبع
                                    </span>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-cairo">
                                        {validationError}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                            {actionType === 'receive' ? 'المنتجات المستلمة' : 'المنتجات المرسلة'} ({itemsToShow.length})
                        </label>
                        {itemsToShow.length > 0 ? (
                            <div className="space-y-2">
                                {itemsToShow.map((item, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 space-x-reverse flex-1">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'product'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                    }`}>
                                                    {item.type === 'product' ? '📦' : '🔧'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                                        {item.name || `عنصر ${index + 1}`}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                        {item.sku || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                    {item.quantity}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo">
                                                    قطعة
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <Package className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-cairo">
                                    لا توجد منتجات للعرض
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                            ملاحظات
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 text-sm"
                            dir="rtl"
                            placeholder="ملاحظات إضافية..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-cairo disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !!validationError}
                            className={`px-6 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 ${config.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500' :
                                'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500'
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center space-x-2 space-x-reverse">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري المعالجة...</span>
                                </span>
                            ) : (
                                config.btnText
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </ServiceModalWrapper>
    );
};

export default HubScanModal;

