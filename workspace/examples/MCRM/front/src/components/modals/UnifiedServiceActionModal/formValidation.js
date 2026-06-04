/**
 * Form validation for Service Action Modal (creation and workflow).
 * Returns array of field labels for missing/invalid required fields.
 */

export function validateForm(formData, options) {
    const {
        actionType,
        isWorkflowAction,
        workflowAction,
        existingServiceAction,
        config,
        itemsToSend = [],
        itemsToReceive = [],
        selectedParts = []
    } = options;

    const validationErrors = [];

    if (!isWorkflowAction) {
        if (!formData.customer_phone?.trim()) {
            validationErrors.push('رقم هاتف العميل');
        }
        if (!formData.customer_full_name?.trim()) {
            validationErrors.push('اسم العميل');
        }

        if (actionType === 'replacement') {
            if (config.requiresItems && itemsToSend.length === 0) {
                validationErrors.push('العناصر المراد إرسالها');
            }
            if (config.requiresItems && itemsToReceive.length === 0) {
                validationErrors.push('العناصر المراد استلامها');
            }
        }

        if (actionType === 'sell') {
            if (selectedParts.length === 0) {
                validationErrors.push('يجب اختيار قطعة واحدة على الأقل للبيع');
            }
        }

        if (formData.pickup_address?.governorate && (!formData.pickup_address.governorate?.trim() || !formData.pickup_address.city?.trim() || !formData.pickup_address.details?.trim())) {
            validationErrors.push('عنوان الاستلام (المحافظة، المدينة، التفاصيل)');
        }
    }

    if (isWorkflowAction) {
        if (workflowAction === 'pending_send_confirmation') {
            if (!formData.tracking_number?.trim()) {
                validationErrors.push('رقم التتبع مطلوب لتأكيد الإرسال المعلق');
            } else if (existingServiceAction?.new_tracking_number && formData.tracking_number !== existingServiceAction.new_tracking_number) {
                validationErrors.push('رقم التتبع يجب أن يطابق رقم التتبع الجديد المؤكد');
            }
        }
        if (workflowAction === 'scan_send') {
            if (itemsToSend.length === 0) {
                validationErrors.push('يجب تحديد العناصر المراد إرسالها');
            }
        }
    }

    return validationErrors;
}
