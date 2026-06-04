import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Package, Wrench, Plus, Minus, X, ChevronDown, ChevronUp, RefreshCw, ArrowDownToLine, ArrowUpFromLine, CheckCircle, RotateCcw, Loader, Settings } from 'lucide-react';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';
import { stockAPI } from '../../api/stockAPI';
import { scanTracking } from '../../api/hubAPI';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const ManualChangeModal = ({ isOpen, onClose, onSuccess, initialSearchQuery = '' }) => {
    const { userInfo } = useAuth();

    // Tracking number and ticket state
    const [trackingNumber, setTrackingNumber] = useState('');
    const [ticketInfo, setTicketInfo] = useState(null);
    const [isSearchingTicket, setIsSearchingTicket] = useState(false);

    // Products and parts state
    const [products, setProducts] = useState([]);
    const [parts, setParts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingParts, setIsLoadingParts] = useState(false);

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('products');
    const [isExpanded, setIsExpanded] = useState(false);

    // Selected items state
    const [itemsOut, setItemsOut] = useState([]); // Items decreasing stock
    const [itemsIn, setItemsIn] = useState([]); // Items increasing stock

    // Form state
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load products and parts
    const loadProducts = useCallback(async () => {
        setIsLoadingProducts(true);
        try {
            const result = await stockAPI.getProducts({ limit: 100 });
            if (result.success) {
                setProducts(result.data.items || []);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('فشل في تحميل المنتجات');
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const loadParts = useCallback(async () => {
        setIsLoadingParts(true);
        try {
            const result = await stockAPI.getParts({ limit: 100 });
            if (result.success) {
                setParts(result.data.items || []);
            }
        } catch (error) {
            console.error('Error loading parts:', error);
            toast.error('فشل في تحميل القطع');
        } finally {
            setIsLoadingParts(false);
        }
    }, []);

    const loadProductsAndParts = useCallback(async () => {
        await Promise.all([loadProducts(), loadParts()]);
    }, [loadProducts, loadParts]);

    // Load data on mount
    useEffect(() => {
        if (isOpen) {
            loadProductsAndParts();
        }
    }, [isOpen, loadProductsAndParts]);

    // Set initial search query when modal opens with scanned value
    useEffect(() => {
        if (isOpen && initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
            setIsExpanded(true); // Auto-expand to show search results
        }
    }, [isOpen, initialSearchQuery]);

    // Search tracking number
    const handleSearchTracking = useCallback(async () => {
        if (!trackingNumber.trim()) {
            toast.error('يرجى إدخال رقم التتبع');
            return;
        }

        setIsSearchingTicket(true);
        try {
            const result = await scanTracking(trackingNumber.trim());
            if (result.success && result.data?.found && result.data?.context?.ticket) {
                setTicketInfo(result.data.context.ticket);
                toast.success(`تم العثور على طلب خدمة #${result.data.context.ticket.id}`);
            } else {
                setTicketInfo(null);
                toast.error('لم يتم العثور على طلب خدمة بهذا الرقم');
            }
        } catch (error) {
            console.error('Error searching tracking:', error);
            toast.error('حدث خطأ أثناء البحث عن رقم التتبع');
            setTicketInfo(null);
        } finally {
            setIsSearchingTicket(false);
        }
    }, [trackingNumber]);

    // Filter items based on search
    const filteredItems = useMemo(() => {
        const items = activeTab === 'products' ? products : parts;

        if (!searchQuery.trim()) {
            return items;
        }

        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            item.name?.toLowerCase().includes(query) ||
            item.sku?.toLowerCase().includes(query)
        );
    }, [products, parts, activeTab, searchQuery]);

    // Handle adding item to out (decrease) or in (increase)
    const handleAddItem = useCallback((item, direction) => {
        const itemData = {
            id: item.id,
            sku: item.sku,
            name: item.name,
            type: item.type,
            quantity: 1,
            condition: 'valid'
        };

        if (direction === 'out') {
            const exists = itemsOut.find(i => i.id === item.id && i.type === item.type);
            if (!exists) {
                setItemsOut(prev => [...prev, itemData]);
                setSearchQuery('');
            }
        } else {
            const exists = itemsIn.find(i => i.id === item.id && i.type === item.type);
            if (!exists) {
                setItemsIn(prev => [...prev, itemData]);
                setSearchQuery('');
            }
        }
    }, [itemsOut, itemsIn]);

    // Handle quantity change
    const handleQuantityChange = useCallback((itemId, type, quantity, direction) => {
        const qty = Math.max(1, parseInt(quantity) || 1);

        if (direction === 'out') {
            setItemsOut(prev => prev.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, quantity: qty }
                    : item
            ));
        } else {
            setItemsIn(prev => prev.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, quantity: qty }
                    : item
            ));
        }
    }, []);

    // Handle condition change
    const handleConditionChange = useCallback((itemId, type, condition, direction) => {
        if (direction === 'out') {
            setItemsOut(prev => prev.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, condition }
                    : item
            ));
        } else {
            setItemsIn(prev => prev.map(item =>
                item.id === itemId && item.type === type
                    ? { ...item, condition }
                    : item
            ));
        }
    }, []);

    // Handle remove item
    const handleRemoveItem = useCallback((itemId, type, direction) => {
        if (direction === 'out') {
            setItemsOut(prev => prev.filter(item => !(item.id === itemId && item.type === type)));
        } else {
            setItemsIn(prev => prev.filter(item => !(item.id === itemId && item.type === type)));
        }
    }, []);

    // Reset form and close (must be before handleSubmit which references it)
    const handleClose = useCallback(() => {
        setTrackingNumber('');
        setTicketInfo(null);
        setItemsOut([]);
        setItemsIn([]);
        setNotes('');
        setSearchQuery('');
        setActiveTab('products');
        setIsExpanded(false);
        onClose();
    }, [onClose]);

    // Handle submit
    const handleSubmit = useCallback(async () => {
        if (itemsOut.length === 0 && itemsIn.length === 0) {
            toast.error('يرجى إضافة عنصر واحد على الأقل');
            return;
        }

        setIsSubmitting(true);
        const errors = [];
        const successes = [];

        try {
            // Process items out (negative quantities)
            for (const item of itemsOut) {
                try {
                    const result = await stockAPI.manualStockAdjustment({
                        sku: item.sku,
                        quantity: -item.quantity, // Negative for decrease
                        condition: item.condition,
                        user_id: userInfo?.id ?? 'system',
                        ticket_id: ticketInfo?.id || undefined,
                        notes: notes || undefined
                    });

                    if (result.success) {
                        successes.push(item.name);
                    } else {
                        errors.push(`${item.name}: ${result.message}`);
                    }
                } catch (error) {
                    errors.push(`${item.name}: حدث خطأ`);
                }
            }

            // Process items in (positive quantities)
            for (const item of itemsIn) {
                try {
                    const result = await stockAPI.manualStockAdjustment({
                        sku: item.sku,
                        quantity: item.quantity, // Positive for increase
                        condition: item.condition,
                        user_id: userInfo?.id ?? 'system',
                        ticket_id: ticketInfo?.id || undefined,
                        notes: notes || undefined
                    });

                    if (result.success) {
                        successes.push(item.name);
                    } else {
                        errors.push(`${item.name}: ${result.message}`);
                    }
                } catch (error) {
                    errors.push(`${item.name}: حدث خطأ`);
                }
            }

            if (errors.length > 0) {
                toast.error(`فشل تعديل ${errors.length} عنصر`);
            }

            if (successes.length > 0) {
                toast.success(`تم تعديل ${successes.length} عنصر بنجاح`);
                if (onSuccess) onSuccess();
                handleClose();
            }
        } catch (error) {
            console.error('Error submitting manual change:', error);
            toast.error('حدث خطأ أثناء تعديل المخزون');
        } finally {
            setIsSubmitting(false);
        }
    }, [itemsOut, itemsIn, ticketInfo, notes, onSuccess, handleClose, userInfo]);

    if (!isOpen) return null;

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-3xl"
            maxHeight="max-h-[90vh]"
        >
            <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                    title="تعديل يدوي"
                    subtitle="تعديل المخزون يدوياً للعناصر"
                    icon={Settings}
                    iconColor="from-blue-500 to-blue-600"
                    onClose={handleClose}
                    isSubmitting={isSubmitting}
                />
            </div>

            {/* Content - Scrollable Area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4" dir="rtl">
                    {/* Tracking Number Lookup */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">
                        رقم التتبع (اختياري - للربط بطلب خدمة)
                    </label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchTracking()}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500"
                            placeholder="أدخل رقم التتبع..."
                            dir="rtl"
                        />
                        <button
                            onClick={handleSearchTracking}
                            disabled={isSearchingTicket || !trackingNumber.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-cairo text-sm font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-1 space-x-reverse"
                        >
                            {isSearchingTicket ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    <span>جاري البحث...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4" />
                                    <span>بحث</span>
                                </>
                            )}
                        </button>
                        {ticketInfo && (
                            <button
                                onClick={() => {
                                    setTicketInfo(null);
                                    setTrackingNumber('');
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg font-cairo text-sm"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {ticketInfo && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="font-medium text-blue-800 dark:text-blue-200 font-cairo text-sm">
                                        مرتبط بطلب خدمة #{ticketInfo.id}
                                    </span>
                                </div>
                                {ticketInfo.ticket_number && (
                                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                        {ticketInfo.ticket_number}
                                    </span>
                                )}
                            </div>

                            {/* Notes */}
                            {ticketInfo.notes && (
                                <div className="mb-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 font-cairo">
                                        الملاحظات:
                                    </div>
                                    <div className="text-xs text-blue-800 dark:text-blue-200 font-cairo bg-white dark:bg-blue-900/30 p-2 rounded">
                                        {ticketInfo.notes}
                                    </div>
                                </div>
                            )}

                            {/* Items */}
                            {ticketInfo.items && ticketInfo.items.length > 0 && (
                                <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 font-cairo">
                                        العناصر ({ticketInfo.items.length}):
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
                                        {ticketInfo.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between text-xs bg-white dark:bg-blue-900/30 p-1.5 rounded">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    {item.type === 'product' ? (
                                                        <Package className="w-3 h-3 text-blue-500" />
                                                    ) : (
                                                        <Wrench className="w-3 h-3 text-purple-500" />
                                                    )}
                                                    <span className="text-blue-800 dark:text-blue-200 font-cairo font-medium">
                                                        {item.name || item.item_name || '-'}
                                                    </span>
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        ({item.sku})
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${item.condition === 'valid'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                        {item.condition === 'valid' ? 'سليم' : 'تالف'}
                                                    </span>
                                                    <span className="text-blue-700 dark:text-blue-300">
                                                        {item.direction === 'send' ? 'إرسال' : 'استلام'}: {item.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Items Selection Section */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                    {/* Tabs */}
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
                        <button
                            onClick={loadProductsAndParts}
                            disabled={isLoadingProducts || isLoadingParts}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="تحديث"
                        >
                            {isLoadingProducts || isLoadingParts ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative p-3">
                        <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`ابحث في ${activeTab === 'products' ? 'المنتجات' : 'القطع'}...`}
                            className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 dark:text-white transition-all font-cairo"
                            dir="rtl"
                        />
                    </div>

                    {/* Items List */}
                    <div className="border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                    {activeTab === 'products' ? 'المنتجات المتاحة' : 'القطع المتاحة'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({filteredItems.length})
                                </span>
                            </div>
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="p-2 max-h-60 overflow-y-auto scrollbar-hide">
                                {(isLoadingProducts && activeTab === 'products') || (isLoadingParts && activeTab === 'parts') ? (
                                    <div className="flex items-center justify-center py-4">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                ) : filteredItems.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredItems.map((item) => {
                                            const isSelectedOut = itemsOut.some(i => i.id === item.id && i.type === item.type);
                                            const isSelectedIn = itemsIn.some(i => i.id === item.id && i.type === item.type);

                                            return (
                                                <div
                                                    key={`${item.type}-${item.id}`}
                                                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${isSelectedOut || isSelectedIn
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                                                        : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        {item.type === 'product' ? (
                                                            <Package className="w-4 h-4 text-blue-500" />
                                                        ) : (
                                                            <Wrench className="w-4 h-4 text-purple-500" />
                                                        )}
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {item.sku}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2 space-x-reverse">
                                                        {/* Action Buttons - Always visible */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddItem(item, 'out')}
                                                            disabled={isSelectedOut}
                                                            className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-cairo flex items-center space-x-1 space-x-reverse"
                                                        >
                                                            <ArrowUpFromLine className="w-3 h-3" />
                                                            <span>نقصان</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddItem(item, 'in')}
                                                            disabled={isSelectedIn}
                                                            className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-cairo flex items-center space-x-1 space-x-reverse"
                                                        >
                                                            <ArrowDownToLine className="w-3 h-3" />
                                                            <span>زيادة</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm font-cairo">
                                        {searchQuery ? 'لا توجد نتائج للبحث' : `لا توجد ${activeTab === 'products' ? 'منتجات' : 'قطع'} متاحة`}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Items - Two Columns */}
                {(itemsOut.length > 0 || itemsIn.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Items Out (Decrease) */}
                        <div className="border border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <div className="p-3 border-b border-red-200 dark:border-red-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <ArrowUpFromLine className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        <h5 className="text-sm font-medium text-red-800 dark:text-red-200 font-cairo">
                                            نقصان المخزون ({itemsOut.length})
                                        </h5>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setItemsOut([])}
                                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-cairo"
                                    >
                                        مسح الكل
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                                {itemsOut.map((item, index) => (
                                    <div key={`out-${item.type}-${item.id}-${index}`} className="bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                {item.type === 'product' ? (
                                                    <Package className="w-3 h-3 text-blue-500" />
                                                ) : (
                                                    <Wrench className="w-3 h-3 text-purple-500" />
                                                )}
                                                <div className="text-right">
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.sku}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => handleConditionChange(item.id, item.type, item.condition === 'valid' ? 'damaged' : 'valid', 'out')}
                                                className="flex items-center space-x-1 space-x-reverse text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                            >
                                                {item.condition === 'valid' ? (
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <RotateCcw className="w-3 h-3 text-red-500" />
                                                )}
                                                <span className="text-gray-700 dark:text-gray-300 font-cairo">
                                                    {item.condition === 'valid' ? 'سليم' : 'تالف'}
                                                </span>
                                            </button>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <div className="flex items-center space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item.id, item.type, item.quantity - 1, 'out')}
                                                        disabled={item.quantity <= 1}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-medium text-red-600 dark:text-red-400">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item.id, item.type, item.quantity + 1, 'out')}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id, item.type, 'out')}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Items In (Increase) */}
                        <div className="border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <div className="p-3 border-b border-green-200 dark:border-green-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <ArrowDownToLine className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <h5 className="text-sm font-medium text-green-800 dark:text-green-200 font-cairo">
                                            زيادة المخزون ({itemsIn.length})
                                        </h5>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setItemsIn([])}
                                        className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-cairo"
                                    >
                                        مسح الكل
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                                {itemsIn.map((item, index) => (
                                    <div key={`in-${item.type}-${item.id}-${index}`} className="bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                {item.type === 'product' ? (
                                                    <Package className="w-3 h-3 text-blue-500" />
                                                ) : (
                                                    <Wrench className="w-3 h-3 text-purple-500" />
                                                )}
                                                <div className="text-right">
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.sku}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => handleConditionChange(item.id, item.type, item.condition === 'valid' ? 'damaged' : 'valid', 'in')}
                                                className="flex items-center space-x-1 space-x-reverse text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                            >
                                                {item.condition === 'valid' ? (
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                ) : (
                                                    <RotateCcw className="w-3 h-3 text-red-500" />
                                                )}
                                                <span className="text-gray-700 dark:text-gray-300 font-cairo">
                                                    {item.condition === 'valid' ? 'سليم' : 'تالف'}
                                                </span>
                                            </button>
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                                <div className="flex items-center space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item.id, item.type, item.quantity - 1, 'in')}
                                                        disabled={item.quantity <= 1}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-medium text-green-600 dark:text-green-400">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuantityChange(item.id, item.type, item.quantity + 1, 'in')}
                                                        className="w-5 h-5 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id, item.type, 'in')}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">
                        ملاحظات (اختياري)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500"
                        placeholder="أضف ملاحظات حول التعديل..."
                        dir="rtl"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-cairo text-sm font-medium"
                    >
                        إلغاء
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || (itemsOut.length === 0 && itemsIn.length === 0)}
                        className="px-6 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 hover:from-brand-blue-700 hover:to-brand-blue-800 disabled:from-gray-400 disabled:to-gray-500 flex items-center space-x-2 space-x-reverse"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>جاري المعالجة...</span>
                            </>
                        ) : (
                            <span>حفظ التعديلات</span>
                        )}
                    </button>
                </div>
                </div>
            </div>
        </ServiceModalWrapper>
    );
};

export default ManualChangeModal;
