import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { stockAPI } from '../../api/stockAPI';
import { executeTicketAction } from '../../api/ticketsAPI';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';
import { ClipboardCheck } from 'lucide-react';

const ReturnClassificationModal = ({
    isOpen,
    onClose,
    ticket,
    onClassificationComplete
}) => {
    const [returnedItems, setReturnedItems] = useState([]);
    const [globalNotes, setGlobalNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stockItems, setStockItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'products', 'parts'
    const [showSearchSection, setShowSearchSection] = useState(false);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen && !isSubmitting) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, isSubmitting]);

    // Load stock data when modal opens
    useEffect(() => {
        if (isOpen) {
            loadStockItems();
            if (ticket?.items) {
                loadReturnedItems();
            }
        }
    }, [isOpen, ticket]);

    // Load all available stock items
    const loadStockItems = async () => {
        try {
            // For sell tickets, only load parts (not products)
            const isSell = ticket?.service_type === 'sell';
            if (isSell) {
                const response = await stockAPI.getStockItems({ type: 'part', limit: 1000 });
                if (response.success && response.data?.items) {
                    setStockItems(response.data.items);
                } else {
                    toast.error('فشل في تحميل عناصر المخزون');
                }
            } else {
                const response = await stockAPI.getItems();
                if (response.success && response.data) {
                    setStockItems(response.data);
                } else {
                    toast.error('فشل في تحميل عناصر المخزون');
                }
            }
        } catch (error) {
            console.error('Failed to load stock items:', error);
            toast.error('فشل في تحميل عناصر المخزون');
        }
    };

    const loadReturnedItems = async () => {
        if (!ticket?.items) return;

        try {
            // For sell tickets, filter items with direction: "send" (parts that were sent)
            // For other tickets, filter items with direction: "receive" (returned items)
            const isSell = ticket.service_type === 'sell';
            const itemsToLoad = ticket.items.filter(item => {
                const direction = (item.direction || '').toLowerCase();
                if (isSell) {
                    // For sell tickets, only load parts from send direction
                    return direction === 'send' && item.type === 'part';
                } else {
                    return direction === 'receive';
                }
            });

            if (itemsToLoad.length === 0) {
                // No need for error toast, we'll show empty state and allow adding items
                return;
            }

            // Create a map of stock items for reference
            const stockMap = {};
            stockItems.forEach(item => {
                stockMap[`${item.type}-${item.id}`] = item;
            });

            // Initialize returned items with classification data
            const initializedItems = itemsToLoad.map(item => {
                const stockKey = `${item.type}-${item.item_id}`;
                const stockItem = stockMap[stockKey];

                return {
                    ...item,
                    stockDetails: stockItem,
                    condition: item.condition || 'valid',
                    validQuantity: item.condition === 'valid' ? item.quantity : 0,
                    damagedQuantity: item.condition === 'damaged' ? item.quantity : 0
                };
            });

            setReturnedItems(initializedItems);
        } catch (error) {
            console.error('Failed to load returned items:', error);
            toast.error('فشل في تحميل العناصر المرتجعة');
        }
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

    // Updated to adjust total quantity as well
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

    // Filter stock items based on search query and selected tab
    const getFilteredStockItems = () => {
        let filteredItems = stockItems;

        // Filter by tab first
        if (selectedTab !== 'all') {
            filteredItems = filteredItems.filter(item => item.type === selectedTab);
        }

        // If there's a search query, filter by it
        if (searchQuery.trim()) {
            filteredItems = filteredItems.filter(item => {
                const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                const skuMatch = item.sku.toLowerCase().includes(searchQuery.toLowerCase());
                return nameMatch || skuMatch;
            });
        }

        return filteredItems;
    };

    // Add a new item from search to returned items
    const handleAddItemFromSearch = (stockItem) => {
        // Check if item already exists in returnedItems
        const existingItemIndex = returnedItems.findIndex(
            item => item.item_id === stockItem.id && item.type === stockItem.type
        );

        if (existingItemIndex >= 0) {
            // Update quantity if item already exists
            setReturnedItems(prev =>
                prev.map((item, index) =>
                    index === existingItemIndex
                        ? { ...item, quantity: item.quantity + 1, validQuantity: item.validQuantity + 1 }
                        : item
                )
            );
            toast.success(`تم زيادة كمية ${stockItem.name}`);
        } else {
            // Add new item
            const newItem = {
                id: `temp-${Date.now()}`, // Temporary ID until saved
                item_id: stockItem.id,
                type: stockItem.type,
                name: stockItem.name,
                sku: stockItem.sku,
                quantity: 1,
                direction: 'receive',
                condition: 'valid',
                validQuantity: 1,
                damagedQuantity: 0,
                stockDetails: stockItem
            };

            setReturnedItems(prev => [...prev, newItem]);
            toast.success(`تمت إضافة ${stockItem.name}`);
        }

        // Clear search
        setSearchQuery('');
        setShowSearchResults(false);
    };

    // Remove an item from returned items
    const handleRemoveItem = (index) => {
        setReturnedItems(prev => prev.filter((_, i) => i !== index));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!ticket) {
            toast.error('لم يتم العثور على التذكرة');
            return;
        }

        if (returnedItems.length === 0) {
            toast.error('لا توجد عناصر للتصنيف');
            return;
        }

        setIsSubmitting(true);
        try {
            // Get user_id from localStorage or use default
            const user_id = localStorage.getItem('user_id') || '1';

            // Prepare item_validations array in the format expected by backend
            // The backend expects: [{item_id, quantity, condition}]
            const item_validations = [];

            returnedItems.forEach(item => {
                // If item has valid quantity, add it as 'valid'
                if (item.validQuantity > 0) {
                    item_validations.push({
                        item_id: item.item_id,
                        quantity: item.validQuantity,
                        condition: 'valid'
                    });
                }

                // If item has damaged quantity, add it as 'damaged'
                if (item.damagedQuantity > 0) {
                    item_validations.push({
                        item_id: item.item_id,
                        quantity: item.damagedQuantity,
                        condition: 'damaged'
                    });
                }
            });

            // Call the backend API with validate_items action
            const actionData = {
                action: 'validate_items',
                user_id: parseInt(user_id),
                item_validations: item_validations,
                notes: globalNotes || undefined
            };

            const result = await executeTicketAction(ticket.id, actionData);

            if (result) {
                const validCount = returnedItems.reduce((sum, item) => sum + item.validQuantity, 0);
                const damagedCount = returnedItems.reduce((sum, item) => sum + item.damagedQuantity, 0);

                toast.success(`تم التصنيف بنجاح: ${validCount} سليم، ${damagedCount} تالف`);

                onClassificationComplete({
                    ticket_id: ticket.id,
                    item_validations,
                    globalNotes,
                    completed: true,
                    result
                });
                handleClose();
            } else {
                toast.error('فشل في تصنيف العناصر');
            }
        } catch (error) {
            console.error('Error classifying returned items:', error);
            const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ في تصنيف العناصر المرتجعة';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setReturnedItems([]);
            setGlobalNotes('');
            setStockItems({});
            onClose();
        }
    };

    if (!isOpen || !ticket) return null;

    const trackingNumber = ticket.original_tracking || ticket.tracking_number || 'غير محدد';
    const customerName = ticket.customer_name || 'غير محدد';
    const ticketNumber = ticket.ticket_number || 'غير محدد';

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-2xl"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title="تصنيف العناصر المرتجعة"
                    subtitle="تحديد حالة كل عنصر مرتجع (سليم أو تالف)"
                    icon={ClipboardCheck}
                    iconColor="from-indigo-500 to-purple-600"
                    onClose={handleClose}
                    isSubmitting={isSubmitting}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 space-y-4" dir="rtl">
                    {/* Ticket Information - Compact */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo">العميل:</span>
                                <span className="text-xs text-gray-900 dark:text-gray-100 font-cairo font-semibold">{customerName}</span>
                            </div>
                            <div className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-cairo">
                                {ticket.service_type === 'replacement' ? 'استبدال' :
                                    ticket.service_type === 'maintenance' ? 'صيانة' : 'إرجاع'}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-1.5">
                                <span className="text-gray-600 dark:text-gray-400 font-cairo block">رقم التتبع الأصلي</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">{trackingNumber}</span>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-800/50 rounded p-1.5">
                                <span className="text-gray-600 dark:text-gray-400 font-cairo block">رقم التتبع الجديد</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">{ticket.new_tracking_receive || 'غير محدد'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Item Search Section - Collapsible */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowSearchSection(!showSearchSection)}
                            className="flex items-center justify-between w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
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
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTab('all');
                                                setShowSearchResults(false);
                                            }}
                                            className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedTab === 'all'
                                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            الكل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTab('product');
                                                setShowSearchResults(true);
                                            }}
                                            className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedTab === 'product'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            منتجات
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTab('part');
                                                setShowSearchResults(true);
                                            }}
                                            className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedTab === 'part'
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
                                            selectedTab === 'product' ? 'ابحث عن منتج أو اضغط للعرض الكل...' :
                                                selectedTab === 'part' ? 'ابحث عن قطعة أو اضغط للعرض الكل...' :
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
                                    {showSearchResults && (searchQuery.trim() || selectedTab !== 'all') && (
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
                                                        selectedTab === 'product' ? 'لا توجد منتجات متاحة' :
                                                            selectedTab === 'part' ? 'لا توجد قطع متاحة' :
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
                                    const stockItem = item.stockDetails;
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
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-cairo flex-shrink-0">
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
                                                                        const newValidQty = item.condition === 'valid' ? newQty : item.validQuantity;
                                                                        const newDamagedQty = item.condition === 'damaged' ? newQty - item.validQuantity : item.damagedQuantity;
                                                                        handleItemQuantitySplit(index, newValidQty, newDamagedQty);
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
                                                                        const newQty = item.quantity - 1;
                                                                        const newValidQty = item.condition === 'valid' ? newQty : item.validQuantity;
                                                                        const newDamagedQty = item.condition === 'damaged' ? newQty - item.validQuantity : item.damagedQuantity;
                                                                        handleItemQuantitySplit(index, newValidQty, newDamagedQty);
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
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-cairo">لا توجد عناصر مرتجعة للتصنيف</p>
                            </div>
                        )}
                    </div>

                    {/* Global Notes */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                            ملاحظات عامة
                        </label>
                        <textarea
                            value={globalNotes}
                            onChange={(e) => setGlobalNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"
                            dir="rtl"
                            placeholder="ملاحظات إضافية عن جميع العناصر المرتجعة..."
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
                            disabled={isSubmitting || returnedItems.length === 0}
                            className="px-6 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50"
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
                                'تأكيد التصنيف'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </ServiceModalWrapper>
    );
};

export default ReturnClassificationModal;
