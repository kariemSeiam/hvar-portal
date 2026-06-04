/**
 * Form state (initial, auto-fill, price helpers) for Service Action Modal.
 */

export function getInitialFormData() {
    return {
        customer_phone: '',
        customer_phone_secondary: '',
        customer_full_name: '',
        original_tracking_number: '',
        priority: 'medium',
        cost: '',
        notes: '',
        refund_amount: '',
        tracking_number: '',
        scanned_by: 'فني الصيانة',
        scan_location: 'الصيانة المركزية',
        customer_type: 'customer',
        pickup_address: { governorate: '', city: '', details: '' }
    };
}

export function getAutoFilledFormData(customerData, selectedOrder, actionType) {
    const data = {
        ...getInitialFormData(),
        customer_phone: customerData.phone || customerData.customer_phone || '',
        customer_phone_secondary: customerData.phone_secondary || customerData.customer_second_phone || customerData.second_phone || '',
        customer_full_name: customerData.name || customerData.customer_name || customerData.full_name || customerData.customer_full_name || '',
        original_tracking_number: selectedOrder.tracking_number || selectedOrder.trackingNumber || '',
        priority: selectedOrder.priority || 'medium',
        notes: selectedOrder.notes || '',
        pickup_address: {
            governorate: customerData.governorate || selectedOrder.customerAddress?.governorate || selectedOrder.government || '',
            city: customerData.city || selectedOrder.customerAddress?.city || selectedOrder.city || '',
            details: customerData.address_details || selectedOrder.customerAddress?.fullAddress || selectedOrder.pickup_full_address || ''
        }
    };
    if (actionType === 'return' && selectedOrder.cod_amount) data.refund_amount = selectedOrder.cod_amount.toString();
    if (actionType === 'maintenance' && selectedOrder.estimated_cost) data.cost = selectedOrder.estimated_cost.toString();
    return data;
}

export function getAutoFillUpdates(formData, { customerData, selectedOrder, existingServiceAction, actionType }) {
    if (!customerData && !selectedOrder && !existingServiceAction) return null;
    const updates = {};
    let filledCount = 0;
    if (existingServiceAction) {
        if (!formData.customer_phone && existingServiceAction.customer_phone) { updates.customer_phone = existingServiceAction.customer_phone; filledCount++; }
        if (!formData.customer_full_name && existingServiceAction.customer_full_name) { updates.customer_full_name = existingServiceAction.customer_full_name; filledCount++; }
        if (!formData.original_tracking_number && existingServiceAction.original_tracking_number) { updates.original_tracking_number = existingServiceAction.original_tracking_number; filledCount++; }
        if (!formData.tracking_number && existingServiceAction.new_tracking_number) { updates.tracking_number = existingServiceAction.new_tracking_number; filledCount++; }
    }
    if (!formData.customer_phone && customerData?.phone) { updates.customer_phone = customerData.phone; filledCount++; }
    if (!formData.customer_full_name && customerData?.name) { updates.customer_full_name = customerData.name; filledCount++; }
    if (!formData.original_tracking_number && selectedOrder?.tracking_number) { updates.original_tracking_number = selectedOrder.tracking_number; filledCount++; }
    if (actionType === 'return' && !formData.refund_amount && selectedOrder?.cod_amount) { updates.refund_amount = selectedOrder.cod_amount.toString(); filledCount++; }
    if (!formData.pickup_address?.governorate && (customerData?.governorate || selectedOrder?.customerAddress?.governorate)) {
        updates.pickup_address = {
            ...formData.pickup_address,
            governorate: customerData?.governorate || selectedOrder?.customerAddress?.governorate || '',
            city: customerData?.city || selectedOrder?.customerAddress?.city || formData.pickup_address?.city || '',
            details: customerData?.address_details || selectedOrder?.customerAddress?.fullAddress || formData.pickup_address?.details || ''
        };
        filledCount++;
    }
    return { updates, filledCount };
}

function mapItemPrice(item, newCustomerType) {
    const basePrice = newCustomerType === 'merchant' ? (item.price_merchant_base || 0) : (item.price_customer_base || 0);
    const currentPrice = item.price_customer;
    const isOverride = currentPrice !== undefined && currentPrice !== (item.price_customer_base || 0) && currentPrice !== (item.price_merchant_base || 0);
    return { ...item, price_customer: isOverride ? currentPrice : basePrice };
}

export function applyCustomerTypePrices(selectedParts, selectedProducts, newCustomerType) {
    return {
        newParts: selectedParts.map(item => mapItemPrice(item, newCustomerType)),
        newProducts: selectedProducts.map(item => mapItemPrice(item, newCustomerType))
    };
}
