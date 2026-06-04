/**
 * Build ticket payload for createTicket from Service Action Modal form data.
 */

export function buildTicketPayload(formData, actionType, options) {
    const {
        customerId = null,
        userId = 1,
        selectedProducts = [],
        selectedParts = [],
        itemsToSend = [],
        itemsToReceive = []
    } = options;

    const ticketData = {
        type: actionType,
        customer_id: customerId,
        user_id: userId,
        notes: formData.notes || '',
        priority: formData.priority,
        items: [],
        original_tracking: formData.original_tracking_number,
        reason: '',
        cost_adjustment: formData.cost ? parseFloat(formData.cost) : undefined,
        name: formData.customer_full_name,
        phone: formData.customer_phone,
        phone_secondary: formData.customer_phone_secondary || undefined,
        city: formData.pickup_address?.city || undefined,
        governorate: formData.pickup_address?.governorate || undefined,
        address_details: formData.pickup_address?.details || undefined
    };

    if (actionType === 'return') {
        ticketData.refund_amount = parseFloat(formData.refund_amount) || undefined;
        if (itemsToReceive.length > 0) {
            ticketData.items = itemsToReceive.map(item => ({
                item_id: item.id,
                quantity: parseInt(item.quantity) || 1,
                direction: 'receive',
                condition: item.condition || 'damaged'
            }));
        }
    }

    if (actionType === 'replacement') {
        const sendItems = itemsToSend.map(item => ({
            item_id: item.id,
            quantity: parseInt(item.quantity) || 1,
            direction: 'send',
            condition: item.condition || 'valid'
        }));
        const receiveItems = itemsToReceive.map(item => ({
            item_id: item.id,
            quantity: parseInt(item.quantity) || 1,
            direction: 'receive',
            condition: item.condition || 'damaged'
        }));
        ticketData.items = [...sendItems, ...receiveItems];
    }

    if (actionType === 'maintenance') {
        const receiveItems = itemsToReceive.map(item => ({
            item_id: item.id,
            quantity: parseInt(item.quantity) || 1,
            direction: 'receive',
            condition: item.condition || 'damaged'
        }));
        const sendItems = itemsToSend.map(item => ({
            item_id: item.id,
            quantity: parseInt(item.quantity) || 1,
            direction: 'send',
            condition: item.condition || 'valid'
        }));
        const combined = [...receiveItems, ...sendItems];
        if (combined.length > 0) {
            ticketData.items = combined;
        }
    }

    if (actionType === 'sell') {
        const customerType = formData.customer_type || 'customer';
        const getBasePrice = (item) =>
            customerType === 'merchant'
                ? (item.price_merchant_base || 0)
                : (item.price_customer_base || 0);

        const partsItems = selectedParts.map(item => {
            const basePrice = getBasePrice(item);
            const currentPrice = parseFloat(item.price_customer) || 0;
            const priceOverride = (currentPrice !== basePrice && currentPrice !== 0) ? currentPrice : null;
            return {
                item_id: item.id,
                quantity: parseInt(item.quantity) || 1,
                direction: 'send',
                condition: item.condition || 'valid',
                price_customer: priceOverride
            };
        });
        const productsItems = selectedProducts.map(item => {
            const basePrice = getBasePrice(item);
            const currentPrice = parseFloat(item.price_customer) || 0;
            const priceOverride = (currentPrice !== basePrice && currentPrice !== 0) ? currentPrice : null;
            return {
                item_id: item.id,
                quantity: parseInt(item.quantity) || 1,
                direction: 'send',
                condition: item.condition || 'valid',
                price_customer: priceOverride
            };
        });
        ticketData.items = [...partsItems, ...productsItems];
        ticketData.customer_type = customerType;
    }

    return ticketData;
}
