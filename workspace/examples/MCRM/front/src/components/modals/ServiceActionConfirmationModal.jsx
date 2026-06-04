import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { executeTicketAction } from '../../api/ticketsAPI';
import { stockAPI } from '../../api/stockAPI';
import { searchStockItems } from '../../api/callCenterAPI';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Check, User, ChevronDown, Truck } from 'lucide-react';
import { formatPhoneForLocalDisplay } from '../../utils/core/phone';
import OrderItemsEditor from '../call-center/OrderItemsEditor';
import CallCenterItemsSelection from '../call-center/CallCenterItemsSelection';
import CallCenterAmountPanel from '../call-center/CallCenterAmountPanel';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';
import { getBostaCodValue } from '../../utils/bosta/cod';
import CustomerCard from './ServiceModalViewer/CustomerCard';
import LocationCard from './ServiceModalViewer/LocationCard';
import {
    getTicketActionConfirmationHeaderProps,
    getTicketActionSubmitLabels,
} from '../../utils/service/serviceModalShell';

/** Tracking inputs — aligned with LeaderApprovalModal (LTR digits, RTL bar, compact) */
const TRACKING_SECTION_CLASS =
    'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 p-3 space-y-2.5 shadow-sm';
const TRACKING_INPUT_CLASS =
    'w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg font-cairo text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 text-right';

/**
 * ServiceActionConfirmationModal - Focused modal for service action confirmation (Endpoint 1)
 * Handles all inputs available in POST /api/v1/services/actions/<action_id>/confirm
 */
