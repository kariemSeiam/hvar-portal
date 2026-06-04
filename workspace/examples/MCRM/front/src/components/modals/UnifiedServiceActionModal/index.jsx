import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { createTicket } from '../../../api/ticketsAPI';
import { useAuth } from '../../../contexts/AuthContext';
import ItemsSelectionSection from '../sections/ItemsSelectionSection';
import { getModalConfig } from './config';
import { getInitialFormData, getAutoFilledFormData, getAutoFillUpdates, applyCustomerTypePrices } from './formState';
import { buildTicketPayload } from './ticketPayload';
import { validateForm } from './formValidation';
import Header from './sections/Header';
import Footer from './sections/Footer';
import AddressSection from './sections/AddressSection';
import CustomerSection from './sections/CustomerSection';
import RefundSection from './sections/RefundSection';
import WorkflowSection from './sections/WorkflowSection';
import { getWorkflowDefinition } from '../../../utils/service/workflow';

/**
 * Service Action Modal — create or run workflow actions (return, replacement, maintenance, sell).
 */
function UnifiedServiceActionModal({
    isOpen,
    onClose,
    actionType,
    customerData,
    selectedOrder,
    onSuccess,
    className = '',
    existingServiceAction = null,
    workflowAction = null
}) {
    const { userInfo } = useAuth();
    const isWorkflowAction = existingServiceAction && workflowAction;
    const targetAction = existingServiceAction || { action_type: actionType };
    const workflowDefinition = getWorkflowDefinition(targetAction.action_type);
    const config = getModalConfig(actionType, { isWorkflowAction, existingServiceAction });

    const [formData, setFormData] = useState(() => getInitialFormData());
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedParts, setSelectedParts] = useState([]);
    const [showProductInput, setShowProductInput] = useState(false);
    const [showPartInput, setShowPartInput] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [partSearchQuery, setPartSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [itemsToSend, setItemsToSend] = useState([]);
    const [itemsToReceive, setItemsToReceive] = useState([]);

    const selectedProductIds = useMemo(() => selectedProducts.map(p => p.id), [selectedProducts]);
    const selectedPartIds = useMemo(() => selectedParts.map(p => p.id), [selectedParts]);

    const calculatedTotal = useMemo(() => {
        if (actionType !== 'sell') return null;
        return selectedParts.reduce((sum, item) => {
            const quantity = item.quantity || 1;
            const hasOverride = item.price_customer !== undefined && item.price_customer !== null;
            const basePrice = formData.customer_type === 'merchant' ? (item.price_merchant_base ?? 0) : (item.price_customer_base ?? 0);
            const price = hasOverride ? (parseFloat(item.price_customer) || 0) : basePrice;
            return sum + (quantity * price);
        }, 0);
    }, [actionType, selectedParts, formData.customer_type]);

    useEffect(() => {
        if (actionType === 'sell' && calculatedTotal !== null && !isWorkflowAction) {
            setFormData(prev => ({ ...prev, cost: calculatedTotal.toFixed(2) }));
        }
    }, [actionType, calculatedTotal, isWorkflowAction]);

    const handleAutoFill = useCallback(() => {
        const result = getAutoFillUpdates(formData, { customerData, selectedOrder, existingServiceAction, actionType });
        if (!result) {
            toast.error('لا توجد بيانات للملء التلقائي');
            return;
        }
        const { updates, filledCount } = result;
        if (filledCount > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
            toast.success(`تم ملء ${filledCount} حقل تلقائياً`);
        } else {
            toast.info('جميع الحقول مملوءة بالفعل');
        }
    }, [customerData, selectedOrder, existingServiceAction, formData, actionType]);

    const updatePricesForCustomerType = useCallback((newCustomerType) => {
        if (actionType !== 'sell') return;
        const { newParts, newProducts } = applyCustomerTypePrices(selectedParts, selectedProducts, newCustomerType);
        setSelectedParts(newParts);
        setSelectedProducts(newProducts);
    }, [actionType, selectedParts, selectedProducts]);

    useEffect(() => {
        if (isOpen && !existingServiceAction) {
            if (customerData && selectedOrder) {
                setFormData(getAutoFilledFormData(customerData, selectedOrder, actionType));
                if (customerData.phone || selectedOrder.tracking_number) {
                    toast.success('تم ملء البيانات تلقائياً من معلومات العميل والطلب');
                }
            } else {
                setFormData(getInitialFormData());
            }
            setSelectedProducts([]);
            setSelectedParts([]);
            setItemsToSend([]);
            setItemsToReceive([]);
        }
    }, [isOpen, existingServiceAction]);

    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) handleClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen, isSubmitting]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showProductInput && !e.target.closest('.product-dropdown')) setShowProductInput(false);
            if (showPartInput && !e.target.closest('.part-dropdown')) setShowPartInput(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProductInput, showPartInput]);

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(formData, {
            actionType,
            isWorkflowAction,
            workflowAction,
            existingServiceAction,
            config,
            itemsToSend,
            itemsToReceive,
            selectedParts
        });
        if (validationErrors.length > 0) {
            toast.error(`الحقول المطلوبة: ${validationErrors.join('، ')}`);
            return;
        }
        setIsSubmitting(true);
        try {
            let result;
            if (isWorkflowAction) {
                toast.error('سير العمل من هذه النافذة غير متصل بالخادم — استخدم إجراءات التذكرة من القائمة');
                setIsSubmitting(false);
                return;
            }
            const ticketData = buildTicketPayload(formData, actionType, {
                customerId: customerData?.id || null,
                userId: userInfo?.id ?? 1,
                selectedProducts,
                selectedParts,
                itemsToSend,
                itemsToReceive
            });
            result = await createTicket(ticketData);
            if (result && result.id) {
                toast.success(`تم إنشاء إجراء ${config.title} بنجاح`);
                onSuccess(result);
            } else {
                toast.error('فشل في تنفيذ العملية');
            }
        } catch (err) {
            console.error('Error processing service action:', err);
            toast.error('حدث خطأ في تنفيذ العملية');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData(getInitialFormData());
            setSelectedProducts([]);
            setSelectedParts([]);
            setItemsToSend([]);
            setItemsToReceive([]);
            setShowProductInput(false);
            setShowPartInput(false);
            setProductSearchQuery('');
            setPartSearchQuery('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide ${className}`} onClick={(e) => e.stopPropagation()}>
                <Header config={config} isWorkflowAction={isWorkflowAction} existingServiceAction={existingServiceAction} customerData={customerData} selectedOrder={selectedOrder} onAutoFill={handleAutoFill} onClose={handleClose} isSubmitting={isSubmitting} />
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {!isWorkflowAction && <CustomerSection formData={formData} onInputChange={handleInputChange} />}
                    {isWorkflowAction && <WorkflowSection workflowAction={workflowAction} formData={formData} onInputChange={handleInputChange} existingServiceAction={existingServiceAction} />}
                    <AddressSection formData={formData} onInputChange={handleInputChange} />
                    <ItemsSelectionSection
                        actionType={actionType === 'return' ? 'return' : actionType === 'maintenance' ? 'maintenance' : actionType}
                        selectedProducts={selectedProducts}
                        selectedParts={selectedParts}
                        itemsToSend={itemsToSend}
                        itemsToReceive={itemsToReceive}
                        onProductsChange={setSelectedProducts}
                        onPartsChange={setSelectedParts}
                        onItemsToSendChange={setItemsToSend}
                        onItemsToReceiveChange={setItemsToReceive}
                        isLoading={isLoading}
                        disabled={isSubmitting}
                        enableAutoRefresh={true}
                        refreshInterval={30000}
                        customerType={actionType === 'sell' ? formData.customer_type : undefined}
                    />
                    {!isWorkflowAction && <RefundSection actionType={actionType} formData={formData} onInputChange={handleInputChange} calculatedTotal={calculatedTotal} isSellReadOnly={actionType === 'sell'} />}
                    <Footer config={config} isWorkflowAction={isWorkflowAction} workflowAction={workflowAction} onClose={handleClose} isSubmitting={isSubmitting} />
                </form>
            </div>
        </div>
    );
}

export default UnifiedServiceActionModal;
