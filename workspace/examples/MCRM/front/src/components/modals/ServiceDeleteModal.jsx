import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { deleteTicket } from '../../api/ticketsAPI';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ServiceModalWrapper, ServiceModalHeader, TicketInfoCard } from './shared';

/**
 * ServiceDeleteModal - Modal for deleting cancelled service tickets
 * Only cancelled tickets can be deleted. This operation is irreversible.
 */
const ServiceDeleteModal = ({
    isOpen,
    onClose,
    onSuccess,
    action
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const user_id = localStorage.getItem('user_id') || '1';

            const payload = {
                user_id: parseInt(user_id)
            };

            const result = await deleteTicket(action.id, payload);

            if (result) {
                toast.success('تم حذف التذكرة بنجاح');
                onSuccess(action.id);
                onClose();
            } else {
                toast.error('فشل في حذف التذكرة');
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ في حذف التذكرة';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen || !action) return null;

    const customerName = action.customer_name || 'غير محدد';
    const trackingNumber = action.original_tracking || action.ticket_number || 'غير محدد';
    const ticketNumber = action.ticket_number || 'غير محدد';

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-2xl"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title="حذف التذكرة نهائياً"
                    subtitle="هذا الإجراء لا يمكن التراجع عنه"
                    icon={Trash2}
                    iconColor="from-red-600 to-red-700"
                    onClose={handleClose}
                    isSubmitting={isSubmitting}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Warning */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border-2 border-red-300 dark:border-red-700">
                    <div className="flex items-start space-x-3 space-x-reverse">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-red-900 dark:text-red-100 font-cairo mb-2">
                                تحذير: عملية حذف نهائية
                            </h3>
                            <p className="text-xs text-red-800 dark:text-red-200 font-cairo leading-relaxed">
                                سيتم حذف التذكرة وجميع البيانات المرتبطة بها نهائياً من النظام. هذا يشمل:
                            </p>
                            <ul className="text-xs text-red-800 dark:text-red-200 font-cairo mt-2 mr-4 list-disc space-y-1">
                                <li>تفاصيل التذكرة والقطع</li>
                                <li>سجل التغييرات والحركات</li>
                                <li>عمليات المسح المرتبطة</li>
                                <li>حركات المخزون (إن وجدت)</li>
                            </ul>
                            <p className="text-xs text-red-800 dark:text-red-200 font-cairo font-bold mt-3">
                                لا يمكن استعادة البيانات بعد الحذف!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ticket Info */}
                <TicketInfoCard
                    customerName={customerName}
                    trackingNumber={trackingNumber}
                    ticketNumber={ticketNumber}
                />

                    {/* Confirmation Text */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
                        <p className="text-sm text-yellow-900 dark:text-yellow-100 font-cairo text-center">
                            هل أنت متأكد من رغبتك في <span className="font-bold">حذف هذه التذكرة نهائياً</span>؟
                        </p>
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
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center space-x-2 space-x-reverse">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري الحذف...</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-2 space-x-reverse">
                                    <Trash2 className="w-4 h-4" />
                                    <span>حذف نهائياً</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </ServiceModalWrapper>
    );
};

export default ServiceDeleteModal;