const ServiceActionConfirmationModal = ({
    isOpen,
    onClose,
    onSuccess,
    action,
    targetStatus = 'confirm' // Default to confirm if not provided
}) => {
    const { userInfo } = useAuth();

    // Form state for all endpoint 1 inputs
    const [formData, setFormData] = useState({
        original_tracking_number: '',
        sender_tracking_number: '',
        receiver_tracking_number: '',
        notes: '',
        cost: '',
        // Customer data (editable from service action)
        customer_name: '',
        customer_phone: '',
        customer_phone_secondary: ''
    });

    // Tracking number sync states
    const [useSameTracking, setUseSameTracking] = useState(false);

    // Pickup address state
    const [pickupAddress, setPickupAddress] = useState({
        governorate: '',
        city: '',
        district: '',
        details: ''
    });

    // Items state
    const [itemsToSend, setItemsToSend] = useState([]);
    const [itemsToReceive, setItemsToReceive] = useState([]);
    
    // For sell tickets: selectedParts and selectedProducts
    const [selectedParts, setSelectedParts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    /** Sell — تحصيل/استرداد (same contract as CallSessionFAB → OrderItemsEditor) */
    const [sellCashFlowMode, setSellCashFlowMode] = useState('collect');

    /** Customer + Location block collapse (same UX as ServiceModalViewer; persist in sessionStorage) */
    const [customerLocationExpanded, setCustomerLocationExpanded] = useState(() => {
        if (typeof sessionStorage === 'undefined') return true;
        const saved = sessionStorage.getItem('service-action-confirmation-customer-location-expanded');
        if (saved === null) return true;
        return saved === 'true';
    });
    const setCustomerLocationExpandedPersisted = (value) => {
        setCustomerLocationExpanded(value);
        try {
            sessionStorage.setItem('service-action-confirmation-customer-location-expanded', String(value));
        } catch {
            // ignore
        }
    };

    // Track previous action ID to prevent unnecessary resets
    const prevActionIdRef = useRef(null);
    const isInitializedRef = useRef(false);

    // Determine service type and customer type for calculations
    const serviceType = action?.service_type || action?.action_type || '';
    const isSell = serviceType === 'sell';
    const customerType = isSell ? (action?.customer_type || 'customer') : 'customer';

    const confirmationHeaderProps = useMemo(
        () => getTicketActionConfirmationHeaderProps({ action, targetStatus }),
        [action, targetStatus]
    );

    const { submitButtonLabel, submitLoadingLabel } = useMemo(
        () => getTicketActionSubmitLabels(targetStatus),
        [targetStatus]
    );

    const confirmBostaCod = useMemo(() => {
        const orders = action?.bosta_orders;
        if (!orders?.length) return null;
        return getBostaCodValue(orders[0]);
    }, [action?.bosta_orders]);

    /** OrderItemsEditor lines — prices match customerType for initial display */
    const sellEditorItems = useMemo(() => {
        if (!isSell) return [];
        const mapLine = (p, defaultType) => {
            const type = (p.type || defaultType) === 'part' ? 'part' : 'product';
            const id = p.id;
            const hasOverride = p.price_customer !== undefined && p.price_customer !== null;
            const base =
                customerType === 'merchant'
                    ? (p.price_merchant_base ?? null)
                    : (p.price_customer_base ?? null);
            const priceForLine = hasOverride
                ? parseFloat(p.price_customer) || 0
                : base !== null && base !== undefined
                  ? Number(base) || 0
                  : 0;
            return {
                _uid: p._uid ?? `sell-${type}-${id}`,
                item_id: id,
                sku: p.sku || '',
                name: p.name || `عنصر ${id}`,
                type,
                order_quantity: p.quantity || 1,
                price_customer: priceForLine,
                price_merchant:
                    p.price_merchant_base != null ? Number(p.price_merchant_base) : undefined,
                price_customer_base: p.price_customer_base,
                price_merchant_base: p.price_merchant_base,
            };
        };
        return [
            ...selectedProducts.map((p) => mapLine(p, 'product')),
            ...selectedParts.map((p) => mapLine(p, 'part')),
        ];
    }, [isSell, selectedProducts, selectedParts, customerType]);

    const handleSellEditorItemsChange = useCallback((items) => {
        const products = [];
        const parts = [];
        const send = [];
        for (const line of items) {
            const id = line.item_id;
            const type = line.type === 'part' ? 'part' : 'product';
            const qty = line.order_quantity ?? 1;
            const row = {
                type,
                id,
                name: line.name,
                sku: line.sku || '',
                quantity: qty,
                condition: line.condition || 'valid',
                price_customer: line.price_customer,
                price_customer_base: line.price_customer_base ?? null,
                price_merchant_base:
                    line.price_merchant_base != null
                        ? line.price_merchant_base
                        : line.price_merchant != null
                          ? line.price_merchant
                          : null,
            };
            send.push({
                ...row,
                direction: 'send',
            });
            if (type === 'part') parts.push(row);
            else products.push(row);
        }
        setSelectedProducts(products);
        setSelectedParts(parts);
        setItemsToSend(send);
    }, []);

    const handleSellEditorCodChange = useCallback(({ flow, signed }) => {
        setSellCashFlowMode(flow);
        setFormData((prev) => ({
            ...prev,
            cost: signed === 0 ? '' : String(signed),
        }));
    }, []);

    const handleRmtAmountPanelChange = useCallback(({ signed }) => {
        setFormData((prev) => ({
            ...prev,
            cost: signed === 0 ? '' : String(signed),
        }));
    }, []);

    const nonSellCallType = useMemo(() => {
        const st = action?.service_type || action?.action_type || '';
        if (st === 'return') return 'return';
        if (st === 'maintenance') return 'maintenance';
        if (st === 'replace' || st === 'replacement') return 'replacement';
        return 'maintenance';
    }, [action?.service_type, action?.action_type]);

    const rmtSignedAmount = useMemo(() => {
        const v = parseFloat(String(formData.cost || '').replace(/,/g, ''));
        return Number.isFinite(v) ? v : 0;
    }, [formData.cost]);

    const rmtFlowMode = useMemo(() => {
        const v = parseFloat(String(formData.cost || '').replace(/,/g, ''));
        return Number.isFinite(v) && v < 0 ? 'refund' : 'collect';
    }, [formData.cost]);

    // Initialize form data when modal opens - Load ALL service action data
    useEffect(() => {
        // Only initialize when modal opens or when action actually changes
        if (isOpen && action) {
            const currentActionId = action.id || action._id;

            // Skip if already initialized for this action
            if (isInitializedRef.current && prevActionIdRef.current === currentActionId) {
                return;
            }

            // Mark as initialized and store action ID
            isInitializedRef.current = true;
            prevActionIdRef.current = currentActionId;

            // Pre-fill form data from API structure (handle both service actions and tickets)
            const initialCostRaw =
                action.cost_adjustment != null && action.cost_adjustment !== ''
                    ? String(action.cost_adjustment)
                    : action.cost != null && action.cost !== ''
                      ? String(action.cost)
                      : '';
            setFormData({
                original_tracking_number: action.original_tracking || action.original_tracking_number || '',
                sender_tracking_number: action.new_tracking_send || '',
                receiver_tracking_number: action.new_tracking_receive || '',
                notes: action.notes || '',
                cost: initialCostRaw,
                customer_name: action.customer_name || '',
                customer_phone: action.phone || '',
                customer_phone_secondary: action.customer_phone_secondary || action.phone_secondary || ''
            });
            const initialCostNum = parseFloat(String(initialCostRaw).replace(/,/g, ''));
            setSellCashFlowMode(
                Number.isFinite(initialCostNum) && initialCostNum < 0 ? 'refund' : 'collect'
            );

            // Set initial sync state based on whether sender and receiver tracking numbers are the same (if both exist)
            const senderTracking = action.new_tracking_send || '';
            const receiverTracking = action.new_tracking_receive || '';
            setUseSameTracking(senderTracking && receiverTracking && senderTracking === receiverTracking);

            // Pre-fill pickup address from service action/ticket data (using working camelCase format)
            setPickupAddress({
                governorate: action.pickup_government || action.pickupGovernment || action.governorate || action.actionData?.pickup_address?.governorate || '',
                city: action.pickup_city || action.pickupCity || action.city || action.actionData?.pickup_address?.city || '',
                district: action.pickup_district || action.pickupDistrict || action.actionData?.pickup_address?.district || '',
                details: action.pickup_details || action.pickupDetails || action.customer_address || action.actionData?.pickup_address?.details || ''
            });

            // Pre-fill items from service action/ticket data with enhanced mapping and multiple fallbacks
            let loadedSendItems = [];
            let loadedReceiveItems = [];

            // Load items from service action/ticket data
            // First try separate arrays (service actions)
            const itemsToSendSource = action.items_to_send || action.itemsToSend || [];
            const itemsToReceiveSource = action.items_to_receive || action.itemsToReceive || action.itemsReceived || [];

            // If separate arrays exist, use them
            if (itemsToSendSource && itemsToSendSource.length > 0) {
                loadedSendItems = itemsToSendSource.map(item => ({
                    type: item.item_type || item.type || 'product',
                    id: item.item_id || item.id,
                    name: item.name || `عنصر ${item.item_id || item.id}`,
                    sku: item.sku || '',
                    quantity: item.quantity_to_send || item.quantity || 1,
                    condition: item.condition || 'valid',
                    category: item.category || '',
                    direction: 'send' // Items for send section
                }));
            }

            if (itemsToReceiveSource && itemsToReceiveSource.length > 0) {
                loadedReceiveItems = itemsToReceiveSource.map(item => ({
                    type: item.item_type || item.type || 'product',
                    id: item.item_id || item.id,
                    name: item.name || `عنصر ${item.item_id || item.id}`,
                    sku: item.sku || '',
                    quantity: item.quantity_received || item.quantity || 1,
                    condition: item.condition_received || item.condition || 'damaged',
                    category: item.category || '',
                    direction: 'receive' // Items for receive section
                }));
            }

            // If no separate arrays, check for single items array with direction fields (tickets)
            // For sell tickets, all items are 'send' direction
            const serviceType = action?.service_type || action?.action_type || '';
            const isSell = serviceType === 'sell';
            
            if (loadedSendItems.length === 0 && loadedReceiveItems.length === 0 && action.items && action.items.length > 0) {
                action.items.forEach(item => {
                    // For sell tickets, all items are send direction (regardless of direction field)
                    const itemDirection = item.direction ? item.direction.toLowerCase() : '';
                    if (isSell || itemDirection === 'send') {
                        loadedSendItems.push({
                            type: item.type || 'product',
                            id: item.item_id || item.id,
                            name: item.name || `عنصر ${item.item_id || item.id}`,
                            sku: item.sku || '',
                            quantity: item.quantity || 1,
                            condition: item.condition || 'valid',
                            category: item.category || '',
                            direction: 'send',
                            // Include price fields for sell tickets
                            price_customer: item.price_customer || undefined,
                            price_customer_base: item.price_customer_base || null,
                            price_merchant_base: item.price_merchant_base || null
                        });
                    } else if (itemDirection === 'receive') {
                        loadedReceiveItems.push({
                            type: item.type || 'product',
                            id: item.item_id || item.id,
                            name: item.name || `عنصر ${item.item_id || item.id}`,
                            sku: item.sku || '',
                            quantity: item.quantity || 1,
                            condition: item.condition || 'damaged',
                            category: item.category || '',
                            direction: 'receive'
                        });
                    }
                });
            }

            // Set items state
            setItemsToSend(loadedSendItems);
            setItemsToReceive(loadedReceiveItems);
            
            // For sell tickets, fetch prices first, then populate selectedParts and selectedProducts
            if (isSell && loadedSendItems.length > 0) {
                const loadItemsWithPrices = async () => {
                    setIsLoadingPrices(true);
                    try {
                        // Fetch stock items to get base prices
                        const [productsResult, partsResult] = await Promise.all([
                            stockAPI.getStockItems({ type: 'product', limit: 1000 }),
                            stockAPI.getStockItems({ type: 'part', limit: 1000 })
                        ]);
                        
                        // Create a map of stock items for quick lookup
                        const stockItemsMap = {};
                        if (productsResult.success && productsResult.data?.items) {
                            productsResult.data.items.forEach(item => {
                                stockItemsMap[item.id] = item;
                            });
                        }
                        if (partsResult.success && partsResult.data?.items) {
                            partsResult.data.items.forEach(item => {
                                stockItemsMap[item.id] = item;
                            });
                        }
                        
                        // Now populate selectedParts and selectedProducts with price data
                        const parts = [];
                        const products = [];
                        
                        loadedSendItems.forEach(item => {
                            const itemId = item.item_id || item.id;
                            const stockItem = stockItemsMap[itemId];
                            
                            const itemData = {
                                type: item.type || 'product',
                                id: itemId,
                                name: item.name || stockItem?.name || `عنصر ${itemId}`,
                                sku: item.sku || stockItem?.sku || '',
                                quantity: item.quantity || 1,
                                condition: item.condition || 'valid',
                                // Use price from action item if available (override), otherwise use stock item base price
                                price_customer: item.price_customer || undefined,
                                price_customer_base: item.price_customer_base || stockItem?.price_customer || null,
                                price_merchant_base: item.price_merchant_base || stockItem?.price_merchant || null
                            };
                            
                            if (item.type === 'part') {
                                parts.push(itemData);
                            } else {
                                products.push(itemData);
                            }
                        });
                        
                        setSelectedParts(parts);
                        setSelectedProducts(products);
                    } catch (error) {
                        console.error('Error loading item prices:', error);
                        toast.error('حدث خطأ أثناء تحميل أسعار العناصر');
                        // Still set items without prices as fallback
                        const parts = [];
                        const products = [];
                        loadedSendItems.forEach(item => {
                            const itemData = {
                                type: item.type || 'product',
                                id: item.id,
                                name: item.name || `عنصر ${item.id}`,
                                sku: item.sku || '',
                                quantity: item.quantity || 1,
                                condition: item.condition || 'valid',
                                price_customer: item.price_customer || undefined,
                                price_customer_base: item.price_customer_base || null,
                                price_merchant_base: item.price_merchant_base || null
                            };
                            if (item.type === 'part') {
                                parts.push(itemData);
                            } else {
                                products.push(itemData);
                            }
                        });
                        setSelectedParts(parts);
                        setSelectedProducts(products);
                    } finally {
                        setIsLoadingPrices(false);
                    }
                };
                
                loadItemsWithPrices();
            } else if (isSell) {
                // No items to load, but still mark as not loading
                setIsLoadingPrices(false);
            }

        } else if (!isOpen) {
            // Reset initialization flag when modal closes
            isInitializedRef.current = false;
            prevActionIdRef.current = null;
            // Reset sell-specific state
            setSelectedParts([]);
            setSelectedProducts([]);
            setIsLoadingPrices(false);
        }
    }, [isOpen, action?.id, action?._id]); // Only runs when modal opens/closes or action actually changes

    // Sync sender and receiver tracking numbers when checkbox is toggled
    useEffect(() => {
        if (useSameTracking && formData.sender_tracking_number?.trim()) {
            setFormData(prev => ({
                ...prev,
                receiver_tracking_number: prev.sender_tracking_number
            }));
        }
    }, [useSameTracking, formData.sender_tracking_number]);

    // Handle form input changes
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Handle pickup address changes
    const handleAddressChange = useCallback((field, value) => {
        setPickupAddress(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Auto-fill function - Enhanced to fill all available service action data
    const handleAutoFill = useCallback(() => {
        if (!action) {
            toast.error('لا توجد بيانات للملء التلقائي');
            return;
        }

        let filledCount = 0;
        const updates = {};
        const addressUpdates = {};

        // Auto-fill customer data if available
        if ((action.customer_full_name || action.customer_name) && !formData.customer_name) {
            updates.customer_name = action.customer_full_name || action.customer_name;
            filledCount++;
        }

        if (action.customer_phone && !formData.customer_phone) {
            updates.customer_phone = action.customer_phone;
            filledCount++;
        }

        if ((action.customer_phone_secondary || action.phone_secondary) && !formData.customer_phone_secondary) {
            updates.customer_phone_secondary = action.customer_phone_secondary || action.phone_secondary;
            filledCount++;
        }

        // Auto-fill tracking numbers if available (all optional)
        if (action.original_tracking || action.original_tracking_number) {
            updates.original_tracking_number = action.original_tracking || action.original_tracking_number;
            filledCount++;
        }

        if (action.new_tracking_send) {
            updates.sender_tracking_number = action.new_tracking_send;
            filledCount++;
        }

        if (action.new_tracking_receive) {
            updates.receiver_tracking_number = action.new_tracking_receive;
            filledCount++;
        }

        // Auto-fill cost if available (check both field names)
        if (action.cost_adjustment && !formData.cost) {
            updates.cost = action.cost_adjustment.toString();
            filledCount++;
        } else if (action.cost && !formData.cost) {
            updates.cost = action.cost.toString();
            filledCount++;
        }

        // Auto-fill notes if available
        if (action.notes && !formData.notes) {
            updates.notes = action.notes;
            filledCount++;
        }

        // Auto-fill pickup address if available (handle both service actions and tickets)
        if ((action.pickup_government || action.governorate) && !pickupAddress.governorate) {
            addressUpdates.governorate = action.pickup_government || action.governorate;
            filledCount++;
        }
        if ((action.pickup_city || action.city) && !pickupAddress.city) {
            addressUpdates.city = action.pickup_city || action.city;
            filledCount++;
        }
        if (action.pickup_district && !pickupAddress.district) {
            addressUpdates.district = action.pickup_district;
            filledCount++;
        }
        if ((action.pickup_details || action.customer_address) && !pickupAddress.details) {
            addressUpdates.details = action.pickup_details || action.customer_address;
            filledCount++;
        }

        // Check action_data for pickup address too
        if (action.action_data?.pickup_address) {
            const pickupData = action.action_data.pickup_address;
            if (pickupData.governorate && !pickupAddress.governorate) {
                addressUpdates.governorate = pickupData.governorate;
                filledCount++;
            }
            if (pickupData.city && !pickupAddress.city) {
                addressUpdates.city = pickupData.city;
                filledCount++;
            }
            if (pickupData.details && !pickupAddress.details) {
                addressUpdates.details = pickupData.details;
                filledCount++;
            }
        }

        // Apply updates
        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
        if (Object.keys(addressUpdates).length > 0) {
            setPickupAddress(prev => ({ ...prev, ...addressUpdates }));
        }

        if (filledCount > 0) {
            toast.success(`تم ملء ${filledCount} حقل تلقائياً`);
        } else {
            toast.info('جميع الحقول مملوءة بالفعل');
        }
    }, [action, formData, pickupAddress]);

    // Form validation - All fields are optional, only validate format if provided
    const validateForm = useCallback(() => {
        // Determine service type for validation
        const serviceType = action?.service_type || action?.action_type || '';
        const isReplace = serviceType === 'replace' || serviceType === 'replacement';
        const isMaintenance = serviceType === 'maintenance';
        const isReturn = serviceType === 'return';

        // For replacement: items to send are required
        if (isReplace && itemsToSend.length === 0) {
            toast.error('يجب تحديد العناصر المراد إرسالها للاستبدال');
            return false;
        }

        // For maintenance: items to receive are required
        if (isMaintenance && itemsToReceive.length === 0) {
            toast.error('يجب تحديد العناصر المراد استلامها للصيانة');
            return false;
        }

        // For return: items to receive are required
        if (isReturn && itemsToReceive.length === 0) {
            toast.error('يجب تحديد العناصر المراد استلامها للإرجاع');
            return false;
        }

        // For replacement: one number applies to send + receive (both fields synced in UI)
        if (isReplace && !formData.sender_tracking_number?.trim()) {
            toast.error('رقم التتبع مطلوب');
            return false;
        }

        // For return: inbound / receive tracking only
        if (isReturn && !formData.receiver_tracking_number?.trim()) {
            toast.error('رقم تتبع الاستقبال (المرتجع) مطلوب');
            return false;
        }

        // For maintenance: separate send and receive tracking (parts travel both ways)
        if (isMaintenance) {
            if (!formData.sender_tracking_number?.trim() || !formData.receiver_tracking_number?.trim()) {
                toast.error('رقم تتبع الإرسال ورقم تتبع الاستقبال مطلوبان للصيانة');
                return false;
            }
            const s = formData.sender_tracking_number.trim();
            const r = formData.receiver_tracking_number.trim();
            if (s.length < 3 || r.length < 3) {
                toast.error('أرقام التتبع يجب أن تكون 3 أحرف على الأقل');
                return false;
            }
        }

        // Validate original tracking format if provided
        if (formData.original_tracking_number?.trim() && formData.original_tracking_number.trim().length < 3) {
            toast.error('رقم التتبع الأصلي يجب أن يكون 3 أحرف على الأقل');
            return false;
        }

        // Validate sender tracking format if provided
        if (formData.sender_tracking_number?.trim() && formData.sender_tracking_number.trim().length < 3) {
            toast.error('رقم تتبع الإرسال يجب أن يكون 3 أحرف على الأقل');
            return false;
        }

        // Validate receiver tracking format if provided (and not synced)
        if (!useSameTracking && formData.receiver_tracking_number?.trim() && formData.receiver_tracking_number.trim().length < 3) {
            toast.error('رقم تتبع الاستقبال يجب أن يكون 3 أحرف على الأقل');
            return false;
        }

        // Validate cost if provided (signed: negative = استرداد)
        if (formData.cost !== '' && formData.cost != null && (isNaN(parseFloat(formData.cost)))) {
            toast.error('التكلفة يجب أن تكون رقماً صالحاً');
            return false;
        }

        // Validate items_to_send structure (match backend validation)
        if (itemsToSend.length > 0) {
            for (let i = 0; i < itemsToSend.length; i++) {
                const item = itemsToSend[i];

                // Check required fields (backend expects: item_type, item_id, quantity)
                if (!item.type) {
                    toast.error(`نوع العنصر مطلوب في العنصر رقم ${i + 1}`);
                    return false;
                }

                if (!item.id) {
                    toast.error(`معرف العنصر مطلوب في العنصر رقم ${i + 1}`);
                    return false;
                }

                if (!item.quantity || item.quantity <= 0) {
                    toast.error(`الكمية يجب أن تكون أكبر من صفر في العنصر رقم ${i + 1}`);
                    return false;
                }

                if (!['product', 'part'].includes(item.type)) {
                    toast.error(`نوع العنصر يجب أن يكون منتج أو قطعة في العنصر رقم ${i + 1}`);
                    return false;
                }
            }
        }

        // Validate items_to_receive structure  
        if (itemsToReceive.length > 0) {
            for (let i = 0; i < itemsToReceive.length; i++) {
                const item = itemsToReceive[i];

                if (!item.type) {
                    toast.error(`نوع العنصر للاستلام مطلوب في العنصر رقم ${i + 1}`);
                    return false;
                }

                if (!item.id) {
                    toast.error(`معرف العنصر للاستلام مطلوب في العنصر رقم ${i + 1}`);
                    return false;
                }

                if (!item.quantity || item.quantity <= 0) {
                    toast.error(`كمية الاستلام يجب أن تكون أكبر من صفر في العنصر رقم ${i + 1}`);
                    return false;
                }

                if (!['product', 'part'].includes(item.type)) {
                    toast.error(`نوع العنصر للاستلام يجب أن يكون منتج أو قطعة في العنصر رقم ${i + 1}`);
                    return false;
                }
            }
        }

        return true;
    }, [formData, itemsToSend, itemsToReceive, useSameTracking, action]);

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Prevent duplicate submissions
        if (isSubmitting) {
            console.log('🚫 Duplicate submission prevented for action:', action.id);
            return;
        }

        // Additional safety check - prevent submission if modal is not properly open
        if (!isOpen || !action) {
            console.log('🚫 Submission prevented - modal not open or no action');
            return;
        }

        console.log('📤 Submitting confirmation for ticket ID:', action.id);
        setIsSubmitting(true);
        try {
            // Prepare payload for tickets API format (all fields optional)
            const payload = {};

            // Add tracking fields only if they have values
            if (formData.original_tracking_number?.trim()) {
                payload.original_tracking = formData.original_tracking_number.trim();
            }

            if (formData.sender_tracking_number?.trim()) {
                payload.new_tracking_send = formData.sender_tracking_number.trim();
            }

            if (formData.receiver_tracking_number?.trim()) {
                payload.new_tracking_receive = formData.receiver_tracking_number.trim();
            }

            // If using same tracking, ensure receiver gets the sender value
            if (useSameTracking && formData.sender_tracking_number?.trim()) {
                payload.new_tracking_receive = formData.sender_tracking_number.trim();
            }

            // Add optional fields only if they have values
            if (formData.customer_name?.trim()) {
                payload.customer_name = formData.customer_name.trim();
            }

            if (formData.customer_phone?.trim()) {
                payload.phone = formData.customer_phone.trim();
            }

            if (formData.customer_phone_secondary?.trim()) {
                payload.phone_secondary = formData.customer_phone_secondary.trim();
            }

            if (formData.notes?.trim()) {
                payload.notes = formData.notes.trim();
            }

            if (formData.cost !== '' && formData.cost != null && !Number.isNaN(parseFloat(formData.cost))) {
                const c = parseFloat(formData.cost);
                if (c !== 0) payload.cost_adjustment = c;
            }

            if (itemsToSend.length > 0 || itemsToReceive.length > 0) {
                // For tickets API, send items as a single array with direction field
                // The backend will handle the direction field appropriately
                const allItems = [
                    ...itemsToSend.map(item => ({
                        item_type: item.type,
                        item_id: item.id,
                        quantity: parseInt(item.quantity) || 1,
                        condition: item.condition || 'valid',
                        direction: item.direction || 'send'
                    })),
                    ...itemsToReceive.map(item => ({
                        item_type: item.type,
                        item_id: item.id,
                        quantity: parseInt(item.quantity) || 1,
                        condition: item.condition || 'damaged',
                        direction: item.direction || 'receive'
                    }))
                ];
                payload.items = allItems;
            }

            // Add pickup address if any field is filled
            const hasPickupData = Object.values(pickupAddress).some(value => value?.trim());
            if (hasPickupData) {
                payload.pickup_address = Object.fromEntries(
                    Object.entries(pickupAddress).filter(([_, value]) => value?.trim())
                );
            }
            console.log('🔄 Executing ticket action:', targetStatus, 'for:', action.id);
            const result = await executeTicketAction(action.id, {
                action: targetStatus,
                user_id: userInfo?.id ?? 1,
                ...payload
            });

            // Check if result contains an error
            if (result && result.error) {
                console.log('❌ Backend returned error in response:', result.error);
                toast.error(result.error);
                return;
            }

            if (result) {
                console.log('✅ Confirmation successful for action:', action.id);
                const actionLabels = {
                    confirm: 'تم تأكيد التذكرة بنجاح',
                    cancel: 'تم إلغاء التذكرة بنجاح',
                    scan_send: 'تم تسجيل الإرسال بنجاح',
                    scan_receive: 'تم تسجيل الاستلام بنجاح'
                };
                toast.success(actionLabels[targetStatus] || `تم تنفيذ ${targetStatus} بنجاح`);
                onSuccess(result);
                onClose();
            } else {
                console.log('❌ Confirmation failed for action:', action.id);
                const actionLabels = {
                    confirm: 'فشل في تأكيد التذكرة',
                    cancel: 'فشل في إلغاء التذكرة',
                    scan_send: 'فشل في تسجيل الإرسال',
                    scan_receive: 'فشل في تسجيل الاستلام'
                };
                toast.error(actionLabels[targetStatus] || `فشل في تنفيذ ${targetStatus}`);
            }
        } catch (error) {
            console.error('❌ Error confirming action:', action.id, error);
            // Extract error message from various possible locations
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                error.message;

            if (errorMessage && errorMessage !== 'Request failed with status code 400' &&
                errorMessage !== 'Request failed with status code 422') {
                toast.error(errorMessage);
            } else {
                const actionLabels = {
                    confirm: 'حدث خطأ في تأكيد التذكرة',
                    cancel: 'حدث خطأ في إلغاء التذكرة',
                    scan_send: 'حدث خطأ في تسجيل الإرسال',
                    scan_receive: 'حدث خطأ في تسجيل الاستلام'
                };
                toast.error(actionLabels[targetStatus] || `حدث خطأ في تنفيذ ${targetStatus}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close handler - only reset when actually closing, not on every render
    const handleClose = () => {
        if (!isSubmitting) {
            // Reset form
            setFormData({
                original_tracking_number: '',
                sender_tracking_number: '',
                receiver_tracking_number: '',
                notes: '',
                cost: '',
                customer_name: '',
                customer_phone: '',
                customer_phone_secondary: ''
            });
            setUseSameTracking(false);
            setPickupAddress({
                governorate: '',
                city: '',
                district: '',
                details: ''
            });
            setItemsToSend([]);
            setItemsToReceive([]);
            setSelectedParts([]);
            setSelectedProducts([]);
            setSellCashFlowMode('collect');
            setIsLoadingPrices(false);
            onClose();
        }
    };

    if (!isOpen || !action) return null;

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-6xl"
            maxHeight="max-h-[92vh]"
            overflow="overflow-hidden"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    {...confirmationHeaderProps}
                    onClose={handleClose}
                    isSubmitting={isSubmitting}
                />
            </div>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 min-h-0"
                dir="rtl"
            >
                {/* Two columns: بيانات الطلب (scroll) | العناصر (scroll) — reduces single tall scroll */}
                <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                    {/* Column 1 — بيانات العميل، التتبع، العنوان، التكلفة */}
                    <div className="flex flex-col flex-1 min-h-0 lg:min-w-0 lg:max-w-[48%] lg:basis-[48%] border-b lg:border-b-0 border-gray-200 dark:border-gray-700">
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4">
                    {/* Customer + location: collapsed summary bar or expanded cards (matches ServiceModalViewer) */}
                    <div className="flex-shrink-0 flex flex-col w-full">
                        {!customerLocationExpanded && (
                            <button
                                type="button"
                                onClick={() => setCustomerLocationExpandedPersisted(true)}
                                dir="rtl"
                                className="flex items-center gap-2 sm:gap-2.5 w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow text-right font-cairo transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 flex-shrink-0"
                                aria-expanded="false"
                                title="عرض بيانات العميل والعنوان"
                            >
                                <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-red-600 text-white shadow-sm" title="العميل">
                                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" aria-hidden />
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 rotate-[-90deg]" aria-hidden />
                                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate min-w-0 flex-1">
                                    {[
                                        formData.customer_name || null,
                                        formData.customer_phone
                                            ? formatPhoneForLocalDisplay(formData.customer_phone)
                                            : null,
                                        pickupAddress.city || pickupAddress.governorate || null
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') || '—'}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-brand-blue-600 dark:text-brand-blue-400 whitespace-nowrap flex-shrink-0">عرض</span>
                            </button>
                        )}
                        {customerLocationExpanded && (
                            <>
                                <div className="flex flex-col gap-1 w-full">
                                    <CustomerCard
                                        ticket={{
                                            customer_name: formData.customer_name,
                                            phone: formData.customer_phone,
                                            sec_phone: formData.customer_phone_secondary
                                        }}
                                        onCopyPhone={(phone) => {
                                            navigator.clipboard.writeText(phone);
                                            toast.success('تم نسخ الرقم');
                                        }}
                                        onSaveCustomer={(data, callback) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                customer_name: data.name !== undefined ? data.name : prev.customer_name,
                                                customer_phone: data.phone !== undefined ? data.phone : prev.customer_phone,
                                                customer_phone_secondary: data.phone_secondary !== undefined ? data.phone_secondary : prev.customer_phone_secondary
                                            }));
                                            if (callback) callback();
                                        }}
                                        onCollapse={() => setCustomerLocationExpandedPersisted(false)}
                                    />
                                </div>

                                <div className="flex flex-col gap-1 w-full">
                                    <LocationCard
                                        ticket={{
                                            governorate: pickupAddress.governorate,
                                            city: pickupAddress.city,
                                            customer_address: pickupAddress.details
                                        }}
                                        onSaveAddress={(data, callback) => {
                                            setPickupAddress(prev => ({
                                                ...prev,
                                                governorate: data.governorate !== undefined ? data.governorate : prev.governorate,
                                                city: data.city !== undefined ? data.city : prev.city,
                                                details: data.address_details !== undefined ? data.address_details : prev.details
                                            }));
                                            if (callback) callback();
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* أرقام التتبع — قسم واحد بنفس أسلوب LeaderApprovalModal */}
                    <div className={TRACKING_SECTION_CLASS}>
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-2 mb-0">
                            <h3 className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                                    <Truck className="w-3 h-3" aria-hidden />
                                </span>
                                <span className="leading-tight">أرقام التتبع (إرسال / استلام)</span>
                            </h3>
                            <button
                                type="button"
                                onClick={handleAutoFill}
                                className="shrink-0 text-[10px] sm:text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-700 font-cairo"
                            >
                                ملء تلقائي للبيانات
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                    الأصلي
                                </label>
                                <input
                                    type="text"
                                    value={formData.original_tracking_number}
                                    onChange={(e) => handleInputChange('original_tracking_number', e.target.value)}
                                    className={TRACKING_INPUT_CLASS}
                                    dir="ltr"
                                    placeholder="رقم التتبع الأصلي"
                                />
                            </div>
                            {(() => {
                                const serviceType = action?.service_type || action?.action_type || '';
                                const isReplace = serviceType === 'replace' || serviceType === 'replacement';
                                const isMaintenance = serviceType === 'maintenance';
                                const isReturn = serviceType === 'return';
                                const isSell = serviceType === 'sell';

                                if (isSell) {
                                    return (
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                رقم تتبع الإرسال
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.sender_tracking_number}
                                                onChange={(e) => handleInputChange('sender_tracking_number', e.target.value)}
                                                className={TRACKING_INPUT_CLASS}
                                                dir="ltr"
                                                placeholder="تتبع الإرسال / التسليم"
                                            />
                                        </div>
                                    );
                                }

                                if (isReplace) {
                                    return (
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                رقم التتبع (للإرسال والاستقبال)
                                                <span className="text-red-500 mr-0.5">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.sender_tracking_number}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    handleInputChange('sender_tracking_number', value);
                                                    handleInputChange('receiver_tracking_number', value);
                                                }}
                                                className={TRACKING_INPUT_CLASS}
                                                dir="ltr"
                                                placeholder="نفس الرقم لطرد الاستبدال"
                                            />
                                        </div>
                                    );
                                }

                                if (isReturn) {
                                    return (
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                رقم تتبع الاستقبال (المرتجع)
                                                <span className="text-red-500 mr-0.5">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.receiver_tracking_number}
                                                onChange={(e) => handleInputChange('receiver_tracking_number', e.target.value)}
                                                className={TRACKING_INPUT_CLASS}
                                                dir="ltr"
                                                placeholder="استقبال المرتجع"
                                            />
                                        </div>
                                    );
                                }

                                if (isMaintenance) {
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                    رقم تتبع الإرسال
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.sender_tracking_number}
                                                    onChange={(e) => handleInputChange('sender_tracking_number', e.target.value)}
                                                    className={TRACKING_INPUT_CLASS}
                                                    dir="ltr"
                                                    placeholder="إرسال للصيانة"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                    رقم تتبع الاستقبال
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.receiver_tracking_number}
                                                    onChange={(e) => handleInputChange('receiver_tracking_number', e.target.value)}
                                                    className={TRACKING_INPUT_CLASS}
                                                    dir="ltr"
                                                    placeholder="استلام بعد الصيانة"
                                                />
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/20 px-2 py-1.5">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                أرقام التتبع الجديدة
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="sameTracking"
                                                    checked={useSameTracking}
                                                    onChange={(e) => setUseSameTracking(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-red-500 dark:focus:ring-brand-red-500 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <label htmlFor="sameTracking" className="text-[11px] text-gray-600 dark:text-gray-400 font-cairo cursor-pointer">
                                                    نفس الرقم للإرسال والاستقبال
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                    رقم تتبع الإرسال
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.sender_tracking_number}
                                                    onChange={(e) => handleInputChange('sender_tracking_number', e.target.value)}
                                                    className={TRACKING_INPUT_CLASS}
                                                    dir="ltr"
                                                    placeholder="إرسال"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                    رقم تتبع الاستقبال
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.receiver_tracking_number}
                                                    onChange={(e) => handleInputChange('receiver_tracking_number', e.target.value)}
                                                    disabled={useSameTracking}
                                                    className={`${TRACKING_INPUT_CLASS} ${useSameTracking ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    dir="ltr"
                                                    placeholder="استقبال"
                                                />
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    </div>
                    </div>

                    <div className="flex flex-col flex-1 min-h-0 lg:min-w-0 lg:max-w-[52%] lg:basis-[52%] lg:border-r lg:border-gray-200 dark:lg:border-gray-700">
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4">
                    {/* Items Selection */}
                    <div>
                        {(() => {
                            const serviceType = action?.service_type || action?.action_type || '';
                            const isReplace = serviceType === 'replace' || serviceType === 'replacement';
                            const isMaintenance = serviceType === 'maintenance';
                            const isReturn = serviceType === 'return';
                            const isSell = serviceType === 'sell';

                            let title = 'العناصر';
                            if (isReplace) {
                                title = 'عناصر الاستبدال';
                            } else if (isMaintenance) {
                                title = 'عناصر الصيانة';
                            } else if (isReturn) {
                                title = 'عناصر الإرجاع';
                            } else if (isSell) {
                                title = 'عناصر المبيعات';
                            }

                            return (
                                <>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-cairo">
                                        {title}
                                        {(isReplace || isMaintenance || isReturn) && (
                                            <span className="text-red-500 mr-1">*</span>
                                        )}
                                    </h3>
                                    {(isReplace || isMaintenance || isReturn) && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-cairo">
                                            {isReplace && 'يجب تحديد العناصر المراد إرسالها للاستبدال'}
                                            {isMaintenance && 'يجب تحديد العناصر المراد استلامها للصيانة'}
                                            {isReturn && 'يجب تحديد العناصر المراد استلامها للإرجاع'}
                                        </p>
                                    )}
                                </>
                            );
                        })()}

                        {/* Bosta Package Description Hint */}
                        {action?.bosta_orders && action.bosta_orders.length > 0 && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                <div className="flex items-start space-x-3 space-x-reverse">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                        <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 font-cairo mb-2">
                                            وصف الطرد من بوسطا
                                        </h4>
                                        {action.bosta_orders.map((order, index) => (
                                            <div key={index} className="space-y-2">
                                                {order.package?.description && (
                                                    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-blue-100 dark:border-blue-800">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-cairo leading-relaxed">
                                                            {order.package.description}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-cairo">
                                                                رقم التتبع: {order.trackingNumber}
                                                            </span>
                                                            <span className="font-cairo">
                                                                نوع الطرد: {order.package.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                            {isSell ? (
                                <OrderItemsEditor
                                    key={String(action?.id ?? action?._id ?? 'confirm-sell')}
                                    items={sellEditorItems}
                                    onItemsChange={handleSellEditorItemsChange}
                                    onUserCodChange={handleSellEditorCodChange}
                                    onStockSearch={searchStockItems}
                                    defaultViewMode="items"
                                    notes=""
                                    initialTotal={rmtSignedAmount}
                                    cashFlowMode={sellCashFlowMode}
                                    onCashFlowModeChange={setSellCashFlowMode}
                                    bostaCod={confirmBostaCod}
                                    amountPanelDisabled={isSubmitting || isLoadingPrices}
                                />
                            ) : (
                                <>
                                    <CallCenterItemsSelection
                                        callType={nonSellCallType}
                                        itemsToSend={itemsToSend}
                                        itemsToReceive={itemsToReceive}
                                        onItemsToSendChange={setItemsToSend}
                                        onItemsToReceiveChange={setItemsToReceive}
                                        onStockSearch={searchStockItems}
                                        disabled={isSubmitting}
                                    />
                                    <CallCenterAmountPanel
                                        className="mt-2 sm:mt-2.5"
                                        neutralFlowUntilPick={false}
                                        signedAmount={rmtSignedAmount}
                                        flowMode={rmtFlowMode}
                                        onChange={handleRmtAmountPanelChange}
                                        bostaCod={confirmBostaCod}
                                        disabled={isSubmitting}
                                    />
                                </>
                            )}
                        </div>

                        {/* Validation warning messages */}
                        {(() => {
                            const serviceType = action?.service_type || action?.action_type || '';
                            const isReplace = serviceType === 'replace' || serviceType === 'replacement';
                            const isMaintenance = serviceType === 'maintenance';
                            const isReturn = serviceType === 'return';

                            if (isReplace && itemsToSend.length === 0) {
                                return (
                                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                        <p className="text-sm text-red-700 dark:text-red-300 font-cairo">
                                            ⚠️ يجب تحديد عنصر واحد على الأقل للإرسال للاستبدال
                                        </p>
                                    </div>
                                );
                            }

                            if (isMaintenance && itemsToReceive.length === 0) {
                                return (
                                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                        <p className="text-sm text-red-700 dark:text-red-300 font-cairo">
                                            ⚠️ يجب تحديد عنصر واحد على الأقل للاستلام للصيانة
                                        </p>
                                    </div>
                                );
                            }

                            if (isReturn && itemsToReceive.length === 0) {
                                return (
                                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                        <p className="text-sm text-red-700 dark:text-red-300 font-cairo">
                                            ⚠️ يجب تحديد عنصر واحد على الأقل للاستلام للإرجاع
                                        </p>
                                    </div>
                                );
                            }

                            return null;
                        })()}
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 p-3 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">
                            ملاحظات
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 dark:bg-gray-700 dark:text-white"
                            dir="rtl"
                            placeholder="أضف ملاحظات إضافية..."
                        />
                    </div>

                        </div>
                    </div>
                </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end flex-shrink-0 px-4 py-3 sm:px-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/30 gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-cairo"
                        >
                            إلغاء
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-cairo flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {submitLoadingLabel}
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    {submitButtonLabel}
                                </>
                            )}
                        </button>
                    </div>
                </form>
        </ServiceModalWrapper>
    );
};

ServiceActionConfirmationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    action: PropTypes.object,
    targetStatus: PropTypes.string
};

export default ServiceActionConfirmationModal;