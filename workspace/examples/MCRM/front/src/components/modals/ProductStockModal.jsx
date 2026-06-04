/**
 * ProductStockModal Component
 * Manages stock adjustments using the manual adjustment API endpoint.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Package, TrendingUp, TrendingDown, X, Plus, Minus, CheckCircle, AlertTriangle } from 'lucide-react';
import { stockAPI } from '../../api/stockAPI';
import { useAuth } from '../../contexts/AuthContext';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';

/**
 * ProductStockModal Component
 * Manages stock adjustments using the manual adjustment API endpoint.
 */
const ProductStockModal = ({
    isOpen,
    onClose,
    onSuccess,
    item = null, // Can be a product or a part
    title = 'تعديل يدوي للمخزون'
}) => {
    const { userInfo } = useAuth();

    // Form state - Aligned with POST /api/stock/manual
    const [formData, setFormData] = useState({
        sku: '',
        quantity: '',
        condition: 'valid',
        user_id: userInfo?.id ?? 'system',
        notes: ''
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [operationType, setOperationType] = useState('add'); // 'add' or 'decrease'

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen && item) {
            setFormData({
                sku: item.sku || '',
                quantity: '',
                condition: 'valid',
                user_id: userInfo?.id ?? 'system',
                notes: 'تعديل يدوي من لوحة التحكم'
            });
            setOperationType('add');
        }
    }, [isOpen, item, userInfo]);

    // Handle input changes
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Handle stock operation submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!item?.sku) {
            toast.error('SKU الخاص بالعنصر غير محدد');
            return;
        }

        const quantity = parseInt(formData.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast.error('الكمية يجب أن تكون رقمًا صحيحًا موجبًا');
            return;
        }

        // Convert to negative if operation is decrease
        const finalQuantity = operationType === 'decrease' ? -quantity : quantity;

        const payload = {
            ...formData,
            quantity: finalQuantity
        };

        setIsLoading(true);
        try {
            const response = await stockAPI.manualStockAdjustment(payload);

            if (response.success) {
                toast.success(response.message || 'تم تحديث المخزون بنجاح');
                try {
                    onSuccess?.(response.data.item);
                } catch (callbackError) {
                    console.error('Error in success callback:', callbackError);
                }
                onClose();
            } else {
                toast.error(response.message || 'فشل في تحديث المخزون');
            }
        } catch (error) {
            console.error('Error performing manual stock adjustment:', error);
            toast.error('حدث خطأ أثناء تحديث المخزون');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-lg"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title={title}
                    subtitle={item ? `${item.name} (${item.sku})` : undefined}
                    icon={Package}
                    iconColor="from-blue-500 to-blue-600"
                    onClose={onClose}
                    isSubmitting={isLoading}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 space-y-4" dir="rtl">
                    {/* Current Stock Display */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 font-cairo">
                            المخزون الحالي
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-cairo mb-1">السليم</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400 font-cairo">
                                    {item?.availableStock || 0}
                                </p>
                            </div>
                            <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-cairo mb-1">التالف</p>
                                <p className="text-xl font-bold text-red-600 dark:text-red-400 font-cairo">
                                    {item?.quantityDamaged || 0}
                                </p>
                            </div>
                        </div>

                        {/* Operation Type Tabs */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-cairo">
                                نوع العملية
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOperationType('add')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-cairo ${
                                        operationType === 'add'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500 dark:border-green-400'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Plus className="w-4 h-4" />
                                    إضافة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOperationType('decrease')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-cairo ${
                                        operationType === 'decrease'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500 dark:border-red-400'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Minus className="w-4 h-4" />
                                    خصم
                                </button>
                            </div>
                        </div>

                        {/* Condition Tabs */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-cairo">
                                حالة الكمية المعدلة
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('condition', 'valid')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-cairo ${
                                        formData.condition === 'valid'
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500 dark:border-green-400'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    سليم
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange('condition', 'damaged')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-cairo ${
                                        formData.condition === 'damaged'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500 dark:border-red-400'
                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    تالف
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                            الكمية <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand-red-500 focus:ring-2 focus:ring-brand-red-500/20 text-sm"
                            placeholder="أدخل الكمية"
                            required
                        />
                    </div>

                    {/* Notes (Reason) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                            الملاحظات (السبب) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand-red-500 focus:ring-2 focus:ring-brand-red-500/20 text-sm"
                            placeholder="أدخل سبب التعديل..."
                            rows={3}
                            required
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-cairo disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 hover:from-brand-blue-700 hover:to-brand-blue-800 disabled:from-gray-400 disabled:to-gray-500"
                        >
                            {isLoading ? (
                                <span className="flex items-center space-x-2 space-x-reverse">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري التنفيذ...</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-2 space-x-reverse">
                                    <Package className="w-4 h-4" />
                                    <span>تنفيذ التعديل</span>
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </ServiceModalWrapper>
    );
};

export default ProductStockModal;