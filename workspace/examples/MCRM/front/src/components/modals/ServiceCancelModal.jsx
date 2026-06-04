import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { cancelTicket } from '../../api/ticketsAPI';
import { AlertTriangle } from 'lucide-react';
import { ServiceModalWrapper, ServiceModalHeader, TicketInfoCard } from './shared';

/**
 * ServiceCancelModal - Modal for canceling service tickets
 * Handles ticket cancellation with reason and notes
 */
const ServiceCancelModal = ({
    isOpen,
    onClose,
    onSuccess,
    action
}) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setDescription('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const user_id = localStorage.getItem('user_id') || '1';

            const payload = {
                user_id: parseInt(user_id),
                reason: description.trim() || 'Cancelled by user.',
                description: description.trim() || ''
            };

            const result = await cancelTicket(action.id, payload);

            if (result) {
                toast.success('تم إلغاء التذكرة بنجاح');
                onSuccess(result);
                onClose();
            } else {
                toast.error('فشل في إلغاء التذكرة');
            }
        } catch (error) {
            console.error('Error canceling ticket:', error);
            const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ في إلغاء التذكرة';
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

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-2xl"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title="إلغاء التذكرة"
                    subtitle="إلغاء تذكرة الخدمة وإعادة المخزون المحجوز"
                    icon={AlertTriangle}
                    iconColor="from-red-500 to-red-600"
                    onClose={handleClose}
                    isSubmitting={isSubmitting}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Ticket Info */}
                <TicketInfoCard
                    customerName={customerName}
                    trackingNumber={trackingNumber}
                />

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                            سبب الإلغاء
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm"
                            dir="rtl"
                            placeholder="أدخل سبب الإلغاء (اختياري)"
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
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500"
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
                                'إلغاء التذكرة'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </ServiceModalWrapper>
    );
};

export default ServiceCancelModal;

