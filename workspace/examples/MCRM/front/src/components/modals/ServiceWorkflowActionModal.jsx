import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { executeTicketAction } from '../../api/ticketsAPI';
import { stockAPI } from '../../api/stockAPI';
import { CheckCircle, Package, Loader, Send } from 'lucide-react';
import ItemsSelectionSection from './sections/ItemsSelectionSection';
import CallCenterAmountPanel from '../call-center/CallCenterAmountPanel';
import { ServiceModalWrapper, ServiceModalHeader, TicketInfoCard } from './shared';

/**
 * ServiceWorkflowActionModal - Unified modal for workflow actions
 * Handles: mark_delivered, mark_sent, start_maintenance, complete_maintenance, mark_ready, ready_for_dispatch, start_preparation
 */
const ServiceWorkflowActionModal = ({
    isOpen,
    onClose,
    onSuccess,
    action,
    actionType // 'mark_delivered', 'mark_sent', 'start_maintenance', 'complete_maintenance', 'mark_ready', 'ready_for_dispatch', 'start_preparation'
}) => {
    const [notes, setNotes] = useState('');
    const [costAdjustment, setCostAdjustment] = useState('');
    const [showCostField, setShowCostField] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // For mark_ready action only (moves IN_PROCESS → READY_FOR_DISPATCH)
    const [newTrackingSend, setNewTrackingSend] = useState('');

    // ItemsSelectionSection state - maintenance workflow with send/receive
    const [itemsToSend, setItemsToSend] = useState([]); // Replacement items sent to customer
    const [itemsToReceive, setItemsToReceive] = useState([]); // Items returned to stock

    // Stock items map for fetching item names
    const [stockItemsMap, setStockItemsMap] = useState({});
    const [isLoadingStockItems, setIsLoadingStockItems] = useState(false);

    // For mark_delivered - tabs and failed send state
    const [deliveryTab, setDeliveryTab] = useState('success'); // 'success' or 'failed'
    const [returnedItems, setReturnedItems] = useState([]); // For failed send - items to return to stock
    const [stockItems, setStockItems] = useState([]); // All stock items for search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStockTab, setSelectedStockTab] = useState('all'); // 'all', 'product', 'part'
    const [showSearchSection, setShowSearchSection] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Action configuration
    const actionConfig = {
        mark_delivered: {
            label: 'تأكيد التسليم',
            icon: CheckCircle,
            color: 'green',
            description: 'تأكيد تسليم الطلب للعميل',
            requiresItems: false,
            requiresTracking: false
        },
        confirm_sent: {
            label: 'تأكيد التسليم',
            icon: CheckCircle,
            color: 'green',
            description: 'تأكيد تسليم الطلب للعميل',
            requiresItems: false,
            requiresTracking: false
        },
        mark_sent: {
            label: 'تأكيد الإرسال',
            icon: Send,
            color: 'blue',
            description: 'تأكيد إرسال الطلب للعميل',
            requiresItems: false,
            requiresTracking: false
        },
        start_maintenance: {
            label: 'بدء الصيانة',
            icon: Package,
            color: 'purple',
            description: 'بدء عملية الصيانة للطلب',
            requiresItems: false,
            requiresTracking: false
        },
        complete_maintenance: {
            label: 'إكمال الصيانة',
            icon: CheckCircle,
            color: 'green',
            description: 'إكمال عملية الصيانة مع أو بدون تسجيل القطع المستبدلة',
            requiresItems: false, // Items are now optional
            requiresTracking: false
        },
        mark_ready: {
            label: 'جاهز للإرسال',
            icon: Package,
            color: 'blue',
            description: 'تعيين رقم التتبع ووضع الطلب جاهز للإرسال',
            requiresItems: false,
            requiresTracking: true // new_tracking_send is required
        },
        ready_for_dispatch: {
            label: 'جاهز للشحن',
            icon: Package,
            color: 'blue',
            description: 'الطلب جاهز للشحن للعميل',
            requiresItems: false,
            requiresTracking: false
        },
        start_preparation: {
            label: 'بدء التحضير',
            icon: Loader,
            color: 'orange',
            description: 'بدء تحضير الطلب للشحن',
            requiresItems: false,
            requiresTracking: false
        }
    };

    const config = actionConfig[actionType] || actionConfig.mark_delivered;
    const ActionIcon = config.icon;

    // Helper function to convert color name to Tailwind gradient class
    const getIconColor = (color) => {
        const colorMap = {
            green: 'from-green-500 to-green-600',
            blue: 'from-blue-500 to-blue-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
            red: 'from-red-500 to-red-600'
        };
        return colorMap[color] || 'from-gray-500 to-gray-600';
    };

    // Fetch stock items when modal opens to get item names
    useEffect(() => {
        if (isOpen && action?.items && action.items.length > 0) {
            const fetchStockItems = async () => {
                setIsLoadingStockItems(true);
                try {
                    // Get all unique item IDs from ticket items
                    const itemIds = [...new Set(action.items.map(item => item.item_id || item.id))];

                    // Fetch all stock items (products and parts)
                    const [productsResult, partsResult] = await Promise.all([
                        stockAPI.getStockItems({ type: 'product', limit: 1000 }),
                        stockAPI.getStockItems({ type: 'part', limit: 1000 })
                    ]);

                    // Create a map of item_id to stock item
                    const itemsMap = {};

                    if (productsResult.success && productsResult.data?.items) {
                        productsResult.data.items.forEach(item => {
                            itemsMap[item.id] = item;
                        });
                    }

                    if (partsResult.success && partsResult.data?.items) {
                        partsResult.data.items.forEach(item => {
                            itemsMap[item.id] = item;
                        });
                    }

                    setStockItemsMap(itemsMap);
                } catch (error) {
                    console.error('Error fetching stock items:', error);
                } finally {
                    setIsLoadingStockItems(false);
                }
            };

            fetchStockItems();
        }
    }, [isOpen, action]);

    // Load stock items for failed send search and pre-load sent parts for sell tickets
    useEffect(() => {
        if (isOpen && (actionType === 'mark_delivered' || actionType === 'confirm_sent') && deliveryTab === 'failed') {
            const loadStockItems = async () => {
                try {
                    // For sell tickets (confirm_sent), load both products and parts
                    // (sell orders can contain both product and part items)
                    // For maintenance tickets (mark_delivered), load both products and parts
                    if (actionType === 'confirm_sent') {
                        // Load both products and parts for sell orders
                        const [productsResult, partsResult] = await Promise.all([
                            stockAPI.getStockItems({ type: 'product', limit: 1000 }),
                            stockAPI.getStockItems({ type: 'part', limit: 1000 })
                        ]);

                        const allItems = [];
                        if (productsResult.success && productsResult.data?.items) {
                            allItems.push(...productsResult.data.items.map(item => ({ ...item, type: 'product' })));
                        }
                        if (partsResult.success && partsResult.data?.items) {
                            allItems.push(...partsResult.data.items.map(item => ({ ...item, type: 'part' })));
                        }
                        setStockItems(allItems);
                        
                        // Pre-load sent items (products and parts) into returnedItems for sell tickets
                        // Only pre-load if returnedItems is empty (to avoid overwriting user changes)
                        if (action && action.items && action.items.length > 0 && returnedItems.length === 0) {
                            const sentItems = action.items
                                .filter(item => {
                                    const direction = (item.direction || '').toLowerCase();
                                    return direction === 'send';
                                })
                                .map(item => {
                                    // Find the stock item details from loaded items
                                    const stockItem = allItems.find(si => 
                                        si.id === (item.item_id || item.id) || 
                                        si.item_id === (item.item_id || item.id)
                                    );
                                    // Preserve the actual item type from ticket or stock item, default to 'part' if not found
                                    const itemType = item.type || stockItem?.type || 'part';
                                    return {
                                        item_id: item.item_id || item.id,
                                        id: item.item_id || item.id,
                                        name: stockItem?.name || item.name || `عنصر ${item.item_id || item.id}`,
                                        sku: stockItem?.sku || item.sku || '',
                                        type: itemType, // Preserve actual type (product or part)
                                        quantity: item.quantity || 1,
                                        validQuantity: item.quantity || 1,
                                        damagedQuantity: 0,
                                        stockDetails: stockItem
                                    };
                                });
                            
                            if (sentItems.length > 0) {
                                setReturnedItems(sentItems);
                            }
                        }
                    } else {
                        // For maintenance, load both products and parts
                        const [productsResult, partsResult] = await Promise.all([
                            stockAPI.getStockItems({ type: 'product', limit: 1000 }),
                            stockAPI.getStockItems({ type: 'part', limit: 1000 })
                        ]);

                        const allItems = [];
                        if (productsResult.success && productsResult.data?.items) {
                            allItems.push(...productsResult.data.items.map(item => ({ ...item, type: 'product' })));
                        }
                        if (partsResult.success && partsResult.data?.items) {
                            allItems.push(...partsResult.data.items.map(item => ({ ...item, type: 'part' })));
                        }
                        setStockItems(allItems);
                    }
                } catch (error) {
                    console.error('Error loading stock items:', error);
                }
            };
            loadStockItems();
            // For sell tickets, default to 'all' tab to show both products and parts
            if (actionType === 'confirm_sent') {
                setSelectedStockTab('all');
            }
        } else {
            // Reset returnedItems when switching away from failed tab
            if (deliveryTab !== 'failed' && returnedItems.length > 0) {
                setReturnedItems([]);
            }
        }
    }, [isOpen, actionType, deliveryTab, action]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setNotes('');
            setCostAdjustment('');
            setShowCostField(false);
            setNewTrackingSend('');
            setItemsToSend([]);
            setItemsToReceive([]);
            setStockItemsMap({});
            setDeliveryTab('success');
            setReturnedItems([]);
            setSearchQuery('');
            setSelectedStockTab('all');
            setShowSearchSection(false);
            setShowSearchResults(false);
        }
    }, [isOpen, actionType]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        // Validation - No validation needed for complete_maintenance items (now optional)

        if (actionType === 'mark_ready') {
            // new_tracking_send is required for mark_ready
            if (!newTrackingSend.trim()) {
                toast.error('رقم التتبع الجديد مطلوب');
                return;
            }
        }

            // Validation for mark_delivered and confirm_sent failed send
            if ((actionType === 'mark_delivered' || actionType === 'confirm_sent') && deliveryTab === 'failed') {
            if (returnedItems.length === 0) {
                toast.error('يرجى إضافة عنصر واحد على الأقل للرجوع');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const user_id = localStorage.getItem('user_id') || '1';

            // Build payload according to workflow documentation
            const payload = {
                action: actionType,
                user_id: user_id.toString() // Keep as string per API requirements
            };

            // Add notes if provided (optional for all actions)
            const trimmedNotes = notes.trim();
            if (trimmedNotes) {
                payload.notes = trimmedNotes;
            }

            // Add cost adjustment if provided (optional) - only send if non-zero
            const trimmedCost = costAdjustment.trim();
            if (trimmedCost && parseFloat(trimmedCost) !== 0) {
                payload.cost_adjustment = parseFloat(trimmedCost);
            }

            // Action-specific parameters
            if (actionType === 'complete_maintenance') {
                // Items array is now OPTIONAL for complete_maintenance
                const allItems = [
                    ...itemsToSend.map(item => ({
                        item_id: parseInt(item.id || item.item_id),
                        quantity: parseInt(item.quantity) || 1,
                        direction: 'SEND', // Uppercase as per API docs
                        condition: item.condition || 'valid'
                    })),
                    ...itemsToReceive.map(item => ({
                        item_id: parseInt(item.id || item.item_id),
                        quantity: parseInt(item.quantity) || 1,
                        direction: 'RECEIVE', // Uppercase as per API docs
                        condition: item.condition || 'valid' // Default to valid, user can change
                    }))
                ];
                // Only include items if there are any
                if (allItems.length > 0) {
                    payload.items = allItems;
                }
            }

            if (actionType === 'mark_ready') {
                // new_tracking_send is REQUIRED for mark_ready
                payload.new_tracking_send = newTrackingSend.trim();
            }

            // For mark_delivered and confirm_sent failed send - add item validations
            if ((actionType === 'mark_delivered' || actionType === 'confirm_sent') && deliveryTab === 'failed') {
                const item_validations = [];
                returnedItems.forEach(item => {
                    if (item.validQuantity > 0) {
                        item_validations.push({
                            item_id: parseInt(item.item_id || item.id),
                            quantity: parseInt(item.validQuantity),
                            condition: 'valid'
                        });
                    }
                    if (item.damagedQuantity > 0) {
                        item_validations.push({
                            item_id: parseInt(item.item_id || item.id),
                            quantity: parseInt(item.damagedQuantity),
                            condition: 'damaged'
                        });
                    }
                });
                payload.item_validations = item_validations;
            }

            // start_maintenance only needs action, user_id, and optional notes (already handled above)
            // mark_delivered success only needs action, user_id, optional notes and cost_adjustment (already handled above)

            // Executing action

            const result = await executeTicketAction(action.id, payload);

            if (result) {
                toast.success(`تم ${config.label} بنجاح`);
                onSuccess(result);
                onClose();
            } else {
                toast.error('فشل في تنفيذ الإجراء');
            }
        } catch (error) {
            console.error('Error executing workflow action:', error);
            const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ في تنفيذ الإجراء';
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
    const trackingNumber = action.original_tracking || 'غير محدد';

    // Extract items from ticket/action - read-only display
    const getItemsByDirection = () => {
        if (!action.items || action.items.length === 0) return { send: [], receive: [] };

        return action.items.reduce((acc, item) => {
            const direction = (item.direction || '').toLowerCase();
            if (direction === 'send') {
                acc.send.push(item);
            } else if (direction === 'receive') {
                acc.receive.push(item);
            }
            return acc;
        }, { send: [], receive: [] });
    };

    const { send: ticketItemsToSend, receive: ticketItemsToReceive } = getItemsByDirection();

    // Helper function to get item name from stock
    const getItemName = (item) => {
        const stockItem = stockItemsMap[item.item_id || item.id];
        if (stockItem) {
            return stockItem.name || stockItem.item_name || stockItem.title || `عنصر ${item.item_id || item.id}`;
        }
        return item.name || item.item_name || `عنصر ${item.item_id || item.id}`;
    };

    // Helper function to get item SKU from stock
    const getItemSKU = (item) => {
        const stockItem = stockItemsMap[item.item_id || item.id];
        return stockItem?.sku || item.sku || null;
    };

    // Handlers for failed send returned items
    const handleAddItemFromSearch = (item) => {
        const existingItem = returnedItems.find(i => i.item_id === item.id && i.type === item.type);
        if (existingItem) {
            setReturnedItems(returnedItems.map(i =>
                i.item_id === item.id && i.type === item.type
                    ? { ...i, quantity: i.quantity + 1, validQuantity: i.condition === 'valid' ? i.validQuantity + 1 : i.validQuantity }
                    : i
            ));
        } else {
            setReturnedItems([...returnedItems, {
                item_id: item.id,
                type: item.type,
                name: item.name,
                sku: item.sku,
                quantity: 1,
                condition: 'valid',
                validQuantity: 1,
                damagedQuantity: 0,
                stockDetails: item
            }]);
        }
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const handleItemConditionChange = (index, condition) => {
        setReturnedItems(prev =>
            prev.map((item, i) => {
                if (i === index) {
                    return {
                        ...item,
                        condition,
                        validQuantity: condition === 'valid' ? item.quantity : 0,
                        damagedQuantity: condition === 'damaged' ? item.quantity : 0
                    };
                }
                return item;
            })
        );
    };

    const handleItemQuantitySplit = (index, validQty, damagedQty) => {
        setReturnedItems(prev =>
            prev.map((item, i) => {
                if (i === index) {
                    const total = parseInt(validQty) + parseInt(damagedQty);
                    return {
                        ...item,
                        quantity: total,
                        validQuantity: parseInt(validQty),
                        damagedQuantity: parseInt(damagedQty),
                        condition: damagedQty > 0 ? 'damaged' : 'valid'
                    };
                }
                return item;
            })
        );
    };

    const handleRemoveItem = (index) => {
        setReturnedItems(returnedItems.filter((_, i) => i !== index));
    };

    const getFilteredStockItems = () => {
        let filtered = stockItems;

        if (selectedStockTab !== 'all') {
            filtered = filtered.filter(item => item.type === selectedStockTab);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(query) ||
                item.sku?.toLowerCase().includes(query)
            );
        }

        return filtered.slice(0, 50); // Limit results
    };

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
                    iconColor={getIconColor(config.color)}
                    onClose={handleClose}
                    isSubmitting={isSubmitting}
                />

                    {/* Tabs for mark_delivered and confirm_sent */}
                    {(actionType === 'mark_delivered' || actionType === 'confirm_sent') && (
                        <div className="flex border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setDeliveryTab('success')}
                                className={`flex-1 px-4 py-3 text-sm font-semibold font-cairo transition-colors ${deliveryTab === 'success'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-b-2 border-green-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                إرسال ناجح
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeliveryTab('failed')}
                                className={`flex-1 px-4 py-3 text-sm font-semibold font-cairo transition-colors ${deliveryTab === 'failed'
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-b-2 border-red-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                إرسال فاشل
                            </button>
                        </div>
                    )}
                </div>

                {/* Content - Scrollable Area */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Success Send Tab Content - For mark_delivered and confirm_sent, only show on success tab */}
                    {((actionType !== 'mark_delivered' && actionType !== 'confirm_sent') || ((actionType === 'mark_delivered' || actionType === 'confirm_sent') && deliveryTab === 'success')) && (
                        <>
                            {/* Ticket Info */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo">العميل:</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">{customerName}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 font-cairo">
                                    تتبع: <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{trackingNumber}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Items Display - Read Only for All Actions - Compact View */}
                    {((actionType !== 'mark_delivered' && actionType !== 'confirm_sent') || ((actionType === 'mark_delivered' || actionType === 'confirm_sent') && deliveryTab === 'success')) && (ticketItemsToSend.length > 0 || ticketItemsToReceive.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Items to Send */}
                            {ticketItemsToSend.length > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center space-x-1.5 space-x-reverse mb-2">
                                        <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-100 font-cairo">
                                            العناصر للإرسال ({ticketItemsToSend.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-1.5">
                                        {ticketItemsToSend.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-2 text-xs py-0.5">
                                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 font-cairo truncate">
                                                        {getItemName(item)}
                                                    </span>
                                                    {getItemSKU(item) && (
                                                        <>
                                                            <span className="text-gray-500 dark:text-gray-400 font-cairo flex-shrink-0">•</span>
                                                            <span className="text-gray-600 dark:text-gray-400 font-mono truncate">
                                                                {getItemSKU(item)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-blue-700 dark:text-blue-300 font-cairo whitespace-nowrap">
                                                        الكمية: {item.quantity || 1}
                                                    </span>
                                                    {item.condition && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded font-cairo whitespace-nowrap ${item.condition === 'valid' || item.condition === 'VALID'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                            }`}>
                                                            {item.condition === 'valid' || item.condition === 'VALID' ? 'صالح' : item.condition}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Items to Receive */}
                            {ticketItemsToReceive.length > 0 && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5 border border-green-200 dark:border-green-800">
                                    <div className="flex items-center space-x-1.5 space-x-reverse mb-2">
                                        <Package className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        <h3 className="text-xs font-semibold text-green-900 dark:text-green-100 font-cairo">
                                            العناصر للاستلام ({ticketItemsToReceive.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-1.5">
                                        {ticketItemsToReceive.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-2 text-xs py-0.5">
                                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 font-cairo truncate">
                                                        {getItemName(item)}
                                                    </span>
                                                    {getItemSKU(item) && (
                                                        <>
                                                            <span className="text-gray-500 dark:text-gray-400 font-cairo flex-shrink-0">•</span>
                                                            <span className="text-gray-600 dark:text-gray-400 font-mono truncate">
                                                                {getItemSKU(item)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-green-700 dark:text-green-300 font-cairo whitespace-nowrap">
                                                        الكمية: {item.quantity || 1}
                                                    </span>
                                                    {item.condition && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded font-cairo whitespace-nowrap ${item.condition === 'valid' || item.condition === 'VALID'
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                            : item.condition === 'damaged' || item.condition === 'DAMAGED'
                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                            }`}>
                                                            {item.condition === 'valid' || item.condition === 'VALID' ? 'صالح' :
                                                                item.condition === 'damaged' || item.condition === 'DAMAGED' ? 'تالف' : item.condition}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mark Ready Specific - New Tracking Send (required) */}
                    {actionType === 'mark_ready' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                رقم التتبع الجديد (للشحن) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newTrackingSend}
                                onChange={(e) => setNewTrackingSend(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 text-sm"
                                dir="ltr"
                                placeholder="رقم التتبع..."
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo">
                                سيتم وضع الطلب في حالة جاهز للإرسال بعد تعيين رقم التتبع
                            </p>
                        </div>
                    )}

                    {/* Cost Adjustment */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                تعديل التكلفة
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowCostField(!showCostField)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                {showCostField ? 'إخفاء' : 'إضافة'}
                            </button>
                        </div>
                        {showCostField && (
                            <CallCenterAmountPanel
                                signedAmount={(() => {
                                    const v = parseFloat(String(costAdjustment).replace(/,/g, ''));
                                    return Number.isFinite(v) ? v : 0;
                                })()}
                                flowMode={(() => {
                                    const v = parseFloat(String(costAdjustment).replace(/,/g, ''));
                                    return Number.isFinite(v) && v < 0 ? 'refund' : 'collect';
                                })()}
                                onChange={({ signed }) => setCostAdjustment(String(signed))}
                                amountLabel="تعديل التكلفة"
                                subtitle="تحصيل أو استرداد · كما في جلسة الاتصال"
                            />
                        )}
                    </div>

                    {/* Complete Maintenance Specific - Items Selection (optional) */}
                    {(!(actionType === 'mark_delivered') || deliveryTab === 'success') && actionType === 'complete_maintenance' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                القطع والعناصر (اختياري)
                            </label>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-cairo mb-2">
                                يمكنك إضافة القطع المستبدلة (سحب من المخزن) والعناصر المرجعة (زيادة للمخزن) أو تركها فارغة
                            </p>
                            <ItemsSelectionSection
                                actionType="maintenance"
                                itemsToSend={itemsToSend}
                                itemsToReceive={itemsToReceive}
                                onItemsToSendChange={setItemsToSend}
                                onItemsToReceiveChange={setItemsToReceive}
                                isLoading={false}
                                disabled={isSubmitting}
                                enableAutoRefresh={false}
                                receivePanelTitle="زيادة للمخزن"
                                sendPanelTitle="سحب من المخزن"
                                swapPanels={true}
                            />
                        </div>
                    )}

                    {/* Failed Send Tab Content */}
                    {(actionType === 'mark_delivered' || actionType === 'confirm_sent') && deliveryTab === 'failed' && (
                        <>
                            {/* Ticket Info */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo">العميل:</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">{customerName}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 font-cairo">
                                    تتبع: <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{trackingNumber}</span>
                                </div>
                            </div>

                            {/* Add Items Section */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowSearchSection(!showSearchSection)}
                                    className="flex items-center justify-between w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span className="text-sm font-semibold font-cairo">إضافة عناصر</span>
                                    </div>
                                    <svg className={`w-5 h-5 transform transition-transform ${showSearchSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showSearchSection && (
                                    <div className="mt-3 space-y-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                                البحث في المخزون
                                            </h3>
                                            <div className="flex space-x-1 space-x-reverse">
                                                {/* Show all tabs for both sell tickets (confirm_sent) and maintenance (mark_delivered) */}
                                                {/* Sell orders can contain both products and parts */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStockTab('all');
                                                        setShowSearchResults(false);
                                                    }}
                                                    className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedStockTab === 'all'
                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}
                                                >
                                                    الكل
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStockTab('product');
                                                        setShowSearchResults(true);
                                                    }}
                                                    className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedStockTab === 'product'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}
                                                >
                                                    منتجات
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStockTab('part');
                                                        setShowSearchResults(true);
                                                    }}
                                                    className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedStockTab === 'part'
                                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}
                                                >
                                                    قطع
                                                </button>
                                            </div>
                                        </div>

                                        {/* Search Input */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowSearchResults(true);
                                                }}
                                                onFocus={() => setShowSearchResults(true)}
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder={
                                                    selectedStockTab === 'product' ? 'ابحث عن منتج...' :
                                                        selectedStockTab === 'part' ? 'ابحث عن قطعة...' :
                                                            selectedStockTab === 'all' ? 'ابحث عن منتج أو قطعة...' :
                                                                'اختر نوع العنصر أولاً ثم ابحث...'
                                                }
                                                dir="rtl"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {showSearchResults && (searchQuery.trim() || selectedStockTab !== 'all') && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 overflow-y-auto">
                                                    {getFilteredStockItems().length > 0 ? (
                                                        getFilteredStockItems().map((item) => (
                                                            <button
                                                                key={`${item.type}-${item.id}`}
                                                                type="button"
                                                                className="w-full text-right px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                                                                onClick={() => handleAddItemFromSearch(item)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.type === 'product'
                                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                                            }`}>
                                                                            {item.type === 'product' ? '📦' : '🔧'}
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {item.sku} • <span className={item.type === 'product' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>
                                                                                    {item.type === 'product' ? 'منتج' : 'قطعة'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                                                            {item.quantity_on_hand - item.quantity_reserved} متاح
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                            {searchQuery.trim() ? 'لا توجد نتائج للبحث' :
                                                                selectedStockTab === 'product' ? 'لا توجد منتجات متاحة' :
                                                                    selectedStockTab === 'part' ? 'لا توجد قطع متاحة' :
                                                                        'لا توجد عناصر'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Returned Items List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo flex items-center justify-between">
                                    <span>العناصر المرتجعة ({returnedItems.length})</span>
                                    {returnedItems.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setReturnedItems([])}
                                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            مسح الكل
                                        </button>
                                    )}
                                </h3>

                                {returnedItems.length > 0 ? (
                                    <div className="space-y-2">
                                        {returnedItems.map((item, index) => {
                                            const stockItem = item.stockDetails || item;
                                            const itemTypeLabel = item.type === 'product' ? 'منتج' : 'قطعة';

                                            return (
                                                <div
                                                    key={index}
                                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-3"
                                                >
                                                    {/* Item Info */}
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2 space-x-reverse mb-1">
                                                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                                                                        {stockItem?.name || item.name || 'غير محدد'}
                                                                    </h4>
                                                                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded font-cairo flex-shrink-0">
                                                                        {itemTypeLabel}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                                                                    title="حذف العنصر"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-600 dark:text-gray-400">
                                                                <span className="font-mono">{stockItem?.sku || item.sku || 'N/A'}</span>
                                                                <span>•</span>
                                                                <div className="flex items-center space-x-1 space-x-reverse">
                                                                    <span className="font-cairo">الكمية:</span>
                                                                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newQty = item.quantity + 1;
                                                                                if (item.condition === 'valid') {
                                                                                    handleItemQuantitySplit(index, item.validQuantity + 1, item.damagedQuantity);
                                                                                } else {
                                                                                    handleItemQuantitySplit(index, item.validQuantity, item.damagedQuantity + 1);
                                                                                }
                                                                            }}
                                                                            className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                                        >
                                                                            +
                                                                        </button>
                                                                        <span className="px-2 font-bold text-gray-900 dark:text-gray-100">{item.quantity}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (item.quantity <= 1) return;
                                                                                if (item.condition === 'valid' && item.validQuantity > 0) {
                                                                                    handleItemQuantitySplit(index, item.validQuantity - 1, item.damagedQuantity);
                                                                                } else if (item.condition === 'damaged' && item.damagedQuantity > 0) {
                                                                                    handleItemQuantitySplit(index, item.validQuantity, item.damagedQuantity - 1);
                                                                                }
                                                                            }}
                                                                            className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                                            disabled={item.quantity <= 1}
                                                                        >
                                                                            -
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Condition Selection */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleItemConditionChange(index, 'valid')}
                                                            className={`flex items-center justify-center space-x-2 space-x-reverse py-2 px-3 rounded-lg border-2 transition-all ${item.condition === 'valid'
                                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                                                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-green-400'
                                                                }`}
                                                        >
                                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className={`text-sm font-semibold font-cairo ${item.condition === 'valid'
                                                                ? 'text-green-700 dark:text-green-300'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                سليم ({item.validQuantity})
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleItemConditionChange(index, 'damaged')}
                                                            className={`flex items-center justify-center space-x-2 space-x-reverse py-2 px-3 rounded-lg border-2 transition-all ${item.condition === 'damaged'
                                                                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600'
                                                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-red-400'
                                                                }`}
                                                        >
                                                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className={`text-sm font-semibold font-cairo ${item.condition === 'damaged'
                                                                ? 'text-red-700 dark:text-red-300'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                تالف ({item.damagedQuantity})
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-cairo">لا توجد عناصر مرتجعة</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

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
                            disabled={isSubmitting}
                            className={`px-6 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 ${config.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500' :
                                config.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500' :
                                    config.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500' :
                                        config.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500' :
                                            'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500'
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
                                config.label
                            )}
                        </button>
                    </div>
                    </form>
                </div>
        </ServiceModalWrapper>
    );
};

export default ServiceWorkflowActionModal;

