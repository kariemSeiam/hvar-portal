/**
 * ProductPartsManagementModal Component
 * Manages a product's bill of materials (components/parts).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Wrench, Plus, Trash2, X, Search, Package } from 'lucide-react';
import { stockAPI } from '../../api/stockAPI';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';

const ProductPartsManagementModal = ({
    isOpen,
    onClose,
    onSuccess,
    product = null,
    title = 'إدارة مكونات المنتج'
}) => {
    // State management
    const [components, setComponents] = useState([]);
    const [allParts, setAllParts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add component form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedPartId, setSelectedPartId] = useState('');
    const [quantityNeeded, setQuantityNeeded] = useState(1);

    // Load product components and all available parts when modal opens
    useEffect(() => {
        if (isOpen && product?.id) {
            loadProductComponents();
            loadAllParts();
        } else {
            // Reset state when closing
            setComponents([]);
            setAllParts([]);
            setShowAddForm(false);
            setSelectedPartId('');
            setQuantityNeeded(1);
        }
    }, [isOpen, product]);

    // Load product's current components
    const loadProductComponents = async () => {
        if (!product?.id) return;

        setIsLoading(true);
        try {
            const response = await stockAPI.getStockItemById(product.id);
            if (response.success) {
                setComponents(response.data.components || []);
            } else {
                toast.error(response.message || 'فشل في تحميل مكونات المنتج');
            }
        } catch (error) {
            console.error('Error loading product components:', error);
            toast.error('حدث خطأ أثناء تحميل مكونات المنتج');
        } finally {
            setIsLoading(false);
        }
    };

    // Load all available parts to be used in the selector
    const loadAllParts = async () => {
        try {
            // Using getParts which now calls the correct endpoint
            const response = await stockAPI.getParts({ limit: 1000 }); // Assuming max 1000 parts
            if (response.success) {
                setAllParts(response.data.items || []);
            }
        } catch (error) {
            console.error('Error loading all parts:', error);
        }
    };

    // Handle adding a new component
    const handleAddComponent = async (e) => {
        e.preventDefault();
        if (!selectedPartId || !quantityNeeded) {
            toast.error('الرجاء اختيار قطعة وتحديد الكمية');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                part_id: parseInt(selectedPartId),
                quantity_needed: parseInt(quantityNeeded)
            };
            const response = await stockAPI.addComponentToProduct(product.id, payload);

            if (response.success) {
                toast.success('تمت إضافة المكون بنجاح');
                loadProductComponents(); // Refresh the list
                onSuccess?.();
                // Reset form
                setSelectedPartId('');
                setQuantityNeeded(1);
                setShowAddForm(false);
            } else {
                toast.error(response.message || 'فشل في إضافة المكون');
            }
        } catch (error) {
            console.error('Error adding component:', error);
            toast.error('حدث خطأ أثناء إضافة المكون');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle removing a component
    const handleRemoveComponent = async (componentId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المكون؟')) return;

        setIsSubmitting(true);
        try {
            const response = await stockAPI.removeComponentFromProduct(product.id, componentId);
            if (response.success) {
                toast.success('تمت إزالة المكون بنجاح');
                loadProductComponents(); // Refresh the list
                onSuccess?.();
            } else {
                toast.error(response.message || 'فشل في إزالة المكون');
            }
        } catch (error) {
            console.error('Error removing component:', error);
            toast.error('حدث خطأ أثناء إزالة المكون');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-2xl"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title={title}
                    subtitle={product?.name}
                    icon={Wrench}
                    iconColor="from-purple-500 to-purple-600"
                    onClose={onClose}
                    isSubmitting={isSubmitting}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4" dir="rtl">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo">جاري تحميل المكونات...</p>
                        </div>
                    ) : (
                        <>
                            {/* Add Component Form */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <button 
                                    onClick={() => setShowAddForm(!showAddForm)} 
                                    className="w-full text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors font-cairo"
                                >
                                    <span>إضافة مكون جديد</span>
                                    <Plus className={`w-5 h-5 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
                                </button>
                                {showAddForm && (
                                    <form onSubmit={handleAddComponent} className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">القطعة</label>
                                            <select
                                                value={selectedPartId}
                                                onChange={(e) => setSelectedPartId(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand-red-500 focus:ring-2 focus:ring-brand-red-500/20 text-sm"
                                                required
                                            >
                                                <option value="">اختر قطعة...</option>
                                                {allParts.map(part => (
                                                    <option key={part.id} value={part.id}>
                                                        {part.name} ({part.sku})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">الكمية المطلوبة</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantityNeeded}
                                                onChange={(e) => setQuantityNeeded(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand-red-500 focus:ring-2 focus:ring-brand-red-500/20 text-sm"
                                                required
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting} 
                                            className="w-full px-4 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500"
                                        >
                                            {isSubmitting ? 'جاري الإضافة...' : 'إضافة المكون'}
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Components List */}
                            {components.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo">لا توجد مكونات مضافة لهذا المنتج</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {components.map((component) => (
                                        <div key={component.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex items-center justify-between hover:shadow-md transition-shadow">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">{component.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo mt-1">الكمية: {component.quantity_needed}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveComponent(component.id)}
                                                disabled={isSubmitting}
                                                className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ServiceModalWrapper>
    );
};

export default ProductPartsManagementModal;