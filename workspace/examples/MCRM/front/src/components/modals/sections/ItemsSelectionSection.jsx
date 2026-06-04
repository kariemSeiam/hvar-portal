import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { Plus, Minus, X, Search, ArrowRightLeft, RotateCcw, Package, Wrench, CheckCircle, Info, AlertTriangle, CheckSquare, Square, Truck, RefreshCw, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { stockAPI } from '../../../api/stockAPI';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ServiceLineItemCard from '../../call-center/ServiceLineItemCard';

/**
 * Enhanced Items Selection Section for Service Actions - Team-Friendly UX
 * Specialized components for each service action type with intuitive workflows
 */
const ItemsSelectionSection = ({
    action,
    actionType,
    selectedProducts = [],
    selectedParts = [],
    itemsToSend = [],
    itemsToReceive = [],
    onProductsChange,
    onPartsChange,
    onItemsToSendChange,
    onItemsToReceiveChange,
    onSuccess,
    isLoading = false,
    disabled = false,
    showReceiveSection = true,
    enableAutoRefresh = false,
    refreshInterval = 30000, // 30 seconds default
    receivePanelTitle = null, // Custom title for receive panel (e.g., "سحب من المخزن")
    sendPanelTitle = null, // Custom title for send panel (e.g., "زيادة للمخزن")
    swapPanels = false, // When true, swaps itemsToSend and itemsToReceive in the panels
    customerType = 'customer', // For sell tickets: 'customer' or 'merchant'
    /** When set (e.g. sell confirmation modal), replaces the green "الإجمالي" strip under selected lines */
    sellCostSummarySlot = null
}) => {

    // Internal state for loading products and parts
    const [products, setProducts] = useState([]);
    const [parts, setParts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingParts, setIsLoadingParts] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'parts', 'send', 'receive'
    const [stockAvailability, setStockAvailability] = useState({});
    /** Qty typing while focused (OrderItemsEditor-style) — sell + service rows */
    const [lineQtyDraft, setLineQtyDraft] = useState({});

    const pruneLineQtyDraftByPrefix = useCallback((prefix) => {
        setLineQtyDraft((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((k) => {
                if (k.startsWith(prefix)) delete next[k];
            });
            return next;
        });
    }, []);
    const [isExpanded, setIsExpanded] = useState(() => {
        // Load expanded state from localStorage or default to false
        const saved = localStorage.getItem('items-selection-expanded');
        return saved === 'true';
    }); // Expand/collapse state for items list

    // Enhanced setIsExpanded that also saves to localStorage
    const handleToggleExpanded = useCallback((expanded) => {
        setIsExpanded(expanded);
        localStorage.setItem('items-selection-expanded', expanded.toString());
    }, []);
    const [replacementSearchMode, setReplacementSearchMode] = useState('products'); // 'products', 'parts' for replacement search

    // Load products and parts using the stock API (consistent with stock.md documentation)
    const loadProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        try {
            console.log('🔄 Loading products...');
            const result = await stockAPI.getStockItems({
                type: 'product',
                limit: 100
            });

            console.log('📦 Products API result:', result);

            if (result.success) {
                const items = result.data.items || [];
                console.log('✅ Loaded products:', items.length);
                setProducts(items);
                setLastRefresh(Date.now());
            } else {
                console.error('❌ Failed to load products:', result.message);
                toast.error('فشل في تحميل المنتجات');
            }
        } catch (error) {
            console.error('❌ Error loading products:', error);
            toast.error('حدث خطأ أثناء تحميل المنتجات');
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const loadParts = useCallback(async () => {
        setIsLoadingParts(true);
        try {
            console.log('🔄 Loading parts...');
            const result = await stockAPI.getStockItems({
                type: 'part',
                limit: 100
            });

            console.log('🔧 Parts API result:', result);

            if (result.success) {
                const items = result.data.items || [];
                console.log('✅ Loaded parts:', items.length);
                setParts(items);
                setLastRefresh(Date.now());
            } else {
                console.error('❌ Failed to load parts:', result.message);
                toast.error('فشل في تحميل القطع');
            }
        } catch (error) {
            console.error('❌ Error loading parts:', error);
            toast.error('حدث خطأ أثناء تحميل القطع');
        } finally {
            setIsLoadingParts(false);
        }
    }, []);

    const loadProductsAndParts = useCallback(async () => {
        console.log('🔄 Loading products and parts...');
        await Promise.all([loadProducts(), loadParts()]);
        console.log('✅ Finished loading products and parts');
    }, [loadProducts, loadParts]);

    // Load data on mount and when action type changes
    useEffect(() => {
        console.log('🔄 ItemsSelectionSection useEffect triggered, actionType:', actionType);
        // Handle both service action types and ticket service types
        const validActionTypes = ['replacement', 'maintenance', 'return', 'sell'];
        if (validActionTypes.includes(actionType)) {
            console.log('✅ Valid actionType detected, loading products and parts');
            loadProductsAndParts();
        } else {
            console.log('⚠️ Invalid actionType:', actionType, '- loading anyway for debugging');
            // Load anyway for debugging purposes
            loadProductsAndParts();
        }
    }, [actionType, loadProductsAndParts]);

    // Also load data when component mounts (for initial load)
    useEffect(() => {
        console.log('🔄 ItemsSelectionSection mounted, actionType:', actionType);
        console.log('📦 Current products count:', products.length);
        console.log('🔧 Current parts count:', parts.length);
        // Always load data when component mounts for debugging
        console.log('✅ Loading products and parts on mount');
        loadProductsAndParts();
    }, []); // Only run on mount

    // Auto-refresh functionality
    useEffect(() => {
        if (!enableAutoRefresh) return;

        const interval = setInterval(() => {
            loadProductsAndParts();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [enableAutoRefresh, refreshInterval, loadProductsAndParts]);

    // Helper functions for action type detection
    const isReplacementAction = actionType === 'replacement';
    const isReturnAction = actionType === 'return';
    const isMaintenanceAction = actionType === 'maintenance';
    const isSellAction = actionType === 'sell';

    // Convert itemsToSend to selectedParts/selectedProducts for sell tickets
    useEffect(() => {
        if (isSellAction && itemsToSend && itemsToSend.length > 0) {
            // Only convert if selectedParts and selectedProducts are empty (to avoid overwriting user selections)
            if (selectedParts.length === 0 && selectedProducts.length === 0) {
                const convertItems = async () => {
                    const parts = [];
                    const products = [];
                    
                    // Fetch stock items to get base prices
                    const [productsResult, partsResult] = await Promise.all([
                        stockAPI.getStockItems({ type: 'product', limit: 1000 }),
                        stockAPI.getStockItems({ type: 'part', limit: 1000 })
                    ]);
                    
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
                    
                    itemsToSend.forEach(item => {
                        const itemId = item.item_id || item.id;
                        const stockItem = stockItemsMap[itemId];
                        
                        const itemData = {
                            type: item.type || 'product',
                            id: itemId,
                            name: item.name || stockItem?.name || `عنصر ${itemId}`,
                            sku: item.sku || stockItem?.sku || '',
                            quantity: item.quantity || 1,
                            condition: item.condition || 'valid',
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
                    
                    if (parts.length > 0) {
                        onPartsChange(parts);
                    }
                    if (products.length > 0) {
                        onProductsChange(products);
                    }
                };
                
                convertItems();
            }
        }
    }, [isSellAction, itemsToSend, selectedParts.length, selectedProducts.length, onPartsChange, onProductsChange]);

    // Enhanced handlers with compact design
    const handleAddItem = useCallback((item, type, targetMode = 'send') => {
        // For return actions, only use itemsToReceive (return items)
        const isReturnAction = actionType === 'return';
        const isMaintenanceAction = actionType === 'maintenance';

        if (isReturnAction) {
            // Return action logic (unchanged)
            const currentItems = itemsToReceive;
            const setCurrentItems = onItemsToReceiveChange;
            const itemExists = currentItems.find(i => i.type === type && i.id === item.id);

            if (itemExists) {
                setCurrentItems(currentItems.map(i =>
                    i.type === type && i.id === item.id
                        ? { ...i, quantity: (i.quantity || 1) + 1 }
                        : i
                ));
            } else {
                const newItem = {
                    type,
                    id: item.id,
                    name: item.name, // Both products and parts use 'name' field
                    sku: item.sku,   // Both products and parts use 'sku' field
                    quantity: 1,
                    condition: 'damaged',
                    direction: 'receive' // Items for receive section
                };
                setCurrentItems([...currentItems, newItem]);
            }
        } else if (isMaintenanceAction) {
            // Maintenance action logic - Receive first (damaged), then send back (fixed/valid)
            if (targetMode === 'receive') {
                // Add to receive items (items coming from client for maintenance)
                const itemExists = itemsToReceive.find(i => i.type === type && i.id === item.id);

                if (itemExists) {
                    onItemsToReceiveChange(itemsToReceive.map(i =>
                        i.type === type && i.id === item.id
                            ? { ...i, quantity: (i.quantity || 1) + 1 }
                            : i
                    ));
                } else {
                    const newItem = {
                        type,
                        id: item.id,
                        name: item.name, // Both products and parts use 'name' field
                        sku: item.sku,   // Both products and parts use 'sku' field
                        quantity: 1,
                        condition: 'damaged', // Default to damaged for items coming in for maintenance
                        direction: 'receive' // Items for receive section
                    };
                    onItemsToReceiveChange([...itemsToReceive, newItem]);
                }
            } else if (targetMode === 'send') {
                // Add to send items (items going back to client after maintenance)
                const itemExists = itemsToSend.find(i => i.type === type && i.id === item.id);

                if (itemExists) {
                    onItemsToSendChange(itemsToSend.map(i =>
                        i.type === type && i.id === item.id
                            ? { ...i, quantity: (i.quantity || 1) + 1 }
                            : i
                    ));
                } else {
                    const newItem = {
                        type,
                        id: item.id,
                        name: item.name, // Both products and parts use 'name' field
                        sku: item.sku,   // Both products and parts use 'sku' field
                        quantity: 1,
                        condition: 'valid', // Default to valid for items going back after fixing
                        direction: 'send' // Items for send section
                    };
                    onItemsToSendChange([...itemsToSend, newItem]);
                }
            }
        } else if (isReplacementAction) {
            // Replacement action logic with auto-selection
            if (targetMode === 'send') {
                // Add to send items
                const itemExists = itemsToSend.find(i => i.type === type && i.id === item.id);

                if (itemExists) {
                    onItemsToSendChange(itemsToSend.map(i =>
                        i.type === type && i.id === item.id
                            ? { ...i, quantity: (i.quantity || 1) + 1 }
                            : i
                    ));
                } else {
                    const newItem = {
                        type,
                        id: item.id,
                        name: item.name, // Both products and parts use 'name' field
                        sku: item.sku,   // Both products and parts use 'sku' field
                        quantity: 1,
                        condition: 'valid',
                        direction: 'send' // Items for send section
                    };
                    onItemsToSendChange([...itemsToSend, newItem]);
                }

                // Auto-add to receive items (damaged condition)
                const receiveItemExists = itemsToReceive.find(i => i.type === type && i.id === item.id);
                if (!receiveItemExists) {
                    const receiveItem = {
                        type,
                        id: item.id,
                        name: item.name, // Both products and parts use 'name' field
                        sku: item.sku,   // Both products and parts use 'sku' field
                        quantity: 1,
                        condition: 'damaged',
                        direction: 'receive' // Items for receive section
                    };
                    onItemsToReceiveChange([...itemsToReceive, receiveItem]);
                }
            } else if (targetMode === 'receive') {
                // Add to receive items only - default to damaged but allow manual state changes
                const itemExists = itemsToReceive.find(i => i.type === type && i.id === item.id);

                if (itemExists) {
                    onItemsToReceiveChange(itemsToReceive.map(i =>
                        i.type === type && i.id === item.id
                            ? { ...i, quantity: (i.quantity || 1) + 1 }
                            : i
                    ));
                } else {
                    const newItem = {
                        type,
                        id: item.id,
                        name: item.name, // Both products and parts use 'name' field
                        sku: item.sku,   // Both products and parts use 'sku' field
                        quantity: 1,
                        condition: 'damaged', // Default to damaged for receive items
                        direction: 'receive' // Items for receive section
                    };
                    onItemsToReceiveChange([...itemsToReceive, newItem]);
                }
            }
        } else if (isSellAction) {
            // Sell action logic - use selectedParts/selectedProducts
            if (type === 'part') {
                const itemExists = selectedParts.find(i => i.id === item.id);
                if (itemExists) {
                    onPartsChange(selectedParts.map(i =>
                        i.id === item.id
                            ? { ...i, quantity: (i.quantity || 1) + 1 }
                            : i
                    ));
                } else {
                    // Get base prices from item (from stock_items)
                    const priceCustomerBase = item.price_customer || null;
                    const priceMerchantBase = item.price_merchant || null;
                    
                    const newItem = {
                        type,
                        id: item.id,
                        name: item.name,
                        sku: item.sku,
                        quantity: 1,
                        condition: 'valid',
                        price_customer: undefined, // Not set initially - will use base price for display
                        price_customer_base: priceCustomerBase,
                        price_merchant_base: priceMerchantBase
                    };
                    onPartsChange([...selectedParts, newItem]);
                }
            } else if (type === 'product') {
                const itemExists = selectedProducts.find(i => i.id === item.id);
                if (itemExists) {
                    onProductsChange(selectedProducts.map(i =>
                        i.id === item.id
                            ? { ...i, quantity: (i.quantity || 1) + 1 }
                            : i
                    ));
                } else {
                    // Get base prices from item (from stock_items)
                    const priceCustomerBase = item.price_customer || null;
                    const priceMerchantBase = item.price_merchant || null;
                    
                    const newItem = {
                        type,
                        id: item.id,
                        name: item.name,
                        sku: item.sku,
                        quantity: 1,
                        condition: 'valid',
                        price_customer: undefined, // Not set initially - will use base price for display
                        price_customer_base: priceCustomerBase,
                        price_merchant_base: priceMerchantBase
                    };
                    onProductsChange([...selectedProducts, newItem]);
                }
            }
        } else {
            // Default action logic (maintenance, etc.)
            const itemExists = itemsToSend.find(i => i.type === type && i.id === item.id);

            if (itemExists) {
                onItemsToSendChange(itemsToSend.map(i =>
                    i.type === type && i.id === item.id
                        ? { ...i, quantity: (i.quantity || 1) + 1 }
                        : i
                ));
            } else {
                const newItem = {
                    type,
                    id: item.id,
                    name: item.name, // Both products and parts use 'name' field
                    sku: item.sku,   // Both products and parts use 'sku' field
                    quantity: 1,
                    condition: 'valid',
                    direction: 'send' // Items for send section
                };
                onItemsToSendChange([...itemsToSend, newItem]);
            }
        }
        setSearchQuery('');
    }, [itemsToReceive, onItemsToReceiveChange, itemsToSend, onItemsToSendChange, actionType, isReplacementAction, isSellAction, selectedParts, selectedProducts, onPartsChange, onProductsChange, customerType]);

    const handleQuantityChange = useCallback((itemId, type, quantity, targetMode = 'send') => {
        // For return actions, only use itemsToReceive
        const isReturnAction = actionType === 'return';
        const isMaintenanceAction = actionType === 'maintenance';

        if (isReturnAction) {
            // Return action - always receive
            onItemsToReceiveChange(itemsToReceive.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) }
                    : item
            ));
        } else if (isMaintenanceAction || isReplacementAction) {
            // Maintenance or replacement - need targetMode to determine which list to update
            if (targetMode === 'receive') {
                onItemsToReceiveChange(itemsToReceive.map(item =>
                    item.id === itemId && item.type === type
                        ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) }
                        : item
                ));
            } else {
                onItemsToSendChange(itemsToSend.map(item =>
                    item.id === itemId && item.type === type
                        ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) }
                        : item
                ));
            }
        } else {
            // Default - send only
            onItemsToSendChange(itemsToSend.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) }
                    : item
            ));
        }
    }, [itemsToReceive, onItemsToReceiveChange, itemsToSend, onItemsToSendChange, actionType, isReplacementAction]);

    const handleRemoveItem = useCallback((itemId, type, targetMode = 'send') => {
        // For return actions, only use itemsToReceive
        const isReturnAction = actionType === 'return';
        const isMaintenanceAction = actionType === 'maintenance';

        if (isReturnAction) {
            // Return action logic (unchanged)
            const currentItems = itemsToReceive;
            const setCurrentItems = onItemsToReceiveChange;
            setCurrentItems(currentItems.filter(item =>
                !(item.id === itemId && item.type === type)
            ));
        } else if (isReplacementAction || isMaintenanceAction) {
            // Replacement or maintenance action logic - remove from specific target only
            if (targetMode === 'send') {
                onItemsToSendChange(itemsToSend.filter(item =>
                    !(item.id === itemId && item.type === type)
                ));
            } else if (targetMode === 'receive') {
                onItemsToReceiveChange(itemsToReceive.filter(item =>
                    !(item.id === itemId && item.type === type)
                ));
            }
        } else {
            // Default action logic
            onItemsToSendChange(itemsToSend.filter(item =>
                !(item.id === itemId && item.type === type)
            ));
        }
    }, [itemsToReceive, onItemsToReceiveChange, itemsToSend, onItemsToSendChange, actionType, isReplacementAction]);

    const handleConditionChange = useCallback((itemId, type, condition, targetMode = 'send') => {
        // For return actions, only use itemsToReceive
        const isReturnAction = actionType === 'return';
        const isMaintenanceAction = actionType === 'maintenance';

        if (isReturnAction) {
            // Return action logic (unchanged)
            const currentItems = itemsToReceive;
            const setCurrentItems = onItemsToReceiveChange;
            setCurrentItems(currentItems.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, condition }
                    : item
            ));
        } else if (isReplacementAction || isMaintenanceAction) {
            // Replacement or maintenance action logic - change condition in specific target only
            if (targetMode === 'send') {
                onItemsToSendChange(itemsToSend.map(item =>
                    item.id === itemId && item.type === type
                        ? { ...item, condition }
                        : item
                ));
            } else if (targetMode === 'receive') {
                onItemsToReceiveChange(itemsToReceive.map(item =>
                    item.id === itemId && item.type === type
                        ? { ...item, condition }
                        : item
                ));
            }
        } else {
            // Default action logic
            onItemsToSendChange(itemsToSend.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, condition }
                    : item
            ));
        }
    }, [itemsToReceive, onItemsToReceiveChange, itemsToSend, onItemsToSendChange, actionType, isReplacementAction]);

    // Filter search results based on active tab and search query
    const filteredResults = useCallback(() => {
        let itemsToSearch = [];

        // Determine which tab to use based on action type
        const currentTab = isReplacementAction ? replacementSearchMode : activeTab;


        if (currentTab === 'products') {
            itemsToSearch = products.map(p => ({
                ...p,
                type: 'product',
                displayName: p.name,
                sku: p.sku
            }));
        } else if (currentTab === 'parts') {
            itemsToSearch = parts.map(p => ({
                ...p,
                type: 'part',
                displayName: p.name, // Parts also use 'name' field like products
                sku: p.sku          // Parts also use 'sku' field like products
            }));
        }

        if (!searchQuery.trim()) {
            return itemsToSearch; // Show all items if no search
        }

        return itemsToSearch.filter(item => {
            return item.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [products, parts, searchQuery, activeTab, replacementSearchMode, isReplacementAction, isMaintenanceAction]);

    // Check if item is in exchange cycle
    const isExchangeItem = useCallback((item) => {
        return item.condition === 'damaged' || item.condition === 'valid';
    }, []);

    // Get item icon based on type and condition
    const getItemIcon = useCallback((item) => {
        if (item.type === 'product') {
            return <Package className="w-4 h-4" />;
        }
        return <Wrench className="w-4 h-4" />;
    }, []);

    const getConditionIcon = useCallback((condition) => {
        switch (condition) {
            case 'damaged':
                return <RotateCcw className="w-3 h-3 text-red-500" />;
            case 'valid':
                return <CheckCircle className="w-3 h-3 text-green-500" />;
            default:
                return <CheckCircle className="w-3 h-3 text-gray-400" />;
        }
    }, []);


    // Check if this is a replacement action that supports exchanges
    const supportsExchange = actionType === 'replacement';

    // Specialized interface renderers for different action types
    const renderMaintenanceInterface = () => (
        <div className="space-y-4">
            {/* Loading indicator for maintenance interface */}
            {(isLoadingProducts || isLoadingParts) && (
                <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <LoadingSpinner size="md" />
                    <span className="mr-2 text-sm text-blue-700 dark:text-blue-300 font-cairo">
                        جاري تحميل البيانات...
                    </span>
                </div>
            )}

            {/* Integrated Search with Tabs */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                {/* Compact Tab Pills */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-1 space-x-reverse">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('products');
                            }}
                            className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${activeTab === 'products'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <Package className="w-3 h-3" />
                                <span>المنتجات</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('parts');
                            }}
                            className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${activeTab === 'parts'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <Wrench className="w-3 h-3" />
                                <span>القطع</span>
                            </div>
                        </button>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo">
                        {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                    </span>
                </div>

                {/* Search Input */}
                <div className="relative p-3">
                    <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`ابحث في ${activeTab === 'products' ? 'المنتجات' : 'القطع'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:text-white transition-all"
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Items List - Always visible, filtered by search */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
                {/* Expand/Collapse Header */}
                <button
                    type="button"
                    onClick={() => handleToggleExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                            {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({filteredResults().length})
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {/* Items Container with Dynamic Height */}
                <div
                    className={`overflow-y-auto scrollbar-hide p-2 transition-all duration-300 ${isExpanded ? 'max-h-[24rem]' : 'max-h-52'
                        }`}
                >
                    {filteredResults().length > 0 ? (
                        <div className="space-y-1">
                            {filteredResults().map((item) => {
                                const isSelectedForReceive = itemsToReceive.some(selected => selected.id === item.id && selected.type === item.type);
                                const isSelectedForSend = itemsToSend.some(selected => selected.id === item.id && selected.type === item.type);

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelectedForReceive || isSelectedForSend
                                            ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700'
                                            : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
                                            }`}
                                        onClick={() => !isSelectedForReceive && handleAddItem(item, item.type, 'receive')}
                                    >
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            {item.type === 'product' ? (
                                                <Package className={`w-4 h-4 ${isSelectedForReceive ? 'text-orange-600' : 'text-blue-500'}`} />
                                            ) : (
                                                <Wrench className={`w-4 h-4 ${isSelectedForReceive ? 'text-orange-600' : 'text-purple-500'}`} />
                                            )}
                                            <div className="text-right">
                                                <div className={`text-sm font-medium ${isSelectedForReceive ? 'text-orange-800 dark:text-orange-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {item.displayName}
                                                </div>
                                                <div className={`text-xs ${isSelectedForReceive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {item.sku}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <div className="flex items-center space-x-1 space-x-reverse">
                                                {/* Receive Button/Status - Swapped when swapPanels is true */}
                                                {(() => {
                                                    const targetModeForReceive = swapPanels ? 'send' : 'receive';
                                                    const targetModeForSend = swapPanels ? 'receive' : 'send';
                                                    const isSelectedForFirstButton = swapPanels ? isSelectedForSend : isSelectedForReceive;
                                                    const isSelectedForSecondButton = swapPanels ? isSelectedForReceive : isSelectedForSend;
                                                    const firstButtonText = swapPanels ? 'سحب' : 'استلام';
                                                    const secondButtonText = swapPanels ? 'زيادة' : 'إرسال';
                                                    const firstButtonStatusText = swapPanels ? 'للسحب' : 'للاستلام';
                                                    const secondButtonStatusText = swapPanels ? 'لزيادة' : 'للإرسال';
                                                    const firstButtonColors = swapPanels
                                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50';
                                                    const secondButtonColors = swapPanels
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50';
                                                    const firstButtonStatusColors = swapPanels
                                                        ? 'text-orange-600 dark:text-orange-400'
                                                        : 'text-orange-600 dark:text-orange-400';
                                                    const secondButtonStatusColors = swapPanels
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-green-600 dark:text-green-400';

                                                    return (
                                                        <>
                                                            {/* First Button (Receive/Send when swapped) */}
                                                            {isSelectedForFirstButton ? (
                                                                <span className={`${firstButtonStatusColors} text-xs font-cairo`}>
                                                                    {firstButtonStatusText}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAddItem(item, item.type, targetModeForReceive);
                                                                    }}
                                                                    className={`px-2 py-1 text-xs ${firstButtonColors} rounded transition-colors`}
                                                                >
                                                                    {firstButtonText}
                                                                </button>
                                                            )}

                                                            {/* Second Button (Send/Receive when swapped) */}
                                                            {isSelectedForSecondButton ? (
                                                                <span className={`${secondButtonStatusColors} text-xs font-cairo`}>
                                                                    {secondButtonStatusText}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAddItem(item, item.type, targetModeForSend);
                                                                    }}
                                                                    className={`px-2 py-1 text-xs ${secondButtonColors} rounded transition-colors`}
                                                                >
                                                                    {secondButtonText}
                                                                </button>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                            {searchQuery ? 'لا توجد نتائج للبحث' : `لا توجد ${replacementSearchMode === 'products' ? 'منتجات' : 'قطع'} متاحة`}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Items Summary - Horizontal Layout matching image style */}
            {(itemsToReceive.length > 0 || itemsToSend.length > 0) && (() => {
                // Determine which items to show in which panel based on swapPanels
                const leftPanelItems = swapPanels ? itemsToSend : itemsToReceive;
                const rightPanelItems = swapPanels ? itemsToReceive : itemsToSend;
                const leftPanelTitle = swapPanels ? (sendPanelTitle || 'إرسال') : (receivePanelTitle || 'استلام');
                const rightPanelTitle = swapPanels ? (receivePanelTitle || 'استلام') : (sendPanelTitle || 'إرسال');
                const leftPanelOnClear = swapPanels ? onItemsToSendChange : onItemsToReceiveChange;
                const rightPanelOnClear = swapPanels ? onItemsToReceiveChange : onItemsToSendChange;
                const leftPanelMode = swapPanels ? 'send' : 'receive';
                const rightPanelMode = swapPanels ? 'receive' : 'send';
                const leftPanelEmptyText = swapPanels ? 'لا توجد عناصر للإرسال' : 'لا توجد عناصر للاستلام';
                const rightPanelEmptyText = swapPanels ? 'لا توجد عناصر للاستلام' : 'لا توجد عناصر للإرسال';

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left Panel (Orange Theme) */}
                        <div className="border border-orange-300 dark:border-orange-700 rounded-lg overflow-hidden">
                            {/* Header with dark orange background */}
                            <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-800 dark:to-orange-900 p-3">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-medium text-orange-50 dark:text-orange-100 font-cairo">
                                        {leftPanelTitle}
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            leftPanelOnClear([]);
                                            pruneLineQtyDraftByPrefix(`${leftPanelMode}-`);
                                        }}
                                        className="text-xs text-orange-100 hover:text-white dark:text-orange-200 dark:hover:text-orange-50 font-cairo transition-colors"
                                    >
                                        مسح الكل
                                    </button>
                                </div>
                            </div>
                            {/* Content Area */}
                            <div className="bg-gray-50/80 dark:bg-gray-900/20 p-2 sm:p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                                {leftPanelItems.length > 0 ? (
                                    leftPanelItems.map((item, index) => {
                                        const dk = `${leftPanelMode}-${item.type}-${item.id}`;
                                        return (
                                            <ServiceLineItemCard
                                                key={`left-${item.type}-${item.id}-${index}`}
                                                itemType={item.type === 'part' ? 'part' : 'product'}
                                                name={item.name}
                                                sku={item.sku}
                                                quantity={item.quantity || 1}
                                                showPrice={false}
                                                onPriceInputChange={() => {}}
                                                conditionMode="readOnly"
                                                condition={item.condition === 'damaged' ? 'damaged' : 'valid'}
                                                qtyDraft={lineQtyDraft[dk]}
                                                onQtyDraftChange={(v) => setLineQtyDraft((p) => ({ ...p, [dk]: v }))}
                                                onQtyFocus={() =>
                                                    setLineQtyDraft((p) => ({ ...p, [dk]: String(item.quantity || 1) }))
                                                }
                                                onQtyBlur={() => {
                                                    const raw = lineQtyDraft[dk];
                                                    setLineQtyDraft((p) => {
                                                        const n = { ...p };
                                                        delete n[dk];
                                                        return n;
                                                    });
                                                    const fb = String(item.quantity || 1);
                                                    const n = parseInt(raw === undefined || raw === '' ? fb : raw, 10);
                                                    if (!Number.isNaN(n) && n >= 1) {
                                                        handleQuantityChange(item.id, item.type, Math.min(9999, n), leftPanelMode);
                                                    }
                                                }}
                                                onQuantityDelta={(d) => {
                                                    const q = Math.max(1, Math.min(9999, (item.quantity || 1) + d));
                                                    handleQuantityChange(item.id, item.type, q, leftPanelMode);
                                                    setLineQtyDraft((p) => {
                                                        const n = { ...p };
                                                        delete n[dk];
                                                        return n;
                                                    });
                                                }}
                                                onRemove={() => {
                                                    handleRemoveItem(item.id, item.type, leftPanelMode);
                                                    setLineQtyDraft((p) => {
                                                        const n = { ...p };
                                                        delete n[dk];
                                                        return n;
                                                    });
                                                }}
                                                disabled={disabled}
                                            />
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs">
                                        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="font-cairo">{leftPanelEmptyText}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel (Green Theme) */}
                        <div className="border border-green-300 dark:border-green-700 rounded-lg overflow-hidden">
                            {/* Header with dark green background */}
                            <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 p-3">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-medium text-green-50 dark:text-green-100 font-cairo">
                                        {rightPanelTitle}
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            rightPanelOnClear([]);
                                            pruneLineQtyDraftByPrefix(`${rightPanelMode}-`);
                                        }}
                                        className="text-xs text-green-100 hover:text-white dark:text-green-200 dark:hover:text-green-50 font-cairo transition-colors"
                                    >
                                        مسح الكل
                                    </button>
                                </div>
                            </div>
                            {/* Content Area */}
                            <div className="bg-gray-50/80 dark:bg-gray-900/20 p-2 sm:p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                                {rightPanelItems.length > 0 ? (
                                    rightPanelItems.map((item, index) => {
                                        const dk = `${rightPanelMode}-${item.type}-${item.id}`;
                                        return (
                                            <ServiceLineItemCard
                                                key={`right-${item.type}-${item.id}-${index}`}
                                                itemType={item.type === 'part' ? 'part' : 'product'}
                                                name={item.name}
                                                sku={item.sku}
                                                quantity={item.quantity || 1}
                                                showPrice={false}
                                                onPriceInputChange={() => {}}
                                                conditionMode="readOnly"
                                                condition={item.condition === 'damaged' ? 'damaged' : 'valid'}
                                                qtyDraft={lineQtyDraft[dk]}
                                                onQtyDraftChange={(v) => setLineQtyDraft((p) => ({ ...p, [dk]: v }))}
                                                onQtyFocus={() =>
                                                    setLineQtyDraft((p) => ({ ...p, [dk]: String(item.quantity || 1) }))
                                                }
                                                onQtyBlur={() => {
                                                    const raw = lineQtyDraft[dk];
                                                    setLineQtyDraft((p) => {
                                                        const n = { ...p };
                                                        delete n[dk];
                                                        return n;
                                                    });
                                                    const fb = String(item.quantity || 1);
                                                    const n = parseInt(raw === undefined || raw === '' ? fb : raw, 10);
                                                    if (!Number.isNaN(n) && n >= 1) {
                                                        handleQuantityChange(item.id, item.type, Math.min(9999, n), rightPanelMode);
                                                    }
                                                }}
                                                onQuantityDelta={(d) => {
                                                    const q = Math.max(1, Math.min(9999, (item.quantity || 1) + d));
                                                    handleQuantityChange(item.id, item.type, q, rightPanelMode);
                                                    setLineQtyDraft((p) => {
                                                        const n = { ...p };
                                                        delete n[dk];
                                                        return n;
                                                    });
                                                }}
                                                onRemove={() => {
                                                    handleRemoveItem(item.id, item.type, rightPanelMode);
                                                    setLineQtyDraft((p) => {
                                                        const n = { ...p };
                                                        delete n[dk];
                                                        return n;
                                                    });
                                                }}
                                                disabled={disabled}
                                            />
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs">
                                        <Truck className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="font-cairo">{rightPanelEmptyText}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );

    const renderReplacementInterface = () => (
        <div className="space-y-4">
            {/* Loading indicator for replacement interface */}
            {(isLoadingProducts || isLoadingParts) && (
                <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <LoadingSpinner size="md" />
                    <span className="mr-2 text-sm text-blue-700 dark:text-blue-300 font-cairo">
                        جاري تحميل البيانات...
                    </span>
                </div>
            )}

            {/* Integrated Search with Tabs */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                {/* Compact Tab Pills */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-1 space-x-reverse">
                        <button
                            type="button"
                            onClick={() => setReplacementSearchMode('products')}
                            className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${replacementSearchMode === 'products'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <Package className="w-3 h-3" />
                                <span>المنتجات</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setReplacementSearchMode('parts')}
                            className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${replacementSearchMode === 'parts'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <Wrench className="w-3 h-3" />
                                <span>القطع</span>
                            </div>
                        </button>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo">
                        {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                    </span>
                </div>

                {/* Search Input */}
                <div className="relative p-3">
                    <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`ابحث في ${activeTab === 'products' ? 'المنتجات' : 'القطع'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 dark:text-white transition-all"
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Items List - Always visible, filtered by search */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
                {/* Expand/Collapse Header */}
                <button
                    type="button"
                    onClick={() => handleToggleExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                            {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({filteredResults().length})
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {/* Items Container with Dynamic Height */}
                <div
                    className={`overflow-y-auto scrollbar-hide p-2 transition-all duration-300 ${isExpanded ? 'max-h-[24rem]' : 'max-h-52'
                        }`}
                >
                    {filteredResults().length > 0 ? (
                        <div className="space-y-1">
                            {filteredResults().map((item) => {
                                const isSelectedForSend = itemsToSend.some(selected => selected.id === item.id && selected.type === item.type);
                                const isSelectedForReceive = itemsToReceive.some(selected => selected.id === item.id && selected.type === item.type);

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelectedForSend || isSelectedForReceive
                                            ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                                            : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
                                            }`}
                                        onClick={() => !isSelectedForSend && handleAddItem(item, item.type, 'send')}
                                    >
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            {item.type === 'product' ? (
                                                <Package className={`w-4 h-4 ${isSelectedForSend ? 'text-blue-600' : 'text-blue-500'}`} />
                                            ) : (
                                                <Wrench className={`w-4 h-4 ${isSelectedForSend ? 'text-purple-600' : 'text-purple-500'}`} />
                                            )}
                                            <div className="text-right">
                                                <div className={`text-sm font-medium ${isSelectedForSend ? 'text-blue-800 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {item.displayName}
                                                </div>
                                                <div className={`text-xs ${isSelectedForSend ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {item.sku}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            {isSelectedForSend && (
                                                <span className="text-blue-600 dark:text-blue-400 text-xs font-cairo">
                                                    للإرسال
                                                </span>
                                            )}
                                            {isSelectedForReceive && (
                                                <span className="text-green-600 dark:text-green-400 text-xs font-cairo">
                                                    للاستلام
                                                </span>
                                            )}
                                            {!isSelectedForSend && !isSelectedForReceive && (
                                                <div className="flex items-center space-x-1 space-x-reverse">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddItem(item, item.type, 'send');
                                                        }}
                                                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                    >
                                                        إرسال
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddItem(item, item.type, 'receive');
                                                        }}
                                                        className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                    >
                                                        استلام
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                            {searchQuery ? 'لا توجد نتائج للبحث' : `لا توجد ${replacementSearchMode === 'products' ? 'منتجات' : 'قطع'} متاحة`}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Items Summary - Horizontal Layout */}
            {(itemsToSend.length > 0 || itemsToReceive.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Send Items Summary */}
                    <div className="border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="p-3 border-b border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 font-cairo">
                                        العناصر للإرسال ({itemsToSend.length})
                                    </h5>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onItemsToSendChange([]);
                                        pruneLineQtyDraftByPrefix('send-');
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-cairo"
                                >
                                    مسح الكل
                                </button>
                            </div>
                        </div>
                        <div className="p-2 sm:p-3 space-y-2 max-h-[min(16rem,50vh)] overflow-y-auto scrollbar-hide">
                            {itemsToSend.length > 0 ? (
                                itemsToSend.map((item, index) => {
                                    const dk = `send-${item.type}-${item.id}`;
                                    return (
                                        <ServiceLineItemCard
                                            key={`send-${item.type}-${item.id}-${index}`}
                                            itemType={item.type === 'part' ? 'part' : 'product'}
                                            name={item.name}
                                            sku={item.sku}
                                            quantity={item.quantity || 1}
                                            showPrice={false}
                                            onPriceInputChange={() => {}}
                                            conditionMode="toggle"
                                            condition={item.condition === 'damaged' ? 'damaged' : 'valid'}
                                            onConditionToggle={() =>
                                                handleConditionChange(
                                                    item.id,
                                                    item.type,
                                                    item.condition === 'valid' ? 'damaged' : 'valid',
                                                    'send'
                                                )
                                            }
                                            qtyDraft={lineQtyDraft[dk]}
                                            onQtyDraftChange={(v) => setLineQtyDraft((p) => ({ ...p, [dk]: v }))}
                                            onQtyFocus={() =>
                                                setLineQtyDraft((p) => ({ ...p, [dk]: String(item.quantity || 1) }))
                                            }
                                            onQtyBlur={() => {
                                                const raw = lineQtyDraft[dk];
                                                setLineQtyDraft((p) => {
                                                    const n = { ...p };
                                                    delete n[dk];
                                                    return n;
                                                });
                                                const fb = String(item.quantity || 1);
                                                const n = parseInt(raw === undefined || raw === '' ? fb : raw, 10);
                                                if (!Number.isNaN(n) && n >= 1) {
                                                    handleQuantityChange(item.id, item.type, Math.min(9999, n), 'send');
                                                }
                                            }}
                                            onQuantityDelta={(d) => {
                                                const q = Math.max(1, Math.min(9999, (item.quantity || 1) + d));
                                                handleQuantityChange(item.id, item.type, q, 'send');
                                                setLineQtyDraft((p) => {
                                                    const n = { ...p };
                                                    delete n[dk];
                                                    return n;
                                                });
                                            }}
                                            onRemove={() => {
                                                handleRemoveItem(item.id, item.type, 'send');
                                                setLineQtyDraft((p) => {
                                                    const n = { ...p };
                                                    delete n[dk];
                                                    return n;
                                                });
                                            }}
                                            disabled={disabled}
                                        />
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
                                    <Package className="w-4 h-4 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
                                    لا توجد عناصر للإرسال
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Receive Items Summary */}
                    <div className="border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="p-3 border-b border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <h5 className="text-sm font-medium text-green-800 dark:text-green-200 font-cairo">
                                        العناصر للاستلام ({itemsToReceive.length})
                                    </h5>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onItemsToReceiveChange([]);
                                        pruneLineQtyDraftByPrefix('receive-');
                                    }}
                                    className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-cairo"
                                >
                                    مسح الكل
                                </button>
                            </div>
                        </div>
                        <div className="p-2 sm:p-3 space-y-2 max-h-[min(16rem,50vh)] overflow-y-auto scrollbar-hide">
                            {itemsToReceive.length > 0 ? (
                                itemsToReceive.map((item, index) => {
                                    const dk = `receive-${item.type}-${item.id}`;
                                    return (
                                        <ServiceLineItemCard
                                            key={`receive-${item.type}-${item.id}-${index}`}
                                            itemType={item.type === 'part' ? 'part' : 'product'}
                                            name={item.name}
                                            sku={item.sku}
                                            quantity={item.quantity || 1}
                                            showPrice={false}
                                            onPriceInputChange={() => {}}
                                            conditionMode="toggle"
                                            condition={item.condition === 'damaged' ? 'damaged' : 'valid'}
                                            onConditionToggle={() =>
                                                handleConditionChange(
                                                    item.id,
                                                    item.type,
                                                    item.condition === 'valid' ? 'damaged' : 'valid',
                                                    'receive'
                                                )
                                            }
                                            qtyDraft={lineQtyDraft[dk]}
                                            onQtyDraftChange={(v) => setLineQtyDraft((p) => ({ ...p, [dk]: v }))}
                                            onQtyFocus={() =>
                                                setLineQtyDraft((p) => ({ ...p, [dk]: String(item.quantity || 1) }))
                                            }
                                            onQtyBlur={() => {
                                                const raw = lineQtyDraft[dk];
                                                setLineQtyDraft((p) => {
                                                    const n = { ...p };
                                                    delete n[dk];
                                                    return n;
                                                });
                                                const fb = String(item.quantity || 1);
                                                const n = parseInt(raw === undefined || raw === '' ? fb : raw, 10);
                                                if (!Number.isNaN(n) && n >= 1) {
                                                    handleQuantityChange(item.id, item.type, Math.min(9999, n), 'receive');
                                                }
                                            }}
                                            onQuantityDelta={(d) => {
                                                const q = Math.max(1, Math.min(9999, (item.quantity || 1) + d));
                                                handleQuantityChange(item.id, item.type, q, 'receive');
                                                setLineQtyDraft((p) => {
                                                    const n = { ...p };
                                                    delete n[dk];
                                                    return n;
                                                });
                                            }}
                                            onRemove={() => {
                                                handleRemoveItem(item.id, item.type, 'receive');
                                                setLineQtyDraft((p) => {
                                                    const n = { ...p };
                                                    delete n[dk];
                                                    return n;
                                                });
                                            }}
                                            disabled={disabled}
                                        />
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
                                    <RefreshCw className="w-4 h-4 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
                                    لا توجد عناصر للاستلام
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderReturnInterface = () => (
        <div className="space-y-4">
            {/* Loading indicator for return interface */}
            {(isLoadingProducts || isLoadingParts) && (
                <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <LoadingSpinner size="md" />
                    <span className="mr-2 text-sm text-blue-700 dark:text-blue-300 font-cairo">
                        جاري تحميل البيانات...
                    </span>
                </div>
            )}

            {/* Integrated Search with Tabs */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                {/* Compact Tab Pills */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-1 space-x-reverse">
                        <button
                            type="button"
                            onClick={() => setActiveTab('products')}
                            className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${activeTab === 'products'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <Package className="w-3 h-3" />
                                <span>المنتجات</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('parts')}
                            className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${activeTab === 'parts'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <Wrench className="w-3 h-3" />
                                <span>القطع</span>
                            </div>
                        </button>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo">
                        {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                    </span>
                </div>

                {/* Search Input */}
                <div className="relative p-3">
                    <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`ابحث في ${activeTab === 'products' ? 'المنتجات' : 'القطع'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all"
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Items List - Always visible, filtered by search */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
                {/* Expand/Collapse Header */}
                <button
                    type="button"
                    onClick={() => handleToggleExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                            {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({filteredResults().length})
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {/* Items Container with Dynamic Height */}
                <div
                    className={`overflow-y-auto scrollbar-hide p-2 transition-all duration-300 ${isExpanded ? 'max-h-[24rem]' : 'max-h-52'
                        }`}
                >
                    {filteredResults().length > 0 ? (
                        <div className="space-y-1">
                            {filteredResults().map((item) => {
                                const isSelected = itemsToReceive.some(selected => selected.id === item.id && selected.type === item.type);

                                return (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelected
                                            ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                                            : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
                                            }`}
                                        onClick={() => !isSelected && handleAddItem(item, item.type)}
                                    >
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            {item.type === 'product' ? (
                                                <Package className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-blue-500'}`} />
                                            ) : (
                                                <Wrench className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-purple-500'}`} />
                                            )}
                                            <div className="text-right">
                                                <div className={`text-sm font-medium ${isSelected ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                                    {item.displayName}
                                                </div>
                                                <div className={`text-xs ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {item.sku}
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected ? (
                                            <span className="text-green-600 dark:text-green-400 text-sm font-cairo">
                                                محدد
                                            </span>
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                            {searchQuery ? 'لا توجد نتائج للبحث' : `لا توجد ${activeTab === 'products' ? 'منتجات' : 'قطع'} متاحة`}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Items Management - Bottom Section */}
            {itemsToReceive.length > 0 ? (
                <div className="border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="p-3 border-b border-green-200 dark:border-green-700">
                        <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium text-green-800 dark:text-green-200 font-cairo">
                                العناصر المحددة ({itemsToReceive.length})
                            </h5>
                            <button
                                type="button"
                                onClick={() => {
                                    onItemsToReceiveChange([]);
                                    pruneLineQtyDraftByPrefix('return-');
                                }}
                                className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-cairo"
                            >
                                مسح الكل
                            </button>
                        </div>
                    </div>
                    <div className="p-2 sm:p-3 space-y-2 max-h-[min(14rem,45vh)] overflow-y-auto scrollbar-hide">
                        {itemsToReceive.map((item, index) => {
                            const dk = `return-${item.type}-${item.id}`;
                            return (
                                <ServiceLineItemCard
                                    key={`${item.type}-${item.id}-${index}`}
                                    itemType={item.type === 'part' ? 'part' : 'product'}
                                    name={item.name}
                                    sku={item.sku}
                                    quantity={item.quantity || 1}
                                    showPrice={false}
                                    onPriceInputChange={() => {}}
                                    conditionMode="readOnly"
                                    condition={item.condition === 'damaged' ? 'damaged' : 'valid'}
                                    qtyDraft={lineQtyDraft[dk]}
                                    onQtyDraftChange={(v) => setLineQtyDraft((p) => ({ ...p, [dk]: v }))}
                                    onQtyFocus={() =>
                                        setLineQtyDraft((p) => ({ ...p, [dk]: String(item.quantity || 1) }))
                                    }
                                    onQtyBlur={() => {
                                        const raw = lineQtyDraft[dk];
                                        setLineQtyDraft((p) => {
                                            const n = { ...p };
                                            delete n[dk];
                                            return n;
                                        });
                                        const fb = String(item.quantity || 1);
                                        const n = parseInt(raw === undefined || raw === '' ? fb : raw, 10);
                                        if (!Number.isNaN(n) && n >= 1) {
                                            handleQuantityChange(item.id, item.type, Math.min(9999, n), 'receive');
                                        }
                                    }}
                                    onQuantityDelta={(d) => {
                                        const q = Math.max(1, Math.min(9999, (item.quantity || 1) + d));
                                        handleQuantityChange(item.id, item.type, q, 'receive');
                                        setLineQtyDraft((p) => {
                                            const n = { ...p };
                                            delete n[dk];
                                            return n;
                                        });
                                    }}
                                    onRemove={() => {
                                        handleRemoveItem(item.id, item.type);
                                        setLineQtyDraft((p) => {
                                            const n = { ...p };
                                            delete n[dk];
                                            return n;
                                        });
                                    }}
                                    disabled={disabled}
                                />
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Package className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs font-cairo">
                        لم يتم اختيار عناصر للاستلام
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        اضغط على "إضافة عنصر" للبحث والإضافة
                    </p>
                </div>
            )}
        </div>
    );

    const renderDefaultInterface = () => (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo">
                اختيار العناصر
            </h4>
            {renderItemsList()}
        </div>
    );

    const renderItemsList = (mode = 'default') => {
        // For return actions, only use itemsToReceive (return items)
        const items = mode === 'receive' ? itemsToReceive :
            mode === 'default' ? itemsToSend : itemsToSend;

        if (items.length === 0) {
            return (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Package className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs font-cairo">
                        {mode === 'send' ? 'لم يتم اختيار عناصر للإرسال' :
                            mode === 'receive' ? 'لم يتم اختيار عناصر للاستلام' :
                                'لم يتم اختيار أي عناصر'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        اضغط على "إضافة عنصر" للبحث والإضافة
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {items.map((item) => {
                    const itemKey = `${item.type}-${item.id}`;
                    const availability = stockAvailability[itemKey];
                    const isOutOfStock = availability && !availability.isAvailable;

                    return (
                        <div
                            key={itemKey}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${isOutOfStock
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                : mode === 'send'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                    : mode === 'receive'
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${item.type === 'product'
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                    : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                    }`}>
                                    {getItemIcon(item)}
                                </div>

                                <div className="text-right">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {item.name}
                                        </span>
                                        {getConditionIcon(item.condition)}
                                        {isOutOfStock && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        SKU: {item.sku} | الكمية: {item.quantity}
                                    </div>
                                    {isOutOfStock && (
                                        <div className="text-xs text-red-600 dark:text-red-400">
                                            المخزون غير كافي
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse">
                                {/* Quantity Controls */}
                                <div className="flex items-center space-x-1 space-x-reverse bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(item.id, item.type, item.quantity - 1, 'send')}
                                        disabled={item.quantity <= 1 || disabled}
                                        className="w-6 h-6 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, item.type, parseInt(e.target.value) || 1, 'send')}
                                        className="w-8 text-center text-xs bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
                                        disabled={disabled}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(item.id, item.type, item.quantity + 1, 'send')}
                                        disabled={disabled}
                                        className="w-6 h-6 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Condition Selector for Exchange Items */}
                                {supportsExchange && (
                                    <select
                                        value={item.condition || 'valid'}
                                        onChange={(e) => handleConditionChange(item.id, item.type, e.target.value)}
                                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        disabled={disabled}
                                    >
                                        <option value="valid">سليم (للإرسال)</option>
                                        <option value="damaged">تالف (للاستلام)</option>
                                    </select>
                                )}

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id, item.type)}
                                    disabled={disabled}
                                    className="w-6 h-6 rounded flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render sell interface - shows search/selection UI and selectedParts/selectedProducts with price editing
    const renderSellInterface = () => {
        const allSelectedItems = [...selectedParts, ...selectedProducts];

        const getSellUnitPrice = (item) => {
            const hasOverride = item.price_customer !== undefined && item.price_customer !== null;
            const basePrice =
                customerType === 'merchant'
                    ? (item.price_merchant_base ?? 0)
                    : (item.price_customer_base ?? 0);
            return hasOverride ? (parseFloat(item.price_customer) || 0) : basePrice;
        };

        const sellRowKey = (item) => `sell-${item.type}-${item.id}`;

        const patchSellItem = (item, patch) => {
            if (item.type === 'part') {
                onPartsChange(selectedParts.map((p) => (p.id === item.id ? { ...p, ...patch } : p)));
            } else {
                onProductsChange(selectedProducts.map((p) => (p.id === item.id ? { ...p, ...patch } : p)));
            }
        };

        const handleSellPriceChange = (item, newPrice) => {
            patchSellItem(item, { price_customer: newPrice });
        };

        const handleSellQtyDelta = (item, delta) => {
            const q = Math.max(1, Math.min(9999, (item.quantity || 1) + delta));
            patchSellItem(item, { quantity: q });
            setLineQtyDraft((prev) => {
                const next = { ...prev };
                delete next[sellRowKey(item)];
                return next;
            });
        };

        const handleSellQtyFocus = (item) => {
            setLineQtyDraft((prev) => ({ ...prev, [sellRowKey(item)]: String(item.quantity || 1) }));
        };

        const handleSellQtyBlur = (item) => {
            const k = sellRowKey(item);
            const raw = lineQtyDraft[k];
            setLineQtyDraft((prev) => {
                const next = { ...prev };
                delete next[k];
                return next;
            });
            const fallback = String(item.quantity || 1);
            const n = parseInt(raw === undefined || raw === '' ? fallback : raw, 10);
            if (Number.isNaN(n) || n < 1) return;
            patchSellItem(item, { quantity: Math.min(9999, n) });
        };

        const renderSellLineCard = (item) => {
            const basePrice =
                customerType === 'merchant' ? (item.price_merchant_base ?? null) : (item.price_customer_base ?? null);
            const hasOverride = item.price_customer !== undefined && item.price_customer !== null;
            const priceInputValue = hasOverride ? item.price_customer : (basePrice ?? 0);
            const k = sellRowKey(item);

            return (
                <ServiceLineItemCard
                    key={k}
                    itemType={item.type === 'part' ? 'part' : 'product'}
                    name={item.name}
                    sku={item.sku}
                    quantity={item.quantity || 1}
                    showPrice
                    effectiveUnitPrice={getSellUnitPrice(item)}
                    priceInputValue={priceInputValue}
                    onPriceInputChange={(n) => handleSellPriceChange(item, n)}
                    conditionMode="none"
                    qtyDraft={lineQtyDraft[k]}
                    onQtyDraftChange={(v) => setLineQtyDraft((prev) => ({ ...prev, [k]: v }))}
                    onQtyFocus={() => handleSellQtyFocus(item)}
                    onQtyBlur={() => handleSellQtyBlur(item)}
                    onQuantityDelta={(d) => handleSellQtyDelta(item, d)}
                    onRemove={() => {
                        setLineQtyDraft((prev) => {
                            const next = { ...prev };
                            delete next[k];
                            return next;
                        });
                        if (item.type === 'part') {
                            onPartsChange(selectedParts.filter((p) => p.id !== item.id));
                        } else {
                            onProductsChange(selectedProducts.filter((p) => p.id !== item.id));
                        }
                    }}
                    disabled={disabled}
                />
            );
        };

        return (
            <div className="space-y-4">
                {/* Loading indicator */}
                {(isLoadingProducts || isLoadingParts) && (
                    <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <LoadingSpinner size="md" />
                        <span className="mr-2 text-sm text-green-700 dark:text-green-300 font-cairo">
                            جاري تحميل البيانات...
                        </span>
                    </div>
                )}

                {/* Integrated Search with Tabs */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                    {/* Compact Tab Pills */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-1 space-x-reverse">
                            <button
                                type="button"
                                onClick={() => setActiveTab('products')}
                                className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${activeTab === 'products'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-1 space-x-reverse">
                                    <Package className="w-3 h-3" />
                                    <span>المنتجات</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('parts')}
                                className={`px-3 py-1.5 text-xs rounded-full transition-all font-cairo ${activeTab === 'parts'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-1 space-x-reverse">
                                    <Wrench className="w-3 h-3" />
                                    <span>القطع</span>
                                </div>
                            </button>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo">
                            {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                        </span>
                    </div>

                    {/* Search Input */}
                    <div className="relative p-3">
                        <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`ابحث في ${activeTab === 'products' ? 'المنتجات' : 'القطع'}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-white transition-all"
                            dir="rtl"
                        />
                    </div>
                </div>

                {/* Items List - Always visible, filtered by search */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    {/* Expand/Collapse Header */}
                    <button
                        type="button"
                        onClick={() => handleToggleExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({filteredResults().length})
                            </span>
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                    </button>

                    {/* Items Container with Dynamic Height */}
                    <div
                        className={`overflow-y-auto scrollbar-hide p-2 transition-all duration-300 ${isExpanded ? 'max-h-[24rem]' : 'max-h-52'
                            }`}
                    >
                        {filteredResults().length > 0 ? (
                            <div className="space-y-1">
                                {filteredResults().map((item) => {
                                    const isSelected = activeTab === 'products' 
                                        ? selectedProducts.some(p => p.id === item.id)
                                        : selectedParts.some(p => p.id === item.id);

                                    return (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelected
                                                ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                                                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
                                                }`}
                                            onClick={() => {
                                                if (!isSelected) {
                                                    handleAddItem(item, item.type);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                {item.type === 'product' ? (
                                                    <Package className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-blue-500'}`} />
                                                ) : (
                                                    <Wrench className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-purple-500'}`} />
                                                )}
                                                <div className="text-right">
                                                    <div className={`text-sm font-medium ${isSelected ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                                        {item.displayName}
                                                    </div>
                                                    <div className={`text-xs ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {item.sku}
                                                    </div>
                                                </div>
                                            </div>

                                            {isSelected ? (
                                                <span className="text-green-600 dark:text-green-400 text-sm font-cairo">
                                                    محدد
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddItem(item, item.type);
                                                    }}
                                                    className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                >
                                                    إضافة
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                {searchQuery ? 'لا توجد نتائج للبحث' : `لا توجد ${activeTab === 'products' ? 'منتجات' : 'قطع'} متاحة`}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected lines — same card system as CallSessionFAB / OrderItemsEditor */}
                {allSelectedItems.length > 0 && (
                    <div className="border border-green-300 dark:border-green-700 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 p-3">
                            <div className="flex items-center justify-between">
                                <h5 className="text-sm font-medium text-green-50 dark:text-green-100 font-cairo">
                                    العناصر المحددة للبيع ({allSelectedItems.length})
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onPartsChange([]);
                                        onProductsChange([]);
                                        pruneLineQtyDraftByPrefix('sell-');
                                    }}
                                    className="text-xs text-green-100 hover:text-white dark:text-green-200 dark:hover:text-green-50 font-cairo transition-colors"
                                >
                                    مسح الكل
                                </button>
                            </div>
                        </div>
                        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 bg-gray-50/80 dark:bg-gray-900/30">
                            {selectedProducts.length > 0 && (
                                <div className="space-y-2">{selectedProducts.map((item) => renderSellLineCard(item))}</div>
                            )}
                            {selectedParts.length > 0 && (
                                <div className="space-y-2">{selectedParts.map((item) => renderSellLineCard(item))}</div>
                            )}
                        </div>
                        {sellCostSummarySlot ? (
                                <div className="border-t border-gray-200 dark:border-gray-700 px-2.5 py-2 sm:px-3 sm:py-2.5">
                                    {sellCostSummarySlot}
                                </div>
                            ) : (
                            (() => {
                                const total = allSelectedItems.reduce((sum, item) => {
                                    const quantity = item.quantity || 1;
                                    return sum + quantity * getSellUnitPrice(item);
                                }, 0);
                                return (
                                    <div className="bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-700 p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                الإجمالي:
                                            </span>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400 font-cairo tabular-nums">
                                                {new Intl.NumberFormat('ar-EG', {
                                                    style: 'currency',
                                                    currency: 'EGP',
                                                    minimumFractionDigits: 2,
                                                }).format(total)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                )}

                {sellCostSummarySlot && allSelectedItems.length === 0 && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-sm">
                        {sellCostSummarySlot}
                    </div>
                )}
            </div>
        );
    };

    // Render different interfaces based on action type
    const renderActionSpecificInterface = () => {
        // Sell Action - Parts and Products with pricing
        if (isSellAction) {
            return renderSellInterface();
        }

        // Maintenance Action - Receive first, then send back
        if (isMaintenanceAction) {
            return renderMaintenanceInterface();
        }

        // Replacement Actions - Send and Receive cycle
        if (isReplacementAction) {
            return renderReplacementInterface();
        }

        // Return Action - Receive only
        if (isReturnAction) {
            return renderReturnInterface();
        }

        // Default fallback
        return renderDefaultInterface();
    };

    return (
        <div className="space-y-4">
            {/* Clean Section Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                    {isSellAction ? 'عناصر المبيعات' :
                        isReplacementAction ? 'عناصر الاستبدال' :
                            isReturnAction ? 'العناصر المرتجعة' :
                                isMaintenanceAction ? 'استلام / إرسال' :
                                    'العناصر المرسلة'}
                </h3>
                <button
                    type="button"
                    onClick={loadProductsAndParts}
                    disabled={isLoadingProducts || isLoadingParts}
                    className="flex items-center space-x-1 space-x-reverse px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-md transition-colors disabled:opacity-50"
                    title="تحديث البيانات"
                >
                    {(isLoadingProducts || isLoadingParts) ? (
                        <LoadingSpinner size="sm" />
                    ) : (
                        <RefreshCw className="w-3 h-3" />
                    )}
                    <span className="font-cairo">تحديث</span>
                </button>
            </div>

            {/* Pre-selected items info - For default actions only (not maintenance, replacement, return, or sell) */}
            {!isReturnAction && !isReplacementAction && !isMaintenanceAction && !isSellAction && itemsToSend.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
                    <div className="flex items-center space-x-2 space-x-reverse text-xs">
                        <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-800 dark:text-blue-200 font-cairo">
                            تم تحديد {itemsToSend.length} عنصر مسبقاً
                        </span>
                    </div>
                </div>
            )}

            {/* Action-specific content */}
            {isReturnAction ? renderReturnInterface() : renderActionSpecificInterface()}


            {/* Selected Items List - For default actions only (not maintenance, replacement, return, or sell) */}
            {!isReturnAction && !isReplacementAction && !isMaintenanceAction && !isSellAction && (itemsToSend.length > 0 ? (
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                            العناصر المحددة ({itemsToSend.length})
                        </h4>
                        {supportsExchange && (
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <ArrowRightLeft className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs text-purple-600 dark:text-purple-400">دورة الاستبدال</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
                        {itemsToSend.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${isExchangeItem(item)
                                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.type === 'product'
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                        }`}>
                                        {getItemIcon(item)}
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center space-x-1 space-x-reverse">
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                {item.name}
                                            </span>
                                            {getConditionIcon(item.condition)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            SKU: {item.sku}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 space-x-reverse">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center space-x-1 space-x-reverse bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange(item.id, item.type, item.quantity - 1, 'send')}
                                            disabled={item.quantity <= 1 || disabled}
                                            className="w-6 h-6 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500 disabled:opacity-50"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(item.id, item.type, parseInt(e.target.value) || 1, 'send')}
                                            className="w-8 text-center text-xs bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
                                            disabled={disabled}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange(item.id, item.type, item.quantity + 1, 'send')}
                                            disabled={disabled}
                                            className="w-6 h-6 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Condition Selector for Exchange Items */}
                                    {supportsExchange && (
                                        <div className="flex items-center space-x-1 space-x-reverse">
                                            <div className="relative group">
                                                <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                                                <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                                    <div className="text-xs font-cairo">
                                                        <div className="flex items-center space-x-1 space-x-reverse mb-1">
                                                            <CheckCircle className="w-3 h-3 text-green-400" />
                                                            <span>سليم: العنصر المرسل للعميل سليم</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1 space-x-reverse">
                                                            <RotateCcw className="w-3 h-3 text-red-400" />
                                                            <span>تالف: العنصر المستلم من العميل تالف</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <select
                                                value={item.condition || 'valid'}
                                                onChange={(e) => handleConditionChange(item.id, item.type, e.target.value)}
                                                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                disabled={disabled}
                                            >
                                                <option value="valid">سليم</option>
                                                <option value="damaged">تالف</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id, item.type)}
                                        disabled={disabled}
                                        className="w-6 h-6 rounded flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Package className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs font-cairo">
                        {isReplacementAction ? 'لم يتم اختيار عناصر للاستبدال' :
                            isMaintenanceAction ? 'لم يتم اختيار عناصر للصيانة' :
                                'لم يتم اختيار أي عناصر'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">اضغط على "إضافة عنصر" للبحث والإضافة</p>
                </div>
            ))}
        </div>
    );
};


ItemsSelectionSection.propTypes = {
    action: PropTypes.object,
    actionType: PropTypes.string,
    selectedProducts: PropTypes.array,
    selectedParts: PropTypes.array,
    itemsToSend: PropTypes.array,
    itemsToReceive: PropTypes.array,
    onProductsChange: PropTypes.func,
    onPartsChange: PropTypes.func,
    onItemsToSendChange: PropTypes.func,
    onItemsToReceiveChange: PropTypes.func,
    onSuccess: PropTypes.func,
    isLoading: PropTypes.bool,
    disabled: PropTypes.bool,
    showReceiveSection: PropTypes.bool,
    enableAutoRefresh: PropTypes.bool,
    refreshInterval: PropTypes.number,
    receivePanelTitle: PropTypes.string,
    sendPanelTitle: PropTypes.string,
    swapPanels: PropTypes.bool,
    customerType: PropTypes.string,
    sellCostSummarySlot: PropTypes.node
};

export default ItemsSelectionSection;